using System.Text;
using System.Threading.RateLimiting;
using CafeFlow.API.Data;
using CafeFlow.API.Hubs;
using CafeFlow.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration & JWT Security Enforcement ──
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();

var isDev = builder.Environment.IsDevelopment();
var isWeakSecret = string.IsNullOrWhiteSpace(jwtSettings.Secret) ||
                   jwtSettings.Secret.Contains("REPLACE_WITH_A_LONG_RANDOM_SECRET") ||
                   jwtSettings.Secret.Length < 32;

if (isWeakSecret)
{
    if (!isDev)
    {
        throw new InvalidOperationException("CRITICAL SECURITY ERROR: A secure JWT:Secret (minimum 32 characters) must be configured in Production environment. Do not use default or placeholder keys.");
    }
    // Safe fallback for local development only
    jwtSettings.Secret = "cafeflow_local_dev_secret_key_minimum_32_characters_long_2026!";
}

builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = jwtSettings.Secret;
    options.Issuer = jwtSettings.Issuer;
    options.Audience = jwtSettings.Audience;
    options.AccessTokenExpiryMinutes = jwtSettings.AccessTokenExpiryMinutes;
    options.RefreshTokenExpiryDays = jwtSettings.RefreshTokenExpiryDays;
});

// ── Database ──
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ── Services (DI) ──
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ISettingService, SettingService>();

// ── Rate Limiting (Brute-force protection on Auth endpoints) ──
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth-rate-limit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 15,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// ── Authentication (JWT Bearer) ──
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ClockSkew = TimeSpan.Zero
        };

        // Allow SignalR to receive the JWT via query string (WebSockets can't send headers)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/order"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── CORS — restrict to your Angular app's domain ──
const string CorsPolicy = "CafeFlowFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
            new[] { builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:4200" };

        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // required for SignalR
    });
});

// ── SignalR ──
builder.Services.AddSignalR();

// ── Health Checks ──
builder.Services.AddHealthChecks();

// ── Controllers + Swagger ──
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "CafeFlow API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── Global Exception Handling (RFC 7807 ProblemDetails, no internal leaks) ──
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        context.Response.ContentType = "application/problem+json";
        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        var ex = exceptionHandlerPathFeature?.Error;

        var statusCode = ex switch
        {
            ArgumentException or InvalidOperationException => StatusCodes.Status400BadRequest,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status500InternalServerError
        };

        context.Response.StatusCode = statusCode;

        var message = statusCode == 500 && !app.Environment.IsDevelopment()
            ? "Beklenmeyen bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyiniz."
            : ex?.Message ?? "İşlem sırasında hata oluştu.";

        var problem = new
        {
            type = $"https://httpstatuses.com/{statusCode}",
            title = statusCode == 500 ? "Internal Server Error" : "Bad Request",
            status = statusCode,
            detail = message,
            instance = context.Request.Path
        };

        await context.Response.WriteAsJsonAsync(problem);
    });
});

// ── Controlled Database Migration ──
var autoMigrate = builder.Configuration.GetValue<bool>("Database:AutoMigrate", false) || app.Environment.IsDevelopment();
if (autoMigrate)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Veritabanı migration otomatik uygulaması tamamlanamadı. (Veritabanı erişilemiyor olabilir veya ayrı migration akışı gereklidir)");
    }
}

// ── Middleware pipeline ──
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(CorsPolicy);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers().RequireRateLimiting("auth-rate-limit");
app.MapHub<OrderHub>("/hubs/order");

app.Run();

// For WebApplicationFactory integration tests
public partial class Program { }
