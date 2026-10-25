using System.ComponentModel.DataAnnotations;
using CafeFlow.API.Models;

namespace CafeFlow.API.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "E-posta adresi zorunludur."), EmailAddress(ErrorMessage = "Geçersiz e-posta biçimi.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur.")]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required(ErrorMessage = "Ad ve soyad zorunludur."), MinLength(2), MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-posta adresi zorunludur."), EmailAddress(ErrorMessage = "Geçersiz e-posta biçimi.")]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required(ErrorMessage = "Şifre zorunludur."), MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalıdır.")]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserDto User { get; set; } = new();
    }

    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;
        public bool MustChangePassword { get; set; } = false;
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateProfileDto
    {
        [Required(ErrorMessage = "Ad ve soyad zorunludur."), MinLength(2), MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Mevcut şifre zorunludur.")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Yeni şifre zorunludur."), MinLength(6, ErrorMessage = "Yeni şifre en az 6 karakter olmalıdır.")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class CreateLoyalCustomerDto
    {
        [Required(ErrorMessage = "E-posta adresi zorunludur."), EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ad ve soyad zorunludur."), MinLength(2), MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required(ErrorMessage = "Geçici şifre zorunludur."), MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalıdır.")]
        public string TemporaryPassword { get; set; } = string.Empty;
    }

    public class ToggleUserStatusDto
    {
        public bool IsActive { get; set; }
    }
}
