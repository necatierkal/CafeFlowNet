using CafeFlow.API.Models;
using CafeFlow.API.Services;
using FluentAssertions;

namespace CafeFlow.Tests
{
    public class ReportTests
    {
        [Fact]
        public async Task DashboardReport_CalculatesMetricsFromRealOrdersAccurately()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, category, item) = await TestDbHelper.SeedBasicDataAsync(db);

            var item2 = new MenuItem
            {
                Id = 101,
                CategoryId = category.Id,
                Name = "Cheesecake",
                Price = 80.00m,
                IsAvailable = true
            };
            db.MenuItems.Add(item2);

            var now = DateTime.UtcNow;

            // Order 1: Completed today (100 TL)
            var order1 = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Completed,
                TotalAmount = 100.00m,
                CreatedAt = now
            };
            order1.OrderItems.Add(new OrderItem { MenuItemId = item.Id, ItemName = item.Name, UnitPrice = 50.00m, Quantity = 2 });

            // Order 2: Completed today (80 TL)
            var order2 = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Completed,
                TotalAmount = 80.00m,
                CreatedAt = now
            };
            order2.OrderItems.Add(new OrderItem { MenuItemId = item2.Id, ItemName = item2.Name, UnitPrice = 80.00m, Quantity = 1 });

            // Order 3: Active (Preparing) today (50 TL)
            var order3 = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Preparing,
                TotalAmount = 50.00m,
                CreatedAt = now
            };

            // Order 4: Cancelled today (50 TL) - Must NOT be counted in revenue
            var order4 = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Cancelled,
                TotalAmount = 50.00m,
                CreatedAt = now
            };

            db.Orders.AddRange(order1, order2, order3, order4);
            await db.SaveChangesAsync();

            var service = new ReportService(db);
            var report = await service.GetDashboardSummaryAsync();

            report.TodayOrdersCount.Should().Be(4);
            report.CompletedOrdersCount.Should().Be(2);
            report.CancelledOrdersCount.Should().Be(1);
            report.ActiveOrdersCount.Should().Be(1);

            // Revenue: Only completed orders (100 + 80 = 180 TL)
            report.TodayRevenue.Should().Be(180.00m);
            report.AverageOrderValue.Should().Be(90.00m, "180 TL / 2 completed orders = 90 TL");

            // Top selling items
            report.TopSellingItems.Should().NotBeEmpty();
            report.TopSellingItems[0].Name.Should().Be("Latte");
            report.TopSellingItems[0].QuantitySold.Should().Be(2);

            // Category breakdown
            report.CategorySales.Should().NotBeEmpty();
            report.CategorySales[0].CategoryName.Should().Be("Kahveler");
        }
    }
}
