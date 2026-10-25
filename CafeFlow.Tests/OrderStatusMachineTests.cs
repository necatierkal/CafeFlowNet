using CafeFlow.API.DTOs;
using CafeFlow.API.Hubs;
using CafeFlow.API.Models;
using CafeFlow.API.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace CafeFlow.Tests
{
    public class OrderStatusMachineTests
    {
        private readonly Mock<IHubContext<OrderHub>> _mockHub;

        public OrderStatusMachineTests()
        {
            _mockHub = new Mock<IHubContext<OrderHub>>();
            var mockClients = new Mock<IHubClients>();
            var mockClientProxy = new Mock<IClientProxy>();

            mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
            _mockHub.Setup(h => h.Clients).Returns(mockClients.Object);
        }

        [Fact]
        public async Task StatusTransitions_FollowValidLifecycleSuccessfully()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (admin, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);
            var order = await service.CreateOrderAsync(customer.Id, new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto> { new() { MenuItemId = item.Id, Quantity = 1 } }
            });

            order!.Status.Should().Be(OrderStatus.Received);

            // Received -> Preparing
            var preparing = await service.UpdateStatusAsync(order.Id, OrderStatus.Preparing, admin.Id, admin.FullName, "Hazırlanıyor");
            preparing!.Status.Should().Be(OrderStatus.Preparing);

            // Preparing -> Ready
            var ready = await service.UpdateStatusAsync(order.Id, OrderStatus.Ready, admin.Id, admin.FullName, "Sipariş hazır");
            ready!.Status.Should().Be(OrderStatus.Ready);

            // Ready -> Completed
            var completed = await service.UpdateStatusAsync(order.Id, OrderStatus.Completed, admin.Id, admin.FullName, "Teslim edildi");
            completed!.Status.Should().Be(OrderStatus.Completed);

            // Verify status history
            completed.StatusHistory.Should().HaveCount(4); // Initial + 3 transitions
        }

        [Fact]
        public async Task CompletedOrder_CannotBeReopenedOrModified()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (admin, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);
            var order = await service.CreateOrderAsync(customer.Id, new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto> { new() { MenuItemId = item.Id, Quantity = 1 } }
            });

            await service.UpdateStatusAsync(order!.Id, OrderStatus.Preparing);
            await service.UpdateStatusAsync(order.Id, OrderStatus.Ready);
            await service.UpdateStatusAsync(order.Id, OrderStatus.Completed);

            // Attempting to move back from Completed to Preparing must throw InvalidOperationException
            var act = async () => await service.UpdateStatusAsync(order.Id, OrderStatus.Preparing, admin.Id, admin.FullName);
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Completed*durumundaki bir sipariş*Preparing*durumuna geçirilemez*");
        }

        [Fact]
        public async Task CancelledOrder_CannotBeReactivated()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (admin, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);
            var order = await service.CreateOrderAsync(customer.Id, new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto> { new() { MenuItemId = item.Id, Quantity = 1 } }
            });

            // Cancel order
            await service.UpdateStatusAsync(order!.Id, OrderStatus.Cancelled, admin.Id, admin.FullName, "Müşteri isteği");

            // Attempting to move from Cancelled to Ready must throw
            var act = async () => await service.UpdateStatusAsync(order.Id, OrderStatus.Ready, admin.Id, admin.FullName);
            await act.Should().ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task CustomerCancellation_AllowedOnlyInReceivedState()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (admin, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);

            // Order 1: Received state -> Customer can cancel
            var order1 = await service.CreateOrderAsync(customer.Id, new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto> { new() { MenuItemId = item.Id, Quantity = 1 } }
            });

            var cancelledOrder = await service.CustomerCancelOrderAsync(order1!.Id, customer.Id, "Vazgeçtim");
            cancelledOrder.Should().NotBeNull();
            cancelledOrder!.Status.Should().Be(OrderStatus.Cancelled);
            cancelledOrder.CancellationReason.Should().Contain("Vazgeçtim");

            // Order 2: In Preparing state -> Customer CANNOT cancel
            var order2 = await service.CreateOrderAsync(customer.Id, new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto> { new() { MenuItemId = item.Id, Quantity = 1 } }
            });
            await service.UpdateStatusAsync(order2!.Id, OrderStatus.Preparing, admin.Id);

            var act = async () => await service.CustomerCancelOrderAsync(order2.Id, customer.Id, "Geç kaldım");
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*hazırlanmaya başlanmamış*");
        }
    }
}
