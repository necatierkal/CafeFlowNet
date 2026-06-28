using System.ComponentModel.DataAnnotations;
using CafeFlow.API.Models;

namespace CafeFlow.API.DTOs
{
    public class CreateOrderDto
    {
        [Required, MinLength(1)]
        public List<CreateOrderItemDto> Items { get; set; } = new();

        public DateTime? EstimatedArrival { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class CreateOrderItemDto
    {
        [Required]
        public int MenuItemId { get; set; }

        [Required, Range(1, 100)]
        public int Quantity { get; set; }
    }

    public class OrderDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public OrderStatus Status { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
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
    }
}
