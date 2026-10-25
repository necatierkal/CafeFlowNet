using System.Security.Claims;
using CafeFlow.API.DTOs;
using CafeFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeFlow.API.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize(Roles = "Admin")]
    public class CustomerController : ControllerBase
    {
        private readonly ILoyaltyService _loyaltyService;

        public CustomerController(ILoyaltyService loyaltyService)
        {
            _loyaltyService = loyaltyService;
        }

        [HttpGet("loyal")]
        public async Task<ActionResult<List<UserDto>>> GetLoyalCustomers([FromQuery] string? search)
        {
            var customers = await _loyaltyService.GetLoyalCustomersAsync(search);
            return Ok(customers);
        }

        [HttpGet("loyal/{id:guid}")]
        public async Task<ActionResult<UserDto>> GetCustomerById(Guid id)
        {
            var customer = await _loyaltyService.GetCustomerByIdAsync(id);
            if (customer is null) return NotFound(new { message = "Müşteri bulunamadı." });

            return Ok(customer);
        }

        [HttpPost("loyal")]
        public async Task<ActionResult<UserDto>> AddLoyalCustomer([FromBody] CreateLoyalCustomerDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var adminId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var customer = await _loyaltyService.AddLoyalCustomerAsync(adminId, dto);

            if (customer is null)
                return Conflict(new { message = "Bu e-posta adresiyle kayıtlı bir müşteri zaten bulunmaktadır." });

            return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, customer);
        }

        [HttpPut("loyal/{id:guid}/status")]
        public async Task<ActionResult<UserDto>> ToggleCustomerStatus(Guid id, [FromBody] ToggleUserStatusDto dto)
        {
            var updated = await _loyaltyService.ToggleCustomerStatusAsync(id, dto.IsActive);
            if (updated is null) return NotFound(new { message = "Müşteri bulunamadı." });

            return Ok(updated);
        }

        [HttpDelete("loyal/{id:guid}")]
        public async Task<IActionResult> RemoveLoyalCustomer(Guid id)
        {
            var removed = await _loyaltyService.RemoveLoyalCustomerAsync(id);
            if (!removed) return NotFound(new { message = "Müşteri bulunamadı." });

            return NoContent();
        }
    }
}
