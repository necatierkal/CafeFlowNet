# CafeFlowNet — Başlangıç Durumu ve Temel Test Raporu (Baseline Test Report)

**Tarih:** 25 Ekim 2026  
**Branch:** `feature/restaurant-platform-upgrade` (başlangıç noktası: `master` commit `1eab449`)  
**Ortam:** Windows 10/11, .NET SDK 9.0.319 (.NET 8 hedefli), Node.js v24.22.1, npm 11.19.1, SQL Server LocalDB (15.0.4382.1)

---

## 1. İlk Keşif ve Özet Durum

Proje ilk incelendiğinde aşağıdaki temel yapılar tespit edilmiştir:
- **Backend:** `CafeFlow.API` (ASP.NET Core .NET 8 Web API, Entity Framework Core 8.0.8, SignalR, JWT Bearer)
- **Frontend:** `cafeflow-frontend` (Angular 17, Tailwind CSS, TypeScript 5.4)
- **Veritabanı:** SQL Server LocalDB (`MSSQLLocalDB` servisi kurulu ve başlatılabilir durumda)

---

## 2. Derleme ve Test Başlangıç Ölçümleri

| Adım | Komut | Başlangıç Sonucu | Açıklama / Hata Nedeni |
|---|---|---|---|
| **Backend Restore & Build** | `dotnet build CafeFlow.API` | **BAŞARILI** (0 Hata, 0 Uyarı) | Proje net8.0 olarak derlenmektedir. |
| **Backend Testleri** | `dotnet test` | **BAŞARISIZ / EKSİK** | Depoda herhangi bir .NET test projesi (`*.Tests.csproj`) bulunmamaktadır (0 test çalıştı). |
| **Frontend Bağımlılıkları** | `npm list --depth=0` | **MEVCUT** | `node_modules` mevcut, Angular 17 ve Tailwind kurulu. |
| **Frontend Production Build** | `npm run build` | **BAŞARILI** | `ng build` 3.98 saniyede tamamlandı, bundle'lar üretildi. |
| **Frontend Testleri** | `npm test` | **BAŞARISIZ** | `angular.json` dosyasında `architect.test` hedefi tanımlı değildir ve test runner yapılandırılmamıştır (`Error: Unknown arguments`). |
| **E2E Testleri** | N/A | **YOK** | Uçtan uca test senaryoları mevcut değildir. |

---

## 3. Mimari ve Güvenlik Boşlukları (Baseline Güvenlik Taraması)

1. **JWT Gizli Anahtarı (`appsettings.json`):**
   - Sabit yer tutucu anahtar: `REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS`.
   - Üretim ortamında geçersiz/zayıf secret ile başlamayı engelleyen doğrulama mekanizması bulunmuyor.

2. **Varsayılan Yönetici ve Seed Verisi:**
   - `AppDbContext.cs` içinde sabit admin hesabı (`owner@cafeflow.com`) ve sabit BCrypt şifre hash'i (`Admin123!`) doğrudan seed edilmektedir.
   - İlk kurulumda şifre değiştirme zorunluluğu veya güvenli bootstrap mekanizması yoktur.

3. **SignalR Yetkilendirme & IDOR Zafiyeti:**
   - `OrderHub.cs`: `JoinOrderGroup(string orderId)` ve `LeaveOrderGroup(string orderId)` metotlarında sipariş sahipliği doğrulanmamaktadır.
   - Herhangi bir müşteri başka bir müşterinin GUID sipariş ID'sini belirterek canlı sipariş güncellemelerini dinleyebilmektedir.

4. **Sipariş Durum Makinesi & Veri Bütünlüğü:**
   - `OrderService.UpdateStatusAsync` herhangi bir durumdan herhangi bir duruma geçişe izin vermektedir (örneğin `Completed` -> `Received` veya `Cancelled` -> `Ready`).
   - Sipariş durum geçmişi (`OrderAudit` / `OrderStatusHistory`) tablosu bulunmamaktadır.
   - Müşteri tarafında sipariş iptal kuralı ve uç noktası yoktur.
   - İdempotency / mükerrer sipariş koruması yoktur.

5. **Menü & Ürün Silme Bütünlüğü:**
   - `MenuService.DeleteItemAsync` ürünü doğrudan veritabanından silmeye (`Remove`) çalışmaktadır. Geçmiş sipariş kalemleri (`OrderItem`) bu ürüne bağlı olduğunda SQL Server FK kısıtlaması nedeniyle exception fırlatılmaktadır. Ürünü pasife alma / arşivleme mekanizması eksiktir.

6. **Refresh Token Güvenliği:**
   - Refresh token'lar veritabanında düz metin olarak saklanmaktadır (hash saklanmamaktadır).
   - Token reuse (yeniden kullanım / çalınan token tekrarı) tespiti ve kullanıcı token ailesini geçersiz kılma mekanizması yoktur.
   - `RefreshTokenAsync` metodunda kullanıcının `IsActive` durumu kontrol edilmemektedir.
   - Müşteri pasife alındığında (`LoyaltyService.RemoveLoyalCustomerAsync`) aktif refresh token'ları iptal edilmemektedir.

7. **Kullanıcı Kayıt & Profil Yönetimi:**
   - Herkese açık ziyaretçilerin müşteri olarak kayıt olabileceği bir `Register` uç noktası yoktur.
   - Kullanıcıların profil görüntüleme, güncelleme ve şifre değiştirme uç noktaları bulunmamaktadır.

8. **Dashboard & Raporlama:**
   - Yönetim paneli için backend'de gerçek SQL agregasyonlarıyla çalışan ciro, sipariş dağılımı, en çok satan ürünler gibi raporlama uçları yoktur.

9. **Frontend Güvenlik ve Dayanıklılık:**
   - `AuthService.loadStoredUser()` içinde bozuk `sessionStorage` JSON verisi geldiğinde `JSON.parse` uygulamayı çökertmektedir.
   - `jwt.interceptor.ts` paralel gelen 401 yanıtlarında birden fazla eşzamanlı refresh isteği tetikleyerek yarış durumuna (race condition) neden olmaktadır.
   - Çıkış yapıldığında (`logout`) SignalR bağlantısı kesilmemektedir.
   - Açık/koyu tema desteği, gelişmiş filtreler, boş durumlar ve ürün detay modalı eksiktir.

---

## 4. Sonraki Adımlar ve Hedefler

Bu başlangıç raporundaki eksikliklerin tamamı; backend mimarisinde servis ve güvenlik katmanları, SQL Server migration'ları, Angular bileşen ve servis güncellemeleri, kapsamlı xUnit backend testleri ve frontend testleri ile adım adım çözülecektir.
