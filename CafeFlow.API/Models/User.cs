using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CafeFlow.API.Models
{
    public enum UserRole
    {
        Admin = 0,
        LoyalCustomer = 1
    }

    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; } = UserRole.LoyalCustomer;

        public bool IsActive { get; set; } = true;

        // Tracks who added this loyal customer (the admin), null for Admin accounts
        public Guid? AddedByAdminId { get; set; }

        [ForeignKey(nameof(AddedByAdminId))]
        public User? AddedByAdmin { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
