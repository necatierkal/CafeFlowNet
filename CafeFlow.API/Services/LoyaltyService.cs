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
        Task<List<UserDto>> GetLoyalCustomersAsync();
    }

    public class LoyaltyService : ILoyaltyService
    {
        private readonly AppDbContext _db;

        public LoyaltyService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<UserDto?> AddLoyalCustomerAsync(Guid adminId, CreateLoyalCustomerDto dto)
        {
            var emailNormalized = dto.Email.Trim().ToLower();

            var exists = await _db.Users.AnyAsync(u => u.Email == emailNormalized);
            if (exists) return null; // caller should return 409 Conflict

            var user = new User
            {
                Email = emailNormalized,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.TemporaryPassword),
                Role = UserRole.LoyalCustomer,
                IsActive = true,
                AddedByAdminId = adminId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<bool> RemoveLoyalCustomerAsync(Guid customerId)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == customerId && u.Role == UserRole.LoyalCustomer);

            if (user is null) return false;

            // Soft-delete: deactivate rather than hard-delete, to preserve order history
            user.IsActive = false;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<UserDto>> GetLoyalCustomersAsync()
        {
            var customers = await _db.Users
                .Where(u => u.Role == UserRole.LoyalCustomer && u.IsActive)
                .OrderBy(u => u.FullName)
                .ToListAsync();

            return customers.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            }).ToList();
        }
    }
}
