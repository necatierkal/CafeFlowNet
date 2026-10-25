# CafeFlowNet — Güvenlik Mimarisi ve Sertleştirme Dokümantasyonu (SECURITY.md)

Bu doküman, CafeFlow platformunda uygulanan güvenlik ilkelerini, kimlik doğrulama/yetkilendirme mekanizmalarını, tespit edilen açıkların giderilme adımlarını ve üretim ortamı güvenlik yönergelerini içerir.

---

## 1. Kimlik Doğrulama ve Token Güvenliği

### 1.1. JWT Access Token ve Yaşam Süresi
- **Kısa Ömürlü Access Token**: İstemciye verilen JWT erişim token'ları 15 dakika süreyle geçerlidir.
- **Güçlü İmzalama Anahtarı**: Üretim ortamında varsayılan veya 32 karakterden kısa anahtarlar tespit edildiğinde uygulama başlatılması engellenir (`InvalidOperationException`).

### 1.2. Refresh Token Rotasyonu (RTR) ve Token Ailesi
- Her token yenileme isteğinde (`POST /api/auth/refresh-token`) kullanılan refresh token iptal edilir ve yeni bir token çifti üretilir.
- **SHA-256 Token Hashleme**: Veritabanında doğrudan açık metin token saklanmaz. Token'ın SHA-256 hash değeri saklanır; böylece veritabanı yedeğinin ele geçirilmesi durumunda bile token'lar kullanılamaz.
- **Yeniden Kullanım Saldırısı Tespiti (Replay Detection)**:
  Eğer daha önce kullanılmış (veya iptal edilmiş) bir refresh token tekrar sunulursa, sistem bunu bir token hırsızlığı olarak işaretler. O token ailesine ait ve ilgili kullanıcının tüm aktif refresh token'ları anında iptal edilir (`ReasonRevoked = "Attempted replay attack detected"`).

### 1.3. Eşzamanlı İstek Yarış Koşulu Koruması (Front-end Mutex)
Angular `JwtInterceptor` içinde `isRefreshing` bayrağı ve `BehaviorSubject` kuyruğu kullanılmıştır. Birbirine yakın 401 yanıtları geldiğinde tek bir yenileme isteği gönderilir; diğer istekler kuyrukta bekletilerek yeni access token ile devam ettirilir. Böylece token yarış koşulları ve gereksiz oturum kapanmaları engellenmiştir.

---

## 2. Yetkilendirme ve Nesne Düzeyinde Erişim Denetimi (IDOR) Koruması

### 2.1. SignalR Oda Aboneliğinde IDOR Koruması
- **Önceki Zafiyet**: Eski sistemde herhangi bir müşteri `JoinOrderGroup(orderId)` fonksiyonunu çağırarak başka müşterilere ait siparişlerin durum güncellemelerini ve sipariş notlarını dinleyebiliyordu.
- **Uygulanan Çözüm**: `OrderHub.JoinOrderGroup` metodunda sunucu tarafında veritabanı sorgusu yapılır:
  ```csharp
  var order = await _dbContext.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId);
  var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
  var isAdmin = Context.User?.IsInRole("Admin") ?? false;

  if (order.CustomerId != currentUserId && !isAdmin)
  {
      throw new HubException("Yetkisiz erişim: Başka bir müşterinin sipariş odasına abone olamazsınız.");
  }
  ```
  Yetkisiz abonelik denemeleri doğrudan engellenir ve loglanır.

### 2.2. Müşteri Sipariş İptali Kısıtlamaları
- Müşteriler yalnızca kendi adlarına kayıtlı (`CustomerId == currentUserId`) siparişler için iptal isteğinde bulunabilir.
- İptal işlemi yalnızca sipariş `Received` (Alındı) durumundayken geçerlidir. Mutfak siparişi hazırlamaya başladığında (`Preparing`, `Ready`, `Completed`) müşterinin iptal hakkı kilitlenir.

### 2.3. Müşteri Hesabı Dondurulduğunda Anında Yetki İptali
Bir müşteri hesabı yönetici tarafından pasife alındığında (`IsActive = false`), kullanıcının tüm aktif refresh token'ları iptal edilir. Bir sonraki istekte access token süresi dolduğunda veya token yenileme istendiğinde oturum sonlandırılır.

---

## 3. İş Mantığı ve Fiyat Manipülasyonu Koruması

### 3.1. Sunucu Taraflı Fiyat ve Tutar Hesaplaması
İstemciden gönderilen sipariş isteklerindeki hiçbir birim fiyat veya toplam tutar güvenilir kabul edilmez.
`OrderService.CreateOrderAsync` servisi:
1. İlgili `MenuItem` kayıtlarını veritabanından çeker.
2. Ürünün satışta (`IsAvailable == true`) ve silinmemiş (`IsDeleted == false`) olduğunu doğrular.
3. Fiyatı doğrudan veritabanındaki resmi değer üzerinden hesaplar.
4. Restoranın minimum sipariş tutarı kuralını (`MinimumOrderAmount`) ve sipariş kabul durumunu (`IsAcceptingOrders`) sunucu tarafında doğrular.

### 3.2. Mükerrer Sipariş ve İdempotency Koruması
Ağ kesintilerinde veya kullanıcının "Siparişi Onayla" butonuna mükerrer tıklamalarında çift sipariş oluşmasını önlemek amacıyla `IdempotencyKey` mekanizması uygulanmıştır. Aynı anahtarla 5 dakika içerisinde gelen mükerrer isteklerde yeni sipariş yaratılmaz, mevcut siparişin kaydı döner.

---

## 4. API Güvenliği, Rate Limiting ve Hata Yönetimi

### 4.1. Hız Sınırlaması (Rate Limiting)
Brute-force (kaba kuvvet) parola denemelerini ve kimlik doğrulama servislerinin kötüye kullanımını engellemek için `Microsoft.AspNetCore.RateLimiting` ile sabit pencereli (fixed-window) kural tanımlanmıştır:
- Kural Adı: `auth-limit`
- Limit: Dakikada maksimum 5 istek (istemci IP adresine göre bölümlenmiş).
- Aşım Durumu: HTTP `429 Too Many Requests`.

### 4.2. RFC 7807 ProblemDetails ve Bilgi Sızıntısı Koruması
Geliştirme dışı (Production) ortamlarda kullanıcıya hassas yığın izleri (stack trace) veya veritabanı hata mesajları gösterilmez. Standart `ProblemDetails` formatında genel hata kodları ve RFC uyumlu açıklamalar iletilir.

---

## 5. Veri Güvenliği ve Parola Standartları

1. **Parola Hashleme**: `BCrypt.Net-Next` algoritması kullanılarak yüksek iş faktörü (work factor) ile tuzlanarak (salt) hashlenir.
2. **SQL Enjeksiyonu Koruması**: Tüm veritabanı erişimleri Entity Framework Core üzerinden parametreli LINQ ifadeleri ile yürütülür; ham SQL birleştirmesi yapılmaz.
3. **CORS Politikası**: Yalnızca tanımlı güvenli ön yüz adreslerine (`http://localhost:4200` vb.) izin verilir.
