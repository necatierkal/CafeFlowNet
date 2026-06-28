using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CafeFlow.API.Models
{
    public enum OrderStatus
    {
        Received = 0,
        Preparing = 1,
        Ready = 2,
        Completed = 3,
        Cancelled = 4
    }

    public class Order
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public User? Customer { get; set; }

        [Required]
        public OrderStatus Status { get; set; } = OrderStatus.Received;

        public DateTime? EstimatedArrival { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
