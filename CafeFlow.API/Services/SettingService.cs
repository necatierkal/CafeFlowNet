using CafeFlow.API.Data;
using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.API.Services
{
    public interface ISettingService
    {
        Task<RestaurantSettingDto> GetSettingsAsync();
        Task<RestaurantSettingDto> UpdateSettingsAsync(UpdateRestaurantSettingDto dto);
    }

    public class SettingService : ISettingService
    {
        private readonly AppDbContext _db;

        public SettingService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<RestaurantSettingDto> GetSettingsAsync()
        {
            var setting = await _db.RestaurantSettings.FirstOrDefaultAsync(s => s.Id == 1);
            if (setting == null)
            {
                setting = new RestaurantSetting
                {
                    Id = 1,
                    RestaurantName = "CafeFlow Restaurant & Cafe",
                    Description = "Modern gurme lezzetler, taze çekilmiş nitelikli kahveler ve özel tatlılar.",
                    Address = "Moda Caddesi No: 42, Kadıköy, İstanbul",
                    PhoneNumber = "+90 (216) 555 0123",
                    Email = "iletisim@cafeflow.com",
                    OpeningHours = "Hergün 08:30 - 23:30",
                    IsAcceptingOrders = true,
                    MinimumOrderAmount = 0.00m,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.RestaurantSettings.Add(setting);
                await _db.SaveChangesAsync();
            }

            return ToDto(setting);
        }

        public async Task<RestaurantSettingDto> UpdateSettingsAsync(UpdateRestaurantSettingDto dto)
        {
            var setting = await _db.RestaurantSettings.FirstOrDefaultAsync(s => s.Id == 1);
            if (setting == null)
            {
                setting = new RestaurantSetting { Id = 1 };
                _db.RestaurantSettings.Add(setting);
            }

            setting.RestaurantName = dto.RestaurantName.Trim();
            setting.Description = dto.Description?.Trim();
            setting.Address = dto.Address?.Trim();
            setting.PhoneNumber = dto.PhoneNumber?.Trim();
            setting.Email = dto.Email?.Trim();
            setting.OpeningHours = dto.OpeningHours?.Trim();
            setting.IsAcceptingOrders = dto.IsAcceptingOrders;
            setting.MinimumOrderAmount = dto.MinimumOrderAmount;
            setting.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return ToDto(setting);
        }

        private static RestaurantSettingDto ToDto(RestaurantSetting s) => new()
        {
            Id = s.Id,
            RestaurantName = s.RestaurantName,
            Description = s.Description,
            Address = s.Address,
            PhoneNumber = s.PhoneNumber,
            Email = s.Email,
            OpeningHours = s.OpeningHours,
            IsAcceptingOrders = s.IsAcceptingOrders,
            MinimumOrderAmount = s.MinimumOrderAmount,
            UpdatedAt = s.UpdatedAt
        };
    }
}
