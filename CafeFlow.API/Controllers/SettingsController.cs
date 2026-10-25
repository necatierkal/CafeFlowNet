using CafeFlow.API.DTOs;
using CafeFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeFlow.API.Controllers
{
    [ApiController]
    [Route("api/settings")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingService _settingService;

        public SettingsController(ISettingService settingService)
        {
            _settingService = settingService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<RestaurantSettingDto>> GetSettings()
        {
            var settings = await _settingService.GetSettingsAsync();
            return Ok(settings);
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RestaurantSettingDto>> UpdateSettings([FromBody] UpdateRestaurantSettingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _settingService.UpdateSettingsAsync(dto);
            return Ok(updated);
        }
    }
}
