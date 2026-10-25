using System.ComponentModel.DataAnnotations;

namespace CafeFlow.API.DTOs
{
    public class RestaurantSettingDto
    {
        public int Id { get; set; } = 1;

        [Required(ErrorMessage = "Restoran adı zorunludur."), MaxLength(150)]
        public string RestaurantName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [MaxLength(100), EmailAddress]
        public string? Email { get; set; }

        [MaxLength(100)]
        public string? OpeningHours { get; set; }

        public bool IsAcceptingOrders { get; set; }

        [Range(0, 100000, ErrorMessage = "Minimum sipariş tutarı 0 veya pozitif olmalıdır.")]
        public decimal MinimumOrderAmount { get; set; }

        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateRestaurantSettingDto
    {
        [Required(ErrorMessage = "Restoran adı zorunludur."), MaxLength(150)]
        public string RestaurantName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [MaxLength(100), EmailAddress]
        public string? Email { get; set; }

        [MaxLength(100)]
        public string? OpeningHours { get; set; }

        public bool IsAcceptingOrders { get; set; }

        [Range(0, 100000, ErrorMessage = "Minimum sipariş tutarı 0 veya pozitif olmalıdır.")]
        public decimal MinimumOrderAmount { get; set; }
    }
}
