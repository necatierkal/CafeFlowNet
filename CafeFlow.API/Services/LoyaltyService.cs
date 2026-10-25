using CafeFlow.API.Data;
using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.API.Services
{
    public interface ILoyaltyService
    {
        Task<UserDto?> AddLoyalCustomerAsync(Guid adminId, CreateLoyalCustomerDto dto);
        Task<bool> RemoveLoyalCustomerAsync(Guid customerId);
        Task<UserDto?> ToggleCustomerStatusAsync(Guid customerId, bool isActive);
        Task<List<UserDto>> GetLoyalCustomersAsync(string? searchTerm = null);
        Task<UserDto?> GetCustomerByIdAsync(Guid customerId);
    }

    public class LoyaltyService : ILoyaltyService
    {
        private readonly AppDbContext _db;
        private readonly IAuthService _authService;
        private readonly ILogger<LoyaltyService> _logger;

        public LoyaltyService(AppDbContext db, IAuthService authService, ILogger<LoyaltyService> logger)
        {
            _db = db;
            _authService = authService;
            _logger = logger;
        }

        public async Task<UserDto?> AddLoyalCustomerAsync(Guid adminId, CreateLoyalCustomerDto dto)
        {
            var emailNormalized = dto.Email.Trim().ToLower();

            var exists = await _db.Users.AnyAsync(u => u.Email == emailNormalized);
            if (exists) return null; // Conflict

            var user = new User
            {
                Email = emailNormalized,
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber?.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.TemporaryPassword),
                Role = UserRole.LoyalCustomer,
                IsActive = true,
                MustChangePassword = true, // Force password change on first login
                AddedByAdminId = adminId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return ToDto(user);
        }

        public async Task<bool> RemoveLoyalCustomerAsync(Guid customerId)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == customerId && u.Role == UserRole.LoyalCustomer);

            if (user is null) return false;

            // Soft-deactivate and revoke all active sessions immediately
            user.IsActive = false;
            await _authService.RevokeAllUserTokensAsync(customerId, "Customer account removed/deactivated by admin");
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> ToggleCustomerStatusAsync(Guid customerId, bool isActive)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == customerId && u.Role == UserRole.LoyalCustomer);

            if (user is null) return null;

            user.IsActive = isActive;
            if (!isActive)
            {
                await _authService.RevokeAllUserTokensAsync(customerId, "Customer account deactivated by admin");
            }

            await _db.SaveChangesAsync();
            return ToDto(user);
        }

        public async Task<List<UserDto>> GetLoyalCustomersAsync(string? searchTerm = null)
        {
            var query = _db.Users
                .Where(u => u.Role == UserRole.LoyalCustomer)
                .OrderBy(u => u.FullName)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(term) ||
                                         u.Email.ToLower().Contains(term) ||
                                         (u.PhoneNumber != null && u.PhoneNumber.Contains(term)));
            }

            var customers = await query.ToListAsync();
            return customers.Select(ToDto).ToList();
        }

        public async Task<UserDto?> GetCustomerByIdAsync(Guid customerId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == customerId && u.Role == UserRole.LoyalCustomer);
            return user == null ? null : ToDto(user);
        }

        private static UserDto ToDto(User u) => new()
        {
            Id = u.Id,
            Email = u.Email,
            FullName = u.FullName,
            PhoneNumber = u.PhoneNumber,
            Role = u.Role,
            IsActive = u.IsActive,
            MustChangePassword = u.MustChangePassword,
            LastLoginAt = u.LastLoginAt,
            CreatedAt = u.CreatedAt
        };
    }
}
