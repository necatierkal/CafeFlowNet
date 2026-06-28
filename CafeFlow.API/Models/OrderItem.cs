using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CafeFlow.API.Models
{
    public class OrderItem
    {
        [Key]
        public int Id { get; set; }

        public Guid OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order? Order { get; set; }

        public int MenuItemId { get; set; }

        [ForeignKey(nameof(MenuItemId))]
        public MenuItem? MenuItem { get; set; }

        [Required, Range(1, 100)]
        public int Quantity { get; set; }

        // Snapshot of price at order time, in case the menu price changes later
        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; }

        // Snapshot of name at order time, in case the item is renamed/removed later
        [Required, MaxLength(200)]
        public string ItemName { get; set; } = string.Empty;

        [NotMapped]
        public decimal LineTotal => UnitPrice * Quantity;
    }
}
