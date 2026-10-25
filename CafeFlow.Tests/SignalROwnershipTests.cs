using System.Security.Claims;
using CafeFlow.API.Hubs;
using CafeFlow.API.Models;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace CafeFlow.Tests
{
    public class SignalROwnershipTests
    {
        [Fact]
        public async Task JoinOrderGroup_WhenCustomerOwnsOrder_AllowsSubscription()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Received,
                TotalAmount = 50.00m,
                CreatedAt = DateTime.UtcNow
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var hub = new OrderHub(db, NullLogger<OrderHub>.Instance);

            var mockContext = new Mock<HubCallerContext>();
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, customer.Id.ToString()),
                new Claim(ClaimTypes.Role, "LoyalCustomer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            mockContext.Setup(c => c.User).Returns(principal);
            mockContext.Setup(c => c.ConnectionId).Returns("conn-123");

            var mockGroups = new Mock<IGroupManager>();
            mockGroups.Setup(g => g.AddToGroupAsync("conn-123", $"order-{order.Id}", default))
                .Returns(Task.CompletedTask);

            hub.Context = mockContext.Object;
            hub.Groups = mockGroups.Object;

            // Act: customer joins their own order group
            await hub.JoinOrderGroup(order.Id.ToString());

            // Assert: group manager was invoked
            mockGroups.Verify(g => g.AddToGroupAsync("conn-123", $"order-{order.Id}", default), Times.Once);
        }

        [Fact]
        public async Task JoinOrderGroup_WhenCustomerDoesNotOwnOrder_ThrowsHubException()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, victimCustomer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var attackerUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "attacker@test.com",
                FullName = "Attacker User",
                Role = UserRole.LoyalCustomer,
                IsActive = true
            };
            db.Users.Add(attackerUser);

            var victimOrder = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = victimCustomer.Id,
                Status = OrderStatus.Received,
                TotalAmount = 50.00m,
                CreatedAt = DateTime.UtcNow
            };
            db.Orders.Add(victimOrder);
            await db.SaveChangesAsync();

            var hub = new OrderHub(db, NullLogger<OrderHub>.Instance);

            var mockContext = new Mock<HubCallerContext>();
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, attackerUser.Id.ToString()),
                new Claim(ClaimTypes.Role, "LoyalCustomer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            mockContext.Setup(c => c.User).Returns(principal);
            mockContext.Setup(c => c.ConnectionId).Returns("conn-attacker");

            var mockGroups = new Mock<IGroupManager>();
            hub.Context = mockContext.Object;
            hub.Groups = mockGroups.Object;

            // Act & Assert: attacker tries to subscribe to victim's order
            var act = async () => await hub.JoinOrderGroup(victimOrder.Id.ToString());

            await act.Should().ThrowAsync<HubException>()
                .WithMessage("*izleme yetkiniz bulunmamaktadır*");

            mockGroups.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
        }

        [Fact]
        public async Task JoinOrderGroup_WhenAdminJoins_AllowsSubscriptionRegardlessOfOwnership()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (admin, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var customerOrder = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Received,
                TotalAmount = 50.00m,
                CreatedAt = DateTime.UtcNow
            };
            db.Orders.Add(customerOrder);
            await db.SaveChangesAsync();

            var hub = new OrderHub(db, NullLogger<OrderHub>.Instance);

            var mockContext = new Mock<HubCallerContext>();
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            mockContext.Setup(c => c.User).Returns(principal);
            mockContext.Setup(c => c.ConnectionId).Returns("conn-admin");

            var mockGroups = new Mock<IGroupManager>();
            mockGroups.Setup(g => g.AddToGroupAsync("conn-admin", $"order-{customerOrder.Id}", default))
                .Returns(Task.CompletedTask);

            hub.Context = mockContext.Object;
            hub.Groups = mockGroups.Object;

            // Act: admin joins customer's order group
            await hub.JoinOrderGroup(customerOrder.Id.ToString());

            mockGroups.Verify(g => g.AddToGroupAsync("conn-admin", $"order-{customerOrder.Id}", default), Times.Once);
        }
    }
}
