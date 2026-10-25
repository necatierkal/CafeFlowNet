using System.Security.Claims;
using CafeFlow.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.API.Hubs
{
    [Authorize]
    public class OrderHub : Hub
    {
        private readonly AppDbContext _db;
        private readonly ILogger<OrderHub> _logger;

        public OrderHub(AppDbContext db, ILogger<OrderHub> logger)
        {
            _db = db;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            // Only verified Admins join the "admins" broadcast channel
            if (Context.User?.IsInRole("Admin") == true)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
                _logger.LogInformation("Admin connection {ConnectionId} joined 'admins' group", Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.User?.IsInRole("Admin") == true)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "admins");
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Clients join a specific order group to listen for real-time status updates.
        /// Verifies that the connected user is either an Admin or the owner (CustomerId) of the order.
        /// </summary>
        public async Task JoinOrderGroup(string orderId)
        {
            if (!Guid.TryParse(orderId, out var orderGuid))
            {
                throw new HubException("Geçersiz sipariş kimliği.");
            }

            var userIdString = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId))
            {
                throw new HubException("Yetkilendirme kimliği okunamadı.");
            }

            var isAdmin = Context.User?.IsInRole("Admin") == true;

            // Security Ownership Verification
            if (!isAdmin)
            {
                var isOwner = await _db.Orders
                    .AsNoTracking()
                    .AnyAsync(o => o.Id == orderGuid && o.CustomerId == userId);

                if (!isOwner)
                {
                    _logger.LogWarning("Security Alert: User {UserId} attempted unauthorized subscription to Order {OrderId}", userId, orderGuid);
                    throw new HubException("Bu siparişi izleme yetkiniz bulunmamaktadır.");
                }
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderGuid}");
            _logger.LogInformation("Connection {ConnectionId} joined group order-{OrderId}", Context.ConnectionId, orderGuid);
        }

        public async Task LeaveOrderGroup(string orderId)
        {
            if (Guid.TryParse(orderId, out var orderGuid))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order-{orderGuid}");
            }
        }
    }
}
