using CafeFlow.API.DTOs;
using CafeFlow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CafeFlow.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result is null)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(result);
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshTokenRequestDto dto)
        {
            var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
            if (result is null)
                return Unauthorized(new { message = "Invalid or expired refresh token." });

            return Ok(result);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout(RefreshTokenRequestDto dto)
        {
            await _authService.RevokeRefreshTokenAsync(dto.RefreshToken);
            return NoContent();
        }
    }
}
