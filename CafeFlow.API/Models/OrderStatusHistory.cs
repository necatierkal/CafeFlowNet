using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CafeFlow.API.Models
{
    public class OrderStatusHistory
    {
        [Key]
        public int Id { get; set; }

        public Guid OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order? Order { get; set; }

        public OrderStatus? FromStatus { get; set; }

        [Required]
        public OrderStatus ToStatus { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        public Guid? ChangedByUserId { get; set; }

        [MaxLength(100)]
        public string? ChangedByName { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
