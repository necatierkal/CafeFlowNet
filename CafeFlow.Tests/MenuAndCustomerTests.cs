using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using CafeFlow.API.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace CafeFlow.Tests
{
    public class MenuAndCustomerTests
    {
        private readonly IOptions<JwtSettings> _jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "super_secret_test_key_minimum_32_characters_long_2026!",
            Issuer = "CafeFlow.Test",
            Audience = "CafeFlow.TestClient",
            AccessTokenExpiryMinutes = 15,
            RefreshTokenExpiryDays = 7
        });

        [Fact]
        public async Task CreateMenuItem_WithNegativePrice_ThrowsArgumentException()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, _, category, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new MenuService(db, NullLogger<MenuService>.Instance);

            var act = async () => await service.CreateItemAsync(new CreateMenuItemDto
            {
                CategoryId = category.Id,
                Name = "Hatalı Ürün",
                Price = -15.00m
            });

            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage("*sıfır veya pozitif*");
        }

        [Fact]
        public async Task DeleteItem_WhenItemHasPastOrders_PerformsSoftDeleteToPreserveOrderHistory()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, item) = await TestDbHelper.SeedBasicDataAsync(db);

            // Create past order with this item
            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Completed,
                TotalAmount = 50.00m,
                CreatedAt = DateTime.UtcNow
            };
            order.OrderItems.Add(new OrderItem
            {
                MenuItemId = item.Id,
                ItemName = item.Name,
                UnitPrice = item.Price,
                Quantity = 1
            });
            db.Orders.Add(order);
            await db.SaveChangesAsync();

            var service = new MenuService(db, NullLogger<MenuService>.Instance);
            var deleted = await service.DeleteItemAsync(item.Id);

            deleted.Should().BeTrue();

            // Item must remain in database with IsDeleted = true, IsAvailable = false
            var itemInDb = await db.MenuItems.FindAsync(item.Id);
            itemInDb.Should().NotBeNull();
            itemInDb!.IsDeleted.Should().BeTrue();
            itemInDb.IsAvailable.Should().BeFalse();

            // Menu item must NOT appear in public menu
            var publicMenu = await service.GetFullMenuAsync(includeUnavailable: false);
            publicMenu.SelectMany(c => c.Items).Any(i => i.Id == item.Id).Should().BeFalse();

            // Existing order line item is preserved
            var orderItem = db.OrderItems.First(oi => oi.MenuItemId == item.Id);
            orderItem.ItemName.Should().Be("Latte");
        }

        [Fact]
        public async Task DeleteItem_WhenItemHasNoOrders_HardDeletesItem()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, _, category, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new MenuService(db, NullLogger<MenuService>.Instance);
            var newItem = await service.CreateItemAsync(new CreateMenuItemDto
            {
                CategoryId = category.Id,
                Name = "Geçici Ürün",
                Price = 25.00m
            });

            var deleted = await service.DeleteItemAsync(newItem.Id);
            deleted.Should().BeTrue();

            var itemInDb = await db.MenuItems.FindAsync(newItem.Id);
            itemInDb.Should().BeNull();
        }

        [Fact]
        public async Task DeactivatingCustomer_ImmediatelyRevokesAllActiveRefreshTokens()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (admin, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var authService = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var login = await authService.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });
            login.Should().NotBeNull();

            // Verify active token exists
            db.RefreshTokens.Count(rt => rt.UserId == customer.Id && rt.RevokedAt == null).Should().Be(1);

            var loyaltyService = new LoyaltyService(db, authService, NullLogger<LoyaltyService>.Instance);

            // Admin deactivates the customer
            var updated = await loyaltyService.ToggleCustomerStatusAsync(customer.Id, false);
            updated!.IsActive.Should().BeFalse();

            // All refresh tokens must now be revoked
            var activeTokens = db.RefreshTokens.Count(rt => rt.UserId == customer.Id && rt.RevokedAt == null);
            activeTokens.Should().Be(0, "Deactivating customer must revoke all active sessions");

            // Customer cannot refresh token anymore
            var refreshAttempt = await authService.RefreshTokenAsync(login!.RefreshToken);
            refreshAttempt.Should().BeNull();
        }
    }
}
