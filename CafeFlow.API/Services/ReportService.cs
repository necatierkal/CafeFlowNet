using CafeFlow.API.Data;
using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.API.Services
{
    public interface IReportService
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(DateTime? fromDate = null, DateTime? toDate = null);
    }

    public class ReportService : IReportService
    {
        private readonly AppDbContext _db;

        public ReportService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var now = DateTime.UtcNow;
            var todayStart = now.Date;

            // Default range to last 30 days if not specified
            var rangeStart = fromDate?.Date ?? todayStart.AddDays(-29);
            var rangeEnd = toDate?.Date.AddDays(1).AddTicks(-1) ?? todayStart.AddDays(1).AddTicks(-1);

            // Today metrics
            var todayOrders = await _db.Orders
                .Where(o => o.CreatedAt >= todayStart && o.CreatedAt <= now)
                .ToListAsync();

            var todayOrdersCount = todayOrders.Count;
            var todayRevenue = todayOrders
                .Where(o => o.Status == OrderStatus.Completed)
                .Sum(o => o.TotalAmount);

            // Current active orders (all-time open)
            var activeOrdersCount = await _db.Orders
                .CountAsync(o => o.Status == OrderStatus.Received || 
                                 o.Status == OrderStatus.Preparing || 
                                 o.Status == OrderStatus.Ready);

            // Range orders query
            var rangeOrdersQuery = _db.Orders
                .Where(o => o.CreatedAt >= rangeStart && o.CreatedAt <= rangeEnd);

            var rangeOrders = await rangeOrdersQuery
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
                .ThenInclude(mi => mi!.Category)
                .ToListAsync();

            var rangeOrdersCount = rangeOrders.Count;
            var completedOrders = rangeOrders.Where(o => o.Status == OrderStatus.Completed).ToList();
            var completedCount = completedOrders.Count;
            var cancelledCount = rangeOrders.Count(o => o.Status == OrderStatus.Cancelled);
            var rangeRevenue = completedOrders.Sum(o => o.TotalAmount);
            var averageOrderValue = completedCount > 0 ? Math.Round(rangeRevenue / completedCount, 2) : 0m;

            var totalCustomersCount = await _db.Users
                .CountAsync(u => u.Role == UserRole.LoyalCustomer && u.IsActive);

            // Top selling items in completed orders
            var topSelling = completedOrders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => new { oi.MenuItemId, oi.ItemName })
                .Select(g => new TopSellingItemDto
                {
                    MenuItemId = g.Key.MenuItemId,
                    Name = g.Key.ItemName,
                    QuantitySold = g.Sum(x => x.Quantity),
                    TotalRevenue = g.Sum(x => x.UnitPrice * x.Quantity)
                })
                .OrderByDescending(x => x.QuantitySold)
                .Take(5)
                .ToList();

            // Category sales distribution
            var categoryAggregates = completedOrders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => oi.MenuItem?.Category?.Name ?? "Diğer")
                .Select(g => new
                {
                    CategoryName = g.Key,
                    ItemsSold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.UnitPrice * x.Quantity)
                })
                .ToList();

            var totalCategoryRevenue = categoryAggregates.Sum(x => x.Revenue);
            var categorySales = categoryAggregates
                .Select(c => new CategorySalesDto
                {
                    CategoryName = c.CategoryName,
                    ItemsSold = c.ItemsSold,
                    Revenue = c.Revenue,
                    Percentage = totalCategoryRevenue > 0 ? Math.Round((double)(c.Revenue / totalCategoryRevenue) * 100, 1) : 0
                })
                .OrderByDescending(c => c.Revenue)
                .ToList();

            // Daily sales trends for the selected range
            var dailySales = rangeOrders
                .GroupBy(o => o.CreatedAt.Date)
                .OrderBy(g => g.Key)
                .Select(g => new DailySalesDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    OrdersCount = g.Count(),
                    Revenue = g.Where(o => o.Status == OrderStatus.Completed).Sum(o => o.TotalAmount)
                })
                .ToList();

            return new DashboardSummaryDto
            {
                TodayOrdersCount = todayOrdersCount,
                ActiveOrdersCount = activeOrdersCount,
                CompletedOrdersCount = completedCount,
                CancelledOrdersCount = cancelledCount,
                TodayRevenue = todayRevenue,
                RangeRevenue = rangeRevenue,
                RangeOrdersCount = rangeOrdersCount,
                AverageOrderValue = averageOrderValue,
                TotalCustomersCount = totalCustomersCount,
                TopSellingItems = topSelling,
                CategorySales = categorySales,
                DailySales = dailySales
            };
        }
    }
}
