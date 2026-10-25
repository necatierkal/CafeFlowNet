using System.Security.Claims;
using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using CafeFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeFlow.API.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        // Customers or Admins place orders
        [HttpPost]
        [Authorize(Roles = "LoyalCustomer,Admin")]
        public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerId = GetUserId();
            var order = await _orderService.CreateOrderAsync(customerId, dto);

            if (order is null)
                return BadRequest(new { message = "Sipariş verilemedi. Ürünlerden biri veya birkaçı mevcut değil ya da sepet boş." });

            return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
        }

        // Admin sees all orders, with search and date filters
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<OrderDto>>> GetAllOrders(
            [FromQuery] OrderStatus? status,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] string? searchTerm)
        {
            var orders = await _orderService.GetOrdersForAdminAsync(status, fromDate, toDate, searchTerm);
            return Ok(orders);
        }

        // Loyal customer sees only their own orders
        [HttpGet("my")]
        [Authorize(Roles = "LoyalCustomer")]
        public async Task<ActionResult<List<OrderDto>>> GetMyOrders()
        {
            var customerId = GetUserId();
            var orders = await _orderService.GetOrdersForCustomerAsync(customerId);
            return Ok(orders);
        }

        // View single order by ID with ownership enforcement
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<OrderDto>> GetOrderById(Guid id)
        {
            var userId = GetUserId();
            var isAdmin = User.IsInRole("Admin");

            var order = await _orderService.GetOrderByIdAsync(id, userId, isAdmin);
            if (order is null)
                return NotFound(new { message = "Sipariş bulunamadı veya erişim yetkiniz yok." });

            return Ok(order);
        }

        // Admin status update
        [HttpPut("{id:guid}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<OrderDto>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var adminId = GetUserId();
                var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Yönetici";

                var order = await _orderService.UpdateStatusAsync(id, dto.Status, adminId, adminName, dto.Notes);
                if (order is null) return NotFound(new { message = "Sipariş bulunamadı." });

                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Customer cancels order before preparation starts
        [HttpPost("{id:guid}/cancel")]
        [Authorize(Roles = "LoyalCustomer")]
        public async Task<ActionResult<OrderDto>> CustomerCancelOrder(Guid id, [FromBody] CancelOrderDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var customerId = GetUserId();
                var order = await _orderService.CustomerCancelOrderAsync(id, customerId, dto.Reason);
                if (order is null) return NotFound(new { message = "Sipariş bulunamadı veya bu sipariş size ait değil." });

                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(idClaim!);
        }
    }
}
