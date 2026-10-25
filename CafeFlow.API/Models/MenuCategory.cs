using System.ComponentModel.DataAnnotations;

namespace CafeFlow.API.Models
{
    public class MenuCategory
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
    }
}
