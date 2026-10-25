using System.ComponentModel.DataAnnotations;
using CafeFlow.API.Models;

namespace CafeFlow.API.DTOs
{
    public class CreateOrderDto
    {
        [Required(ErrorMessage = "Sipariş en az bir ürün içermelidir."), MinLength(1, ErrorMessage = "Sipariş en az bir ürün içermelidir.")]
        public List<CreateOrderItemDto> Items { get; set; } = new();

        public DateTime? EstimatedArrival { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        [MaxLength(100)]
        public string? IdempotencyKey { get; set; }
    }

    public class CreateOrderItemDto
    {
        [Required]
        public int MenuItemId { get; set; }

        [Required, Range(1, 100, ErrorMessage = "Ürün adedi 1 ile 100 arasında olmalıdır.")]
        public int Quantity { get; set; }
    }

    public class OrderDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public string? CancellationReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
        public List<OrderStatusHistoryDto> StatusHistory { get; set; } = new();
    }

    public class OrderItemDto
    {
        public int MenuItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        [Required]
        public OrderStatus Status { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class CancelOrderDto
    {
        [Required(ErrorMessage = "İptal sebebi belirtilmelidir."), MaxLength(250)]
        public string Reason { get; set; } = string.Empty;
    }

    public class OrderStatusHistoryDto
    {
        public int Id { get; set; }
        public OrderStatus? FromStatus { get; set; }
        public OrderStatus ToStatus { get; set; }
        public DateTime ChangedAt { get; set; }
        public string? ChangedByName { get; set; }
        public string? Notes { get; set; }
    }
}
