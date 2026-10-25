using CafeFlow.API.Data;
using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.API.Services
{
    public interface IMenuService
    {
        Task<List<MenuCategoryDto>> GetFullMenuAsync(bool includeUnavailable);
        Task<MenuCategoryDto> CreateCategoryAsync(CreateMenuCategoryDto dto);
        Task<MenuCategoryDto?> UpdateCategoryAsync(int id, UpdateMenuCategoryDto dto);
        Task<bool> DeleteCategoryAsync(int id);
        Task<MenuItemDto> CreateItemAsync(CreateMenuItemDto dto);
        Task<MenuItemDto?> UpdateItemAsync(int id, UpdateMenuItemDto dto);
        Task<bool> DeleteItemAsync(int id);
        Task<MenuItemDto?> GetItemByIdAsync(int id);
    }

    public class MenuService : IMenuService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<MenuService> _logger;

        public MenuService(AppDbContext db, ILogger<MenuService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<List<MenuCategoryDto>> GetFullMenuAsync(bool includeUnavailable)
        {
            var categories = await _db.MenuCategories
                .Where(c => !c.IsDeleted && (includeUnavailable || c.IsActive))
                .OrderBy(c => c.DisplayOrder)
                .Include(c => c.MenuItems)
                .ToListAsync();

            return categories.Select(c => new MenuCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive,
                Items = c.MenuItems
                    .Where(mi => !mi.IsDeleted && (includeUnavailable || mi.IsAvailable))
                    .OrderBy(mi => mi.DisplayOrder)
                    .Select(ToDto).ToList()
            }).ToList();
        }

        public async Task<MenuCategoryDto> CreateCategoryAsync(CreateMenuCategoryDto dto)
        {
            var category = new MenuCategory
            {
                Name = dto.Name.Trim(),
                DisplayOrder = dto.DisplayOrder,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };
            _db.MenuCategories.Add(category);
            await _db.SaveChangesAsync();

            return new MenuCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive
            };
        }

        public async Task<MenuCategoryDto?> UpdateCategoryAsync(int id, UpdateMenuCategoryDto dto)
        {
            var category = await _db.MenuCategories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (category is null) return null;

            if (!string.IsNullOrWhiteSpace(dto.Name)) category.Name = dto.Name.Trim();
            if (dto.DisplayOrder.HasValue) category.DisplayOrder = dto.DisplayOrder.Value;
            if (dto.IsActive.HasValue) category.IsActive = dto.IsActive.Value;

            await _db.SaveChangesAsync();

            return new MenuCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive
            };
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _db.MenuCategories
                .Include(c => c.MenuItems)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

            if (category is null) return false;

            category.IsDeleted = true;
            category.IsActive = false;

            // Also mark items as deleted
            foreach (var item in category.MenuItems)
            {
                item.IsDeleted = true;
                item.IsAvailable = false;
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<MenuItemDto> CreateItemAsync(CreateMenuItemDto dto)
        {
            if (dto.Price < 0)
                throw new ArgumentException("Fiyat sıfır veya pozitif olmalıdır.");

            var categoryExists = await _db.MenuCategories.AnyAsync(c => c.Id == dto.CategoryId && !c.IsDeleted);
            if (!categoryExists)
                throw new ArgumentException("Belirtilen kategori bulunamadı.");

            var item = new MenuItem
            {
                CategoryId = dto.CategoryId,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Price = dto.Price,
                ImageUrl = dto.ImageUrl?.Trim(),
                IsAvailable = dto.IsAvailable,
                IsDeleted = false,
                DisplayOrder = dto.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.MenuItems.Add(item);
            await _db.SaveChangesAsync();

            return ToDto(item);
        }

        public async Task<MenuItemDto?> UpdateItemAsync(int id, UpdateMenuItemDto dto)
        {
            var item = await _db.MenuItems.FirstOrDefaultAsync(mi => mi.Id == id && !mi.IsDeleted);
            if (item is null) return null;

            if (dto.Price.HasValue && dto.Price.Value < 0)
                throw new ArgumentException("Fiyat sıfır veya pozitif olmalıdır.");

            if (dto.CategoryId.HasValue)
            {
                var categoryExists = await _db.MenuCategories.AnyAsync(c => c.Id == dto.CategoryId.Value && !c.IsDeleted);
                if (!categoryExists)
                    throw new ArgumentException("Belirtilen kategori bulunamadı.");
                item.CategoryId = dto.CategoryId.Value;
            }

            if (dto.Name is not null) item.Name = dto.Name.Trim();
            if (dto.Description is not null) item.Description = dto.Description.Trim();
            if (dto.Price.HasValue) item.Price = dto.Price.Value;
            if (dto.ImageUrl is not null) item.ImageUrl = dto.ImageUrl.Trim();
            if (dto.IsAvailable.HasValue) item.IsAvailable = dto.IsAvailable.Value;
            if (dto.DisplayOrder.HasValue) item.DisplayOrder = dto.DisplayOrder.Value;

            item.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return ToDto(item);
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            var item = await _db.MenuItems.FirstOrDefaultAsync(mi => mi.Id == id && !mi.IsDeleted);
            if (item is null) return false;

            // Check if item was ever ordered in any past order
            var isUsedInOrders = await _db.OrderItems.AnyAsync(oi => oi.MenuItemId == id);

            if (isUsedInOrders)
            {
                // Soft-delete to preserve foreign key integrity and order snapshots
                _logger.LogInformation("MenuItem {ItemId} is referenced by existing orders. Soft-deleting it.", id);
                item.IsDeleted = true;
                item.IsAvailable = false;
                item.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _logger.LogInformation("MenuItem {ItemId} is not referenced. Hard-deleting it.", id);
                _db.MenuItems.Remove(item);
            }

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<MenuItemDto?> GetItemByIdAsync(int id)
        {
            var item = await _db.MenuItems.FirstOrDefaultAsync(mi => mi.Id == id && !mi.IsDeleted);
            return item == null ? null : ToDto(item);
        }

        private static MenuItemDto ToDto(MenuItem mi) => new()
        {
            Id = mi.Id,
            CategoryId = mi.CategoryId,
            Name = mi.Name,
            Description = mi.Description,
            Price = mi.Price,
            ImageUrl = mi.ImageUrl,
            IsAvailable = mi.IsAvailable,
            DisplayOrder = mi.DisplayOrder
        };
    }
}
