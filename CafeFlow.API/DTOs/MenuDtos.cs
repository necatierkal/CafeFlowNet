using System.ComponentModel.DataAnnotations;

namespace CafeFlow.API.DTOs
{
    public class MenuCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public List<MenuItemDto> Items { get; set; } = new();
    }

    public class MenuItemDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class CreateMenuItemDto
    {
        [Required]
        public int CategoryId { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required, Range(0.01, 100000)]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool IsAvailable { get; set; } = true;

        public int DisplayOrder { get; set; }
    }

    public class UpdateMenuItemDto
    {
        [MaxLength(200)]
        public string? Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Range(0.01, 100000)]
        public decimal? Price { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool? IsAvailable { get; set; }

        public int? DisplayOrder { get; set; }
    }

    public class CreateMenuCategoryDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }
    }
}
