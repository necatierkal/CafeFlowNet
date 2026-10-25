using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CafeFlow.API.Models
{
    public class RestaurantSetting
    {
        [Key]
        public int Id { get; set; } = 1;

        [Required, MaxLength(150)]
        public string RestaurantName { get; set; } = "CafeFlow";

        [MaxLength(500)]
        public string? Description { get; set; } = "Lezzetli kahveler, taze tatlılar ve enfes gurme lezzetler.";

        [MaxLength(250)]
        public string? Address { get; set; } = "Moda Caddesi No: 42, Kadıköy, İstanbul";

        [MaxLength(30)]
        public string? PhoneNumber { get; set; } = "+90 (216) 555 0123";

        [MaxLength(100)]
        public string? Email { get; set; } = "info@cafeflow.com";

        [MaxLength(100)]
        public string? OpeningHours { get; set; } = "Hafta içi & Hafta sonu: 08:30 - 23:00";

        public bool IsAcceptingOrders { get; set; } = true;

        [Column(TypeName = "decimal(10,2)")]
        public decimal MinimumOrderAmount { get; set; } = 0.00m;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
