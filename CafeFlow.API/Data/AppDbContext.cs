using CafeFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeFlow.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
        public DbSet<MenuItem> MenuItems => Set<MenuItem>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── User ──
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();

                entity.Property(u => u.Role)
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.HasOne(u => u.AddedByAdmin)
                    .WithMany()
                    .HasForeignKey(u => u.AddedByAdminId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // ── RefreshToken ──
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasIndex(rt => rt.Token).IsUnique();

                entity.HasOne(rt => rt.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ── MenuCategory ──
            modelBuilder.Entity<MenuCategory>(entity =>
            {
                entity.HasIndex(c => c.DisplayOrder);
            });

            // ── MenuItem ──
            modelBuilder.Entity<MenuItem>(entity =>
            {
                entity.HasOne(mi => mi.Category)
                    .WithMany(c => c.MenuItems)
                    .HasForeignKey(mi => mi.CategoryId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(mi => new { mi.CategoryId, mi.DisplayOrder });
            });

            // ── Order ──
            modelBuilder.Entity<Order>(entity =>
            {
                entity.Property(o => o.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.HasOne(o => o.Customer)
                    .WithMany(u => u.Orders)
                    .HasForeignKey(o => o.CustomerId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasIndex(o => o.Status);
                entity.HasIndex(o => o.CreatedAt);
            });

            // ── OrderItem ──
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasOne(oi => oi.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Keep history even if the menu item is later deleted
                entity.HasOne(oi => oi.MenuItem)
                    .WithMany(mi => mi.OrderItems)
                    .HasForeignKey(oi => oi.MenuItemId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // ── Seed data ──
            SeedData(modelBuilder);
        }

        private static void SeedData(ModelBuilder modelBuilder)
        {
            // Fixed GUIDs so migrations are deterministic and re-runnable
            var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            modelBuilder.Entity<User>().HasData(new User
            {
                Id = adminId,
                Email = "owner@cafeflow.com",
                // Password: Admin123!  (BCrypt hash — generate your own in production)
                PasswordHash = "$2a$11$8K1p/a0dURXAm7QiTRqFW.gFKshSE0Pz1QqB0AzgZpZkPj/8/eUlW",
                FullName = "Cafe Owner",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });

            modelBuilder.Entity<MenuCategory>().HasData(
                new MenuCategory { Id = 1, Name = "Starters", DisplayOrder = 1, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new MenuCategory { Id = 2, Name = "Mains", DisplayOrder = 2, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new MenuCategory { Id = 3, Name = "Desserts", DisplayOrder = 3, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new MenuCategory { Id = 4, Name = "Drinks", DisplayOrder = 4, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );

            modelBuilder.Entity<MenuItem>().HasData(
                new MenuItem { Id = 1, CategoryId = 1, Name = "Soup of the Day", Description = "Ask your server", Price = 6.50m, IsAvailable = true, DisplayOrder = 1, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new MenuItem { Id = 2, CategoryId = 2, Name = "Grilled Chicken Sandwich", Description = "With fries and salad", Price = 12.90m, IsAvailable = true, DisplayOrder = 1, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new MenuItem { Id = 3, CategoryId = 3, Name = "Chocolate Cake", Description = "Rich and gooey", Price = 5.90m, IsAvailable = true, DisplayOrder = 1, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new MenuItem { Id = 4, CategoryId = 4, Name = "Flat White", Description = "Double shot espresso", Price = 4.20m, IsAvailable = true, DisplayOrder = 1, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
