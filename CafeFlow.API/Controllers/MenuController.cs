using CafeFlow.API.DTOs;
using CafeFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeFlow.API.Controllers
{
    [ApiController]
    [Route("api/menu")]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        // Public — no auth required. Guests and loyal customers both use this.
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<ActionResult<List<MenuCategoryDto>>> GetMenu()
        {
            // Public callers only see available items
            var menu = await _menuService.GetFullMenuAsync(includeUnavailable: false);
            return Ok(menu);
        }

        // Admin — sees unavailable items too, so they can re-enable them
        [HttpGet("categories/admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<MenuCategoryDto>>> GetMenuForAdmin()
        {
            var menu = await _menuService.GetFullMenuAsync(includeUnavailable: true);
            return Ok(menu);
        }

        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuCategoryDto>> CreateCategory(CreateMenuCategoryDto dto)
        {
            var category = await _menuService.CreateCategoryAsync(dto);
            return CreatedAtAction(nameof(GetMenu), category);
        }

        [HttpPost("items")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuItemDto>> CreateItem(CreateMenuItemDto dto)
        {
            var item = await _menuService.CreateItemAsync(dto);
            return CreatedAtAction(nameof(GetMenu), item);
        }

        // This is the endpoint owners use to change a price quickly.
        // Send only the fields you want to change — e.g. { "price": 7.50 }
        [HttpPut("items/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuItemDto>> UpdateItem(int id, UpdateMenuItemDto dto)
        {
            var item = await _menuService.UpdateItemAsync(id, dto);
            if (item is null) return NotFound();
            return Ok(item);
        }

        [HttpDelete("items/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var deleted = await _menuService.DeleteItemAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
