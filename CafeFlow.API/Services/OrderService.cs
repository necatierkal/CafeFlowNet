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
        Task<List<OrderDto>> GetOrdersForAdminAsync(OrderStatus? statusFilter, DateTime? fromDate = null, DateTime? toDate = null, string? searchTerm = null);
        Task<List<OrderDto>> GetOrdersForCustomerAsync(Guid customerId);
        Task<OrderDto?> GetOrderByIdAsync(Guid orderId, Guid? requestingUserId, bool isAdmin);
        Task<OrderDto?> UpdateStatusAsync(Guid orderId, OrderStatus newStatus, Guid? changedByUserId = null, string? changedByName = null, string? notes = null);
        Task<OrderDto?> CustomerCancelOrderAsync(Guid orderId, Guid customerId, string reason);
    }

    public class OrderService : IOrderService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<OrderHub> _hub;
        private readonly ILogger<OrderService> _logger;

        public OrderService(AppDbContext db, IHubContext<OrderHub> hub, ILogger<OrderService> logger)
        {
            _db = db;
            _hub = hub;
            _logger = logger;
        }

        public async Task<OrderDto?> CreateOrderAsync(Guid customerId, CreateOrderDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return null;

            // 1. Idempotency check: avoid duplicate orders within recent window
            if (!string.IsNullOrWhiteSpace(dto.IdempotencyKey))
            {
                var existingOrder = await _db.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                    .Include(o => o.StatusHistory)
                    .FirstOrDefaultAsync(o => o.CustomerId == customerId && o.IdempotencyKey == dto.IdempotencyKey.Trim());

                if (existingOrder != null)
                {
                    _logger.LogInformation("Idempotent order request matched order {OrderId} for customer {CustomerId}", existingOrder.Id, customerId);
                    return ToDto(existingOrder);
                }
            }

            // 2. Consolidate duplicate items in the same order
            var consolidatedItems = dto.Items
                .Where(i => i.Quantity > 0)
                .GroupBy(i => i.MenuItemId)
                .Select(g => new CreateOrderItemDto
                {
                    MenuItemId = g.Key,
                    Quantity = g.Sum(x => x.Quantity)
                })
                .ToList();

            if (consolidatedItems.Count == 0)
                return null;

            var menuItemIds = consolidatedItems.Select(i => i.MenuItemId).ToList();
            var menuItems = await _db.MenuItems
                .Where(mi => menuItemIds.Contains(mi.Id) && mi.IsAvailable && !mi.IsDeleted)
                .ToListAsync();

            if (menuItems.Count != menuItemIds.Count)
                return null; // One or more items unavailable or deleted

            var customer = await _db.Users.FindAsync(customerId);
            if (customer == null || !customer.IsActive)
                return null;

            // 3. Compute totals strictly on server
            var orderId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var order = new Order
            {
                Id = orderId,
                CustomerId = customerId,
                Status = OrderStatus.Received,
                EstimatedArrival = dto.EstimatedArrival,
                Notes = dto.Notes?.Trim(),
                IdempotencyKey = dto.IdempotencyKey?.Trim(),
                CreatedAt = now,
                UpdatedAt = now
            };

            decimal total = 0;
            foreach (var line in consolidatedItems)
            {
                var menuItem = menuItems.First(mi => mi.Id == line.MenuItemId);
                var lineTotal = menuItem.Price * line.Quantity;
                total += lineTotal;

                order.OrderItems.Add(new OrderItem
                {
                    OrderId = orderId,
                    MenuItemId = menuItem.Id,
                    ItemName = menuItem.Name,     // Price and Name snapshot
                    UnitPrice = menuItem.Price,
                    Quantity = line.Quantity
                });
            }
            order.TotalAmount = total;

            // Add initial status history record
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OrderId = orderId,
                FromStatus = null,
                ToStatus = OrderStatus.Received,
                ChangedAt = now,
                ChangedByUserId = customerId,
                ChangedByName = customer.FullName,
                Notes = "Sipariş oluşturuldu."
            });

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            var result = await GetOrderDtoAsync(order.Id);

            // Real-time broadcast to admins
            try
            {
                await _hub.Clients.Group("admins").SendAsync("NewOrder", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast NewOrder via SignalR for order {OrderId}", order.Id);
            }

            return result;
        }

        public async Task<List<OrderDto>> GetOrdersForAdminAsync(
            OrderStatus? statusFilter, 
            DateTime? fromDate = null, 
            DateTime? toDate = null, 
            string? searchTerm = null)
        {
            var query = _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .Include(o => o.StatusHistory)
                .OrderByDescending(o => o.CreatedAt)
                .AsQueryable();

            if (statusFilter.HasValue)
                query = query.Where(o => o.Status == statusFilter.Value);

            if (fromDate.HasValue)
                query = query.Where(o => o.CreatedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(o => o.CreatedAt <= toDate.Value);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(o => (o.Customer != null && o.Customer.FullName.ToLower().Contains(term)) ||
                                         (o.Notes != null && o.Notes.ToLower().Contains(term)) ||
                                         o.Id.ToString().Contains(term));
            }

            var orders = await query.ToListAsync();
            return orders.Select(ToDto).ToList();
        }

        public async Task<List<OrderDto>> GetOrdersForCustomerAsync(Guid customerId)
        {
            var orders = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .Include(o => o.StatusHistory)
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(ToDto).ToList();
        }

        public async Task<OrderDto?> GetOrderByIdAsync(Guid orderId, Guid? requestingUserId, bool isAdmin)
        {
            var order = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .Include(o => o.StatusHistory)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order is null) return null;

            // Security check: Customer can only view their own order
            if (!isAdmin && order.CustomerId != requestingUserId)
            {
                return null;
            }

            return ToDto(order);
        }

        public async Task<OrderDto?> UpdateStatusAsync(
            Guid orderId, 
            OrderStatus newStatus, 
            Guid? changedByUserId = null, 
            string? changedByName = null, 
            string? notes = null)
        {
            var order = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .Include(o => o.StatusHistory)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order is null) return null;

            // State Machine Transition Rules:
            // Allowed:
            // Received -> Preparing, Cancelled
            // Preparing -> Ready, Cancelled
            // Ready -> Completed, Cancelled
            // Completed -> TERMINAL (no transitions allowed)
            // Cancelled -> TERMINAL (no transitions allowed)
            if (!IsValidStatusTransition(order.Status, newStatus))
            {
                _logger.LogWarning("Invalid order status transition attempt from {CurrentStatus} to {NewStatus} for order {OrderId}",
                    order.Status, newStatus, orderId);
                throw new InvalidOperationException($"'{order.Status}' durumundaki bir sipariş '{newStatus}' durumuna geçirilemez.");
            }

            var oldStatus = order.Status;
            order.Status = newStatus;
            order.UpdatedAt = DateTime.UtcNow;

            if (newStatus == OrderStatus.Cancelled)
            {
                order.CancelledAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(notes))
                {
                    order.CancellationReason = notes;
                }
            }

            // Record status history
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = oldStatus,
                ToStatus = newStatus,
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = changedByUserId,
                ChangedByName = changedByName ?? "Yönetici",
                Notes = notes
            });

            await _db.SaveChangesAsync();

            var result = ToDto(order);

            // SignalR broadcast to the customer tracking this order and admin board
            try
            {
                await _hub.Clients.Group($"order-{orderId}")
                    .SendAsync("OrderStatusChanged", new { orderId, status = newStatus.ToString(), notes });

                await _hub.Clients.Group("admins")
                    .SendAsync("OrderStatusChanged", new { orderId, status = newStatus.ToString(), notes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast OrderStatusChanged for order {OrderId}", orderId);
            }

            return result;
        }

        public async Task<OrderDto?> CustomerCancelOrderAsync(Guid orderId, Guid customerId, string reason)
        {
            var order = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .Include(o => o.StatusHistory)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId);

            if (order is null) return null;

            // Customers can only cancel orders that are still in "Received" state
            if (order.Status != OrderStatus.Received)
            {
                throw new InvalidOperationException("Yalnızca henüz hazırlanmaya başlanmamış siparişler iptal edilebilir.");
            }

            return await UpdateStatusAsync(
                orderId, 
                OrderStatus.Cancelled, 
                customerId, 
                order.Customer?.FullName ?? "Müşteri", 
                $"Müşteri iptal talebi: {reason}");
        }

        public static bool IsValidStatusTransition(OrderStatus current, OrderStatus next)
        {
            if (current == next) return true; // idempotent

            return current switch
            {
                OrderStatus.Received => next is OrderStatus.Preparing or OrderStatus.Cancelled,
                OrderStatus.Preparing => next is OrderStatus.Ready or OrderStatus.Cancelled,
                OrderStatus.Ready => next is OrderStatus.Completed or OrderStatus.Cancelled,
                OrderStatus.Completed => false, // Terminal
                OrderStatus.Cancelled => false, // Terminal
                _ => false
            };
        }

        private async Task<OrderDto> GetOrderDtoAsync(Guid orderId)
        {
            var order = await _db.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                .Include(o => o.StatusHistory)
                .FirstAsync(o => o.Id == orderId);

            return ToDto(order);
        }

        private static OrderDto ToDto(Order o) => new()
        {
            Id = o.Id,
            CustomerId = o.CustomerId,
            CustomerName = o.Customer?.FullName ?? string.Empty,
            CustomerPhone = o.Customer?.PhoneNumber,
            Status = o.Status,
            EstimatedArrival = o.EstimatedArrival,
            TotalAmount = o.TotalAmount,
            Notes = o.Notes,
            CancellationReason = o.CancellationReason,
            CancelledAt = o.CancelledAt,
            CreatedAt = o.CreatedAt,
            UpdatedAt = o.UpdatedAt,
            Items = o.OrderItems.Select(oi => new OrderItemDto
            {
                MenuItemId = oi.MenuItemId,
                ItemName = oi.ItemName,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                LineTotal = oi.LineTotal
            }).ToList(),
            StatusHistory = o.StatusHistory
                .OrderBy(h => h.ChangedAt)
                .Select(h => new OrderStatusHistoryDto
                {
                    Id = h.Id,
                    FromStatus = h.FromStatus,
                    ToStatus = h.ToStatus,
                    ChangedAt = h.ChangedAt,
                    ChangedByName = h.ChangedByName,
                    Notes = h.Notes
                }).ToList()
        };
    }
}
