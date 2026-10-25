using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CafeFlow.API.Data;
using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CafeFlow.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto dto);
        Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
        Task RevokeRefreshTokenAsync(string refreshToken);
        Task<UserDto?> GetProfileAsync(Guid userId);
        Task<UserDto?> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
        Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
        Task RevokeAllUserTokensAsync(Guid userId, string reason = "User session revoked");
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly JwtSettings _jwtSettings;
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext db, IOptions<JwtSettings> jwtSettings, ILogger<AuthService> logger)
        {
            _db = db;
            _jwtSettings = jwtSettings.Value;
            _logger = logger;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

            if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return null;

            user.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return await GenerateAuthResponseAsync(user);
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var exists = await _db.Users.AnyAsync(u => u.Email == email);
            if (exists)
                return null; // email already exists

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber?.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRole.LoyalCustomer,
                IsActive = true,
                MustChangePassword = false,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return await GenerateAuthResponseAsync(user);
        }

        public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return null;

            var tokenHash = HashToken(refreshToken);

            // Find token by Hash or raw Token (for seamless migration)
            var storedToken = await _db.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash || rt.Token == refreshToken);

            if (storedToken is null)
                return null;

            // Security check: Refresh Token Reuse Detection
            if (storedToken.RevokedAt != null)
            {
                _logger.LogWarning("Security Alert: Attempted reuse of revoked refresh token for user {UserId}. Revoking all tokens.", storedToken.UserId);
                await RevokeAllUserTokensAsync(storedToken.UserId, "Security breach: Attempted reuse of revoked token");
                return null;
            }

            // Verify expiration and user active state
            if (DateTime.UtcNow >= storedToken.ExpiresAt || storedToken.User is null || !storedToken.User.IsActive)
            {
                return null;
            }

            // Generate new token pair
            var newRefreshTokenValue = GenerateRefreshTokenValue();
            var newRefreshTokenHash = HashToken(newRefreshTokenValue);

            // Rotate: revoke old token and record replacing token hash
            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.ReplacedByTokenHash = newRefreshTokenHash;
            storedToken.ReasonRevoked = "Rotated to new token";

            _db.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = newRefreshTokenHash, // Store hash in token column for safety
                TokenHash = newRefreshTokenHash,
                UserId = storedToken.UserId,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            var accessToken = GenerateAccessToken(storedToken.User);
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshTokenValue,
                ExpiresAt = expiresAt,
                User = ToUserDto(storedToken.User)
            };
        }

        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return;

            var tokenHash = HashToken(refreshToken);
            var storedToken = await _db.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash || rt.Token == refreshToken);

            if (storedToken is not null && storedToken.RevokedAt == null)
            {
                storedToken.RevokedAt = DateTime.UtcNow;
                storedToken.ReasonRevoked = "Explicit logout";
                await _db.SaveChangesAsync();
            }
        }

        public async Task<UserDto?> GetProfileAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            return user is null ? null : ToUserDto(user);
        }

        public async Task<UserDto?> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user is null || !user.IsActive) return null;

            user.FullName = dto.FullName.Trim();
            user.PhoneNumber = dto.PhoneNumber?.Trim();
            await _db.SaveChangesAsync();

            return ToUserDto(user);
        }

        public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user is null || !user.IsActive) return false;

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.MustChangePassword = false;

            // Revoke all existing sessions when password changes
            await RevokeAllUserTokensAsync(userId, "Password changed");

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task RevokeAllUserTokensAsync(Guid userId, string reason = "User session revoked")
        {
            var activeTokens = await _db.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync();

            var now = DateTime.UtcNow;
            foreach (var token in activeTokens)
            {
                token.RevokedAt = now;
                token.ReasonRevoked = reason;
            }

            await _db.SaveChangesAsync();
        }

        private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user)
        {
            var accessToken = GenerateAccessToken(user);
            var rawRefreshToken = GenerateRefreshTokenValue();
            var refreshTokenHash = HashToken(rawRefreshToken);
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes);

            _db.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = refreshTokenHash,
                TokenHash = refreshTokenHash,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken,
                ExpiresAt = expiresAt,
                User = ToUserDto(user)
            };
        }

        private string GenerateAccessToken(User user)
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.FullName),
                new(ClaimTypes.Role, user.Role.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshTokenValue()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes);
        }

        private static string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static UserDto ToUserDto(User user) => new()
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            IsActive = user.IsActive,
            MustChangePassword = user.MustChangePassword,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt
        };
    }
}
