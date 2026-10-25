using System.Security.Claims;
using CafeFlow.API.DTOs;
using CafeFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
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
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(dto);
            if (result is null)
                return Unauthorized(new { message = "Geçersiz e-posta veya şifre, ya da hesap devre dışı." });

            return Ok(result);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(dto);
            if (result is null)
                return Conflict(new { message = "Bu e-posta adresiyle kayıtlı bir hesap zaten bulunmaktadır." });

            return Created(string.Empty, result);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshTokenRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
            if (result is null)
                return Unauthorized(new { message = "Geçersiz, süresi dolmuş veya iptal edilmiş yenileme belirteci." });

            return Ok(result);
        }

        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            await _authService.RevokeRefreshTokenAsync(dto.RefreshToken);
            return NoContent();
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            var userId = GetCurrentUserId();
            var profile = await _authService.GetProfileAsync(userId);
            if (profile is null) return NotFound(new { message = "Kullanıcı profili bulunamadı." });

            return Ok(profile);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var updated = await _authService.UpdateProfileAsync(userId, dto);
            if (updated is null) return BadRequest(new { message = "Profil güncellenemedi." });

            return Ok(updated);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var success = await _authService.ChangePasswordAsync(userId, dto);
            if (!success)
                return BadRequest(new { message = "Mevcut şifre hatalı veya hesap güncellenemedi." });

            return Ok(new { message = "Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle tekrar giriş yapın." });
        }

        private Guid GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(claim!);
        }
    }
}
