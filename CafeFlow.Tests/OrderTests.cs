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
    public class OrderTests
    {
        private readonly Mock<IHubContext<OrderHub>> _mockHub;

        public OrderTests()
        {
            _mockHub = new Mock<IHubContext<OrderHub>>();
            var mockClients = new Mock<IHubClients>();
            var mockClientProxy = new Mock<IClientProxy>();

            mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
            _mockHub.Setup(h => h.Clients).Returns(mockClients.Object);
        }

        [Fact]
        public async Task CreateOrder_WithValidItems_CalculatesTotalStrictlyOnServer()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);

            var dto = new CreateOrderDto
            {
                Notes = "Hızlı lütfen",
                Items = new List<CreateOrderItemDto>
                {
                    new() { MenuItemId = item.Id, Quantity = 3 }
                }
            };

            var order = await service.CreateOrderAsync(customer.Id, dto);

            order.Should().NotBeNull();
            order!.CustomerId.Should().Be(customer.Id);
            order.Status.Should().Be(OrderStatus.Received);
            order.TotalAmount.Should().Be(150.00m, "Server calculated 3 * 50.00 TL");
            order.Items.Should().HaveCount(1);
            order.Items[0].ItemName.Should().Be("Latte");
            order.Items[0].UnitPrice.Should().Be(50.00m);
            order.StatusHistory.Should().HaveCount(1);
            order.StatusHistory[0].ToStatus.Should().Be(OrderStatus.Received);
        }

        [Fact]
        public async Task CreateOrder_WithEmptyItems_ReturnsNull()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);

            var dto = new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto>()
            };

            var order = await service.CreateOrderAsync(customer.Id, dto);
            order.Should().BeNull();
        }

        [Fact]
        public async Task CreateOrder_WithUnavailableItem_ReturnsNull()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);
            item.IsAvailable = false;
            await db.SaveChangesAsync();

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);

            var dto = new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto>
                {
                    new() { MenuItemId = item.Id, Quantity = 1 }
                }
            };

            var order = await service.CreateOrderAsync(customer.Id, dto);
            order.Should().BeNull();
        }

        [Fact]
        public async Task CreateOrder_WithDuplicateItemsInRequest_ConsolidatesQuantities()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);

            var dto = new CreateOrderDto
            {
                Items = new List<CreateOrderItemDto>
                {
                    new() { MenuItemId = item.Id, Quantity = 2 },
                    new() { MenuItemId = item.Id, Quantity = 3 }
                }
            };

            var order = await service.CreateOrderAsync(customer.Id, dto);

            order.Should().NotBeNull();
            order!.Items.Should().HaveCount(1);
            order.Items[0].Quantity.Should().Be(5);
            order.TotalAmount.Should().Be(250.00m);
        }

        [Fact]
        public async Task CreateOrder_WithIdempotencyKey_PreventsDuplicateOrders()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new OrderService(db, _mockHub.Object, NullLogger<OrderService>.Instance);

            var idempotencyKey = Guid.NewGuid().ToString();
            var dto = new CreateOrderDto
            {
                IdempotencyKey = idempotencyKey,
                Items = new List<CreateOrderItemDto>
                {
                    new() { MenuItemId = item.Id, Quantity = 2 }
                }
            };

            var order1 = await service.CreateOrderAsync(customer.Id, dto);
            var order2 = await service.CreateOrderAsync(customer.Id, dto);

            order1.Should().NotBeNull();
            order2.Should().NotBeNull();
            order1!.Id.Should().Be(order2!.Id, "Repeated idempotent requests must return the original order");
            db.Orders.Count(o => o.CustomerId == customer.Id).Should().Be(1);
        }
    }
}
