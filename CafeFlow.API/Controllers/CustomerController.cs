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
        public async Task<ActionResult<List<UserDto>>> GetLoyalCustomers()
        {
            var customers = await _loyaltyService.GetLoyalCustomersAsync();
            return Ok(customers);
        }

        [HttpPost("loyal")]
        public async Task<ActionResult<UserDto>> AddLoyalCustomer(CreateLoyalCustomerDto dto)
        {
            var adminId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var customer = await _loyaltyService.AddLoyalCustomerAsync(adminId, dto);

            if (customer is null)
                return Conflict(new { message = "A user with this email already exists." });

            return CreatedAtAction(nameof(GetLoyalCustomers), customer);
        }

        [HttpDelete("loyal/{id:guid}")]
        public async Task<IActionResult> RemoveLoyalCustomer(Guid id)
        {
            var removed = await _loyaltyService.RemoveLoyalCustomerAsync(id);
            if (!removed) return NotFound();
            return NoContent();
        }
    }
}
