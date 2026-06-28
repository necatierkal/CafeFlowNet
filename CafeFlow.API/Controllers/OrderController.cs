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

        // Loyal customers place orders remotely
        [HttpPost]
        [Authorize(Roles = "LoyalCustomer")]
        public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto dto)
        {
            var customerId = GetUserId();
            var order = await _orderService.CreateOrderAsync(customerId, dto);

            if (order is null)
                return BadRequest(new { message = "One or more items are unavailable or do not exist." });

            return CreatedAtAction(nameof(GetMyOrders), order);
        }

        // Admin sees all orders, optionally filtered by status
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<OrderDto>>> GetAllOrders([FromQuery] OrderStatus? status)
        {
            var orders = await _orderService.GetOrdersForAdminAsync(status);
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

        [HttpPut("{id:guid}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<OrderDto>> UpdateStatus(Guid id, UpdateOrderStatusDto dto)
        {
            var order = await _orderService.UpdateStatusAsync(id, dto.Status);
            if (order is null) return NotFound();
            return Ok(order);
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(idClaim!);
        }
    }
}
