namespace CafeFlow.API.DTOs
{
    public class DashboardSummaryDto
    {
        public int TodayOrdersCount { get; set; }
        public int ActiveOrdersCount { get; set; }
        public int CompletedOrdersCount { get; set; }
        public int CancelledOrdersCount { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal RangeRevenue { get; set; }
        public int RangeOrdersCount { get; set; }
        public decimal AverageOrderValue { get; set; }
        public int TotalCustomersCount { get; set; }
        public List<TopSellingItemDto> TopSellingItems { get; set; } = new();
        public List<CategorySalesDto> CategorySales { get; set; } = new();
        public List<DailySalesDto> DailySales { get; set; } = new();
    }

    public class TopSellingItemDto
    {
        public int MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class CategorySalesDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public int ItemsSold { get; set; }
        public decimal Revenue { get; set; }
        public double Percentage { get; set; }
    }

    public class DailySalesDto
    {
        public string Date { get; set; } = string.Empty;
        public int OrdersCount { get; set; }
        public decimal Revenue { get; set; }
    }
}
