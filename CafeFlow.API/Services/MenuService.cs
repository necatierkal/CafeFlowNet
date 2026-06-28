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
        Task<MenuItemDto> CreateItemAsync(CreateMenuItemDto dto);
        Task<MenuItemDto?> UpdateItemAsync(int id, UpdateMenuItemDto dto);
        Task<bool> DeleteItemAsync(int id);
    }

    public class MenuService : IMenuService
    {
        private readonly AppDbContext _db;

        public MenuService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<MenuCategoryDto>> GetFullMenuAsync(bool includeUnavailable)
        {
            var categories = await _db.MenuCategories
                .Where(c => c.IsActive)
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
                    .Where(mi => includeUnavailable || mi.IsAvailable)
                    .OrderBy(mi => mi.DisplayOrder)
                    .Select(mi => new MenuItemDto
                    {
                        Id = mi.Id,
                        CategoryId = mi.CategoryId,
                        Name = mi.Name,
                        Description = mi.Description,
                        Price = mi.Price,
                        ImageUrl = mi.ImageUrl,
                        IsAvailable = mi.IsAvailable,
                        DisplayOrder = mi.DisplayOrder
                    }).ToList()
            }).ToList();
        }

        public async Task<MenuCategoryDto> CreateCategoryAsync(CreateMenuCategoryDto dto)
        {
            var category = new MenuCategory
            {
                Name = dto.Name,
                DisplayOrder = dto.DisplayOrder,
                IsActive = true
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

        public async Task<MenuItemDto> CreateItemAsync(CreateMenuItemDto dto)
        {
            var item = new MenuItem
            {
                CategoryId = dto.CategoryId,
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                ImageUrl = dto.ImageUrl,
                IsAvailable = dto.IsAvailable,
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
            var item = await _db.MenuItems.FindAsync(id);
            if (item is null) return null;

            // Only update fields explicitly provided — this is what lets owners
            // change just the price without touching anything else.
            if (dto.Name is not null) item.Name = dto.Name;
            if (dto.Description is not null) item.Description = dto.Description;
            if (dto.Price.HasValue) item.Price = dto.Price.Value;
            if (dto.ImageUrl is not null) item.ImageUrl = dto.ImageUrl;
            if (dto.IsAvailable.HasValue) item.IsAvailable = dto.IsAvailable.Value;
            if (dto.DisplayOrder.HasValue) item.DisplayOrder = dto.DisplayOrder.Value;

            item.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return ToDto(item);
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            var item = await _db.MenuItems.FindAsync(id);
            if (item is null) return false;

            _db.MenuItems.Remove(item);
            await _db.SaveChangesAsync();
            return true;
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
