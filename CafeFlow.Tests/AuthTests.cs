using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using CafeFlow.API.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace CafeFlow.Tests
{
    public class AuthTests
    {
        private readonly IOptions<JwtSettings> _jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "super_secret_test_key_minimum_32_characters_long_2026!",
            Issuer = "CafeFlow.Test",
            Audience = "CafeFlow.TestClient",
            AccessTokenExpiryMinutes = 15,
            RefreshTokenExpiryDays = 7
        });

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsTokensAndUserData()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var result = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });

            result.Should().NotBeNull();
            result!.AccessToken.Should().NotBeNullOrWhiteSpace();
            result.RefreshToken.Should().NotBeNullOrWhiteSpace();
            result.User.Email.Should().Be(customer.Email);
            result.User.Role.Should().Be(UserRole.LoyalCustomer);

            // DB should record the login timestamp
            var updatedUser = await db.Users.FindAsync(customer.Id);
            updatedUser!.LastLoginAt.Should().NotBeNull();
        }

        [Fact]
        public async Task Login_WithWrongPassword_ReturnsNull()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var result = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "WrongPassword!"
            });

            result.Should().BeNull();
        }

        [Fact]
        public async Task Login_WithInactiveUser_ReturnsNull()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);
            customer.IsActive = false;
            await db.SaveChangesAsync();

            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var result = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });

            result.Should().BeNull();
        }

        [Fact]
        public async Task RefreshToken_WithValidToken_RotatesTokenSuccessfully()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var loginResult = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });

            var originalRefreshToken = loginResult!.RefreshToken;

            // Perform token refresh
            var refreshResult = await service.RefreshTokenAsync(originalRefreshToken);

            refreshResult.Should().NotBeNull();
            refreshResult!.AccessToken.Should().NotBeNullOrWhiteSpace();
            refreshResult.RefreshToken.Should().NotBe(originalRefreshToken); // Must rotate!

            // Old token must be marked as revoked
            var oldTokens = db.RefreshTokens.Where(rt => rt.UserId == customer.Id && rt.RevokedAt != null).ToList();
            oldTokens.Should().HaveCount(1);
            oldTokens.First().ReasonRevoked.Should().Contain("Rotated");
        }

        [Fact]
        public async Task RefreshToken_ReuseDetection_RevokesAllUserTokensWhenRevokedTokenIsReplayed()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var loginResult = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });

            var originalRefreshToken = loginResult!.RefreshToken;

            // First refresh: rotates token (original is now revoked)
            var firstRefresh = await service.RefreshTokenAsync(originalRefreshToken);
            firstRefresh.Should().NotBeNull();

            // Attacker attempts to replay the already-revoked original token!
            var replayResult = await service.RefreshTokenAsync(originalRefreshToken);

            // Replay must fail
            replayResult.Should().BeNull();

            // Security defense: ALL active tokens for this user must now be revoked
            var remainingActiveTokens = db.RefreshTokens.Count(rt => rt.UserId == customer.Id && rt.RevokedAt == null);
            remainingActiveTokens.Should().Be(0, "All tokens must be revoked to stop token compromise");
        }

        [Fact]
        public async Task RefreshToken_WithExpiredToken_ReturnsNull()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var loginResult = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });

            // Fast forward expiration
            var stored = db.RefreshTokens.First(rt => rt.UserId == customer.Id);
            stored.ExpiresAt = DateTime.UtcNow.AddMinutes(-5);
            await db.SaveChangesAsync();

            var result = await service.RefreshTokenAsync(loginResult!.RefreshToken);
            result.Should().BeNull();
        }

        [Fact]
        public async Task Register_WithValidData_CreatesCustomerSuccessfully()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);

            var result = await service.RegisterAsync(new RegisterDto
            {
                FullName = "Yeni Müşteri",
                Email = "yenimusteri@test.com",
                PhoneNumber = "+905551234567",
                Password = "GucluSifre123!"
            });

            result.Should().NotBeNull();
            result!.User.Email.Should().Be("yenimusteri@test.com");
            result.User.Role.Should().Be(UserRole.LoyalCustomer);
            result.User.IsActive.Should().BeTrue();

            // Duplicate registration must fail with null
            var duplicateResult = await service.RegisterAsync(new RegisterDto
            {
                FullName = "Aynı E-posta",
                Email = "yenimusteri@test.com",
                Password = "DigerSifre123!"
            });
            duplicateResult.Should().BeNull();
        }

        [Fact]
        public async Task ChangePassword_WithCorrectCurrentPassword_UpdatesHashAndRevokesOldSessions()
        {
            using var db = TestDbHelper.CreateInMemoryDbContext();
            var (_, customer, _, _) = await TestDbHelper.SeedBasicDataAsync(db);

            var service = new AuthService(db, _jwtSettings, NullLogger<AuthService>.Instance);
            var login = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });

            // Change password
            var changed = await service.ChangePasswordAsync(customer.Id, new ChangePasswordDto
            {
                CurrentPassword = "CustomerPass123!",
                NewPassword = "YeniSuperSifre456!"
            });
            changed.Should().BeTrue();

            // Old password must fail
            var oldLogin = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "CustomerPass123!"
            });
            oldLogin.Should().BeNull();

            // New password must succeed
            var newLogin = await service.LoginAsync(new LoginDto
            {
                Email = customer.Email,
                Password = "YeniSuperSifre456!"
            });
            newLogin.Should().NotBeNull();

            // Old refresh token must be revoked
            var oldRefresh = await service.RefreshTokenAsync(login!.RefreshToken);
            oldRefresh.Should().BeNull();
        }
    }
}
