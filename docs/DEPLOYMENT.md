# CafeFlowNet — Canlıya Alma ve Dağıtım Kılavuzu (DEPLOYMENT.md)

Bu doküman, CafeFlow platformunun geliştirme, test ve canlı (production) ortamlarına dağıtımı, ortam değişkenleri, veritabanı migration yönetimi ve konteynerizasyon adımlarını açıklamaktadır.

---

## 1. Sistem Gereksinimleri

- **İşletim Sistemi**: Linux (Ubuntu 22.04 LTS önerilir) veya Windows Server 2022
- **Arka Yüz Çalışma Zamanı**: .NET 8 Runtime (veya .NET 8 SDK derleme için)
- **Ön Yüz**: Node.js 18+ (derleme aşaması için), Nginx veya IIS (statik barındırma için)
- **Veritabanı**: Microsoft SQL Server 2019+ / Azure SQL Database / AWS RDS for SQL Server
- **Ağ**: HTTPS desteği (Port 443), WebSocket (SignalR) desteği

---

## 2. Ortam Değişkenleri ve Yapılandırma

Üretim ortamında hassas bilgiler kesinlikle kod dosyaları veya `appsettings.json` içinde tutulmamalı, ortam değişkenleri (Environment Variables) ya da bir Secret Manager (Azure Key Vault, AWS Secrets Manager) üzerinden enjekte edilmelidir.

### 2.1. Arka Yüz (.NET 8) Değişkenleri

| Değişken Adı | Açıklama | Örnek Değer |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | Çalışma ortamı | `Production` |
| `ConnectionStrings__DefaultConnection` | SQL Server bağlantı dizesi | `Server=db.example.com;Database=CafeFlowDb;User Id=cafeflow_user;Password=StrongP@ssw0rd!;TrustServerCertificate=False;Encrypt=True;` |
| `Jwt__Secret` | JWT imzalama anahtarı (Min. 32 karakter) | `Prod_SuperSecretKey_9876543210_LongerThan32Chars!` |
| `Jwt__Issuer` | Token üreticisi | `CafeFlow.API` |
| `Jwt__Audience` | Token hedef kitlesi | `CafeFlow.Client` |
| `Jwt__AccessTokenLifetimeMinutes` | Access Token süresi | `15` |
| `Jwt__RefreshTokenLifetimeDays` | Refresh Token süresi | `7` |
| `Cors__AllowedOrigins__0` | Ön yüz origin adresi | `https://cafeflow.example.com` |

> [!WARNING]
> Üretim ortamında `Jwt__Secret` değeri varsayılan veya zayıf bir metin olarak bırakılırsa, uygulama başlatılırken `InvalidOperationException` fırlatılır ve API ayağa kalkmaz.

### 2.2. Ön Yüz (Angular 17) Yapılandırması
`src/environments/environment.prod.ts` dosyası:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.cafeflow.example.com/api',
  hubUrl: 'https://api.cafeflow.example.com/hubs/orders'
};
```

---

## 3. Veritabanı Migration Yönetimi

Üretim veritabanlarına migration uygulanırken iki yöntem kullanılabilir:

### Yöntem A: CI/CD Pipeline Sırasında İdempotent SQL Script ile (Tavsiye Edilen)
EF Core CLI ile daha önce uygulanmış migration'ları kontrol eden güvenli SQL betiği üretilir:
```bash
dotnet ef migrations script --idempotent --project CafeFlow.API --output migrations.sql
```
Bu betik DBA veya veritabanı dağıtım aracı tarafından yürütülür.

### Yöntem B: EF Core CLI ile Doğrudan Güncelleme
```bash
dotnet ef database update --project CafeFlow.API --connection "Server=...;Database=...;"
```

---

## 4. Docker ile Konteyner Tabanlı Dağıtım

### 4.1. Arka Yüz Dockerfile (`CafeFlow.API/Dockerfile`)
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CafeFlow.API/CafeFlow.API.csproj", "CafeFlow.API/"]
RUN dotnet restore "CafeFlow.API/CafeFlow.API.csproj"
COPY . .
WORKDIR "/src/CafeFlow.API"
RUN dotnet build "CafeFlow.API.csproj" -c Release -o /app/build
RUN dotnet publish "CafeFlow.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "CafeFlow.API.dll"]
```

### 4.2. Ön Yüz Dockerfile (`cafeflow-frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/cafeflow-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Ön Yüz Nginx Yapılandırması (`nginx.conf`):
SPA rotalarının ve 404 yönlendirmelerinin düzgün çalışması için `try_files` direktifi zorunludur:
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

---

## 5. Sağlık İzleme (Health Checks)

Uygulamanın aktifliği ve yük dengeleyici (Load Balancer) kontrolleri için `/health` uç noktası yapılandırılmıştır:
- **Uç Nokta**: `GET /health`
- **Beklenen Yanıt**: `200 OK` (İçerik: `Healthy`)
- Kubernetes liveness/readiness probe veya AWS Target Group kontrollerinde bu uç nokta kullanılmalıdır.
