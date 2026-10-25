using CafeFlow.API.Data;
using CafeFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.Tests
{
    public static class TestDbHelper
    {
        public static AppDbContext CreateInMemoryDbContext(string? dbName = null)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
                .Options;

            var db = new AppDbContext(options);
            db.Database.EnsureCreated();
            return db;
        }

        public static async Task<(User admin, User customer, MenuCategory category, MenuItem item)> SeedBasicDataAsync(AppDbContext db)
        {
            var admin = new User
            {
                Id = Guid.NewGuid(),
                Email = "testadmin@cafeflow.com",
                FullName = "Test Admin",
                Role = UserRole.Admin,
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminPass123!")
            };

            var customer = new User
            {
                Id = Guid.NewGuid(),
                Email = "testcustomer@cafeflow.com",
                FullName = "Test Customer",
                Role = UserRole.LoyalCustomer,
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CustomerPass123!")
            };

            var category = new MenuCategory
            {
                Id = 10,
                Name = "Kahveler",
                DisplayOrder = 1,
                IsActive = true,
                IsDeleted = false
            };

            var item = new MenuItem
            {
                Id = 100,
                CategoryId = 10,
                Name = "Latte",
                Description = "Sütlü espresso",
                Price = 50.00m,
                IsAvailable = true,
                IsDeleted = false,
                DisplayOrder = 1
            };

            db.Users.AddRange(admin, customer);
            db.MenuCategories.Add(category);
            db.MenuItems.Add(item);
            await db.SaveChangesAsync();

            return (admin, customer, category, item);
        }
    }
}
