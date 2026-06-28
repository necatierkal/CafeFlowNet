using CafeFlow.API.Data;
using CafeFlow.API.DTOs;
using CafeFlow.API.Hubs;
using CafeFlow.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.API.Services
{
    public interface IOrderService
    {
        Task<OrderDto?> CreateOrderAsync(Guid customerId, CreateOrderDto dto);
        Task<List<OrderDto>> GetOrdersForAdminAsync(OrderStatus? statusFilter);
        Task<List<OrderDto>> GetOrdersForCustomerAsync(Guid customerId);
        Task<OrderDto?> UpdateStatusAsync(Guid orderId, OrderStatus newStatus);
    }

    public class OrderService : IOrderService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<OrderHub> _hub;

        public OrderService(AppDbContext db, IHubContext<OrderHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        public async Task<OrderDto?> CreateOrderAsync(Guid customerId, CreateOrderDto dto)
        {
            var menuItemIds = dto.Items.Select(i => i.MenuItemId).ToList();
            var menuItems = await _db.MenuItems
                .Where(mi => menuItemIds.Contains(mi.Id) && mi.IsAvailable)
                .ToListAsync();

            if (menuItems.Count != menuItemIds.Distinct().Count())
                return null; // one or more items unavailable / not found

            var order = new Order
            {
                CustomerId = customerId,
                Status = OrderStatus.Received,
                EstimatedArrival = dto.EstimatedArrival,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            decimal total = 0;
            foreach (var line in dto.Items)
            {
                var menuItem = menuItems.First(mi => mi.Id == line.MenuItemId);
                var lineTotal = menuItem.Price * line.Quantity;
                total += lineTotal;

                order.OrderItems.Add(new OrderItem
                {
                    MenuItemId = menuItem.Id,
                    ItemName = menuItem.Name,     // snapshot
                    UnitPrice = menuItem.Price,   // snapshot
                    Quantity = line.Quantity
                });
            }
            order.TotalAmount = total;

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            var result = await GetOrderDtoAsync(order.Id);

            // Notify the admin dashboard in real time
            await _hub.Clients.Group("admins").SendAsync("NewOrder", result);

            return result;
        }

        public async Task<List<OrderDto>> GetOrdersForAdminAsync(OrderStatus? statusFilter)
        {
            var query = _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.CreatedAt)
                .AsQueryable();

            if (statusFilter.HasValue)
                query = query.Where(o => o.Status == statusFilter.Value);

            var orders = await query.ToListAsync();
            return orders.Select(ToDto).ToList();
        }

        public async Task<List<OrderDto>> GetOrdersForCustomerAsync(Guid customerId)
        {
            var orders = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(ToDto).ToList();
        }

        public async Task<OrderDto?> UpdateStatusAsync(Guid orderId, OrderStatus newStatus)
        {
            var order = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order is null) return null;

            order.Status = newStatus;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var result = ToDto(order);

            // Notify the specific customer tracking this order
            await _hub.Clients.Group($"order-{orderId}")
                .SendAsync("OrderStatusChanged", new { orderId, status = newStatus.ToString() });

            return result;
        }

        private async Task<OrderDto> GetOrderDtoAsync(Guid orderId)
        {
            var order = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .FirstAsync(o => o.Id == orderId);

            return ToDto(order);
        }

        private static OrderDto ToDto(Order o) => new()
        {
            Id = o.Id,
            CustomerId = o.CustomerId,
            CustomerName = o.Customer?.FullName ?? string.Empty,
            Status = o.Status,
            EstimatedArrival = o.EstimatedArrival,
            TotalAmount = o.TotalAmount,
            Notes = o.Notes,
            CreatedAt = o.CreatedAt,
            Items = o.OrderItems.Select(oi => new OrderItemDto
            {
                MenuItemId = oi.MenuItemId,
                ItemName = oi.ItemName,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                LineTotal = oi.LineTotal
            }).ToList()
        };
    }
}
