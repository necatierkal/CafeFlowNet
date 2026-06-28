namespace CafeFlow.API.Services
{
    public class JwtSettings
    {
        public string Secret { get; set; } = string.Empty;
        public string Issuer { get; set; } = "CafeFlow.API";
        public string Audience { get; set; } = "CafeFlow.Client";
        public int AccessTokenExpiryMinutes { get; set; } = 60;
        public int RefreshTokenExpiryDays { get; set; } = 7;
    }
}
