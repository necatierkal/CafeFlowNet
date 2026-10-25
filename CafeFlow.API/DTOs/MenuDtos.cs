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
        [Required(ErrorMessage = "Kategori seçilmelidir.")]
        public int CategoryId { get; set; }

        [Required(ErrorMessage = "Ürün adı zorunludur."), MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Fiyat zorunludur."), Range(0.01, 100000, ErrorMessage = "Fiyat 0.01 ile 100,000 arasında olmalıdır.")]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool IsAvailable { get; set; } = true;

        public int DisplayOrder { get; set; }
    }

    public class UpdateMenuItemDto
    {
        public int? CategoryId { get; set; }

        [MaxLength(200)]
        public string? Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Range(0.01, 100000, ErrorMessage = "Fiyat 0.01 ile 100,000 arasında olmalıdır.")]
        public decimal? Price { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool? IsAvailable { get; set; }

        public int? DisplayOrder { get; set; }
    }

    public class CreateMenuCategoryDto
    {
        [Required(ErrorMessage = "Kategori adı zorunludur."), MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }
    }

    public class UpdateMenuCategoryDto
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        public int? DisplayOrder { get; set; }

        public bool? IsActive { get; set; }
    }
}
