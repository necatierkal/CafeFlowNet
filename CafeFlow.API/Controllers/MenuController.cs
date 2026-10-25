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

        // Public — no auth required. Guests and customers both use this.
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<ActionResult<List<MenuCategoryDto>>> GetMenu()
        {
            var menu = await _menuService.GetFullMenuAsync(includeUnavailable: false);
            return Ok(menu);
        }

        // Admin — sees unavailable items too
        [HttpGet("categories/admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<MenuCategoryDto>>> GetMenuForAdmin()
        {
            var menu = await _menuService.GetFullMenuAsync(includeUnavailable: true);
            return Ok(menu);
        }

        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuCategoryDto>> CreateCategory([FromBody] CreateMenuCategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var category = await _menuService.CreateCategoryAsync(dto);
            return CreatedAtAction(nameof(GetMenu), category);
        }

        [HttpPut("categories/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuCategoryDto>> UpdateCategory(int id, [FromBody] UpdateMenuCategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var category = await _menuService.UpdateCategoryAsync(id, dto);
            if (category is null) return NotFound(new { message = "Kategori bulunamadı." });

            return Ok(category);
        }

        [HttpDelete("categories/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var deleted = await _menuService.DeleteCategoryAsync(id);
            if (!deleted) return NotFound(new { message = "Kategori bulunamadı." });

            return NoContent();
        }

        [HttpGet("items/{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<MenuItemDto>> GetItem(int id)
        {
            var item = await _menuService.GetItemByIdAsync(id);
            if (item is null) return NotFound(new { message = "Ürün bulunamadı." });

            return Ok(item);
        }

        [HttpPost("items")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuItemDto>> CreateItem([FromBody] CreateMenuItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var item = await _menuService.CreateItemAsync(dto);
                return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("items/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuItemDto>> UpdateItem(int id, [FromBody] UpdateMenuItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var item = await _menuService.UpdateItemAsync(id, dto);
                if (item is null) return NotFound(new { message = "Ürün bulunamadı." });

                return Ok(item);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("items/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var deleted = await _menuService.DeleteItemAsync(id);
            if (!deleted) return NotFound(new { message = "Ürün bulunamadı." });

            return NoContent();
        }
    }
}
