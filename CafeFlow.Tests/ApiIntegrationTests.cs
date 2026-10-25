using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CafeFlow.API.Data;
using CafeFlow.API.DTOs;
using CafeFlow.API.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CafeFlow.Tests
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName = Guid.NewGuid().ToString();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");

            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add in-memory database for integration tests
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase(_dbName);
                });

                // Seed database
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.EnsureCreated();

                // Add test customer and item if not present
                if (!db.MenuItems.Any(i => i.Id == 500))
                {
                    db.MenuCategories.Add(new MenuCategory { Id = 50, Name = "İçecekler", DisplayOrder = 1, IsActive = true });
                    db.MenuItems.Add(new MenuItem { Id = 500, CategoryId = 50, Name = "Filtre Kahve", Price = 45.00m, IsAvailable = true });
                    db.SaveChanges();
                }
            });
        }
    }

    public class ApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        private readonly HttpClient _client;

        public ApiIntegrationTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task HealthCheck_ReturnsOk()
        {
            var response = await _client.GetAsync("/health");
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task GetPublicSettings_ReturnsSuccessAndRestaurantInfo()
        {
            var response = await _client.GetAsync("/api/settings");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var setting = await response.Content.ReadFromJsonAsync<RestaurantSettingDto>();
            setting.Should().NotBeNull();
            setting!.RestaurantName.Should().NotBeNullOrWhiteSpace();
        }

        [Fact]
        public async Task GetPublicMenu_ReturnsCategoriesAndItems()
        {
            var response = await _client.GetAsync("/api/menu/categories");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var categories = await response.Content.ReadFromJsonAsync<List<MenuCategoryDto>>();
            categories.Should().NotBeNull();
            categories.Should().NotBeEmpty();
        }

        [Fact]
        public async Task ProtectedEndpoints_WithoutToken_ReturnUnauthorized()
        {
            var response1 = await _client.GetAsync("/api/orders");
            response1.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

            var response2 = await _client.GetAsync("/api/orders/my");
            response2.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

            var response3 = await _client.GetAsync("/api/customers/loyal");
            response3.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task EndToEnd_CustomerRegister_Login_PlaceOrder_VerifyHistory()
        {
            var uniqueEmail = $"e2e_{Guid.NewGuid()}@cafeflow.com";

            // 1. Register
            var regResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterDto
            {
                FullName = "E2E Test Müşterisi",
                Email = uniqueEmail,
                PhoneNumber = "+905559998877",
                Password = "Sifre123456!"
            });

            regResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var regData = await regResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
            regData.Should().NotBeNull();
            var token = regData!.AccessToken;

            // 2. Set Authorization header
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // 3. Customer tries to access admin-only endpoint -> 403 Forbidden
            var forbiddenResponse = await _client.GetAsync("/api/customers/loyal");
            forbiddenResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden, "Customers cannot access admin endpoints");

            // 4. Customer places an order
            var orderResponse = await _client.PostAsJsonAsync("/api/orders", new CreateOrderDto
            {
                Notes = "Masaya servis lütfen",
                Items = new List<CreateOrderItemDto>
                {
                    new() { MenuItemId = 500, Quantity = 2 }
                }
            });

            orderResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var createdOrder = await orderResponse.Content.ReadFromJsonAsync<OrderDto>();
            createdOrder.Should().NotBeNull();
            createdOrder!.TotalAmount.Should().Be(90.00m); // 2 * 45 TL

            // 5. Customer views their orders
            var myOrdersResponse = await _client.GetAsync("/api/orders/my");
            myOrdersResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            var myOrders = await myOrdersResponse.Content.ReadFromJsonAsync<List<OrderDto>>();
            myOrders.Should().NotBeNull();
            myOrders!.Should().Contain(o => o.Id == createdOrder.Id);

            // 6. Customer cancels order in Received state
            var cancelResponse = await _client.PostAsJsonAsync($"/api/orders/{createdOrder.Id}/cancel", new CancelOrderDto
            {
                Reason = "E2E test iptali"
            });
            cancelResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            var cancelledOrder = await cancelResponse.Content.ReadFromJsonAsync<OrderDto>();
            cancelledOrder!.Status.Should().Be(OrderStatus.Cancelled);
        }
    }
}
