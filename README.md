# ☕ CafeFlowNet — Kurumsal Restoran ve Kafe Yönetim Platformu

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Angular 17](https://img.shields.io/badge/Angular-17.3-DD0031?logo=angular)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![SignalR](https://img.shields.io/badge/SignalR-Real--Time-2D74DA)](https://learn.microsoft.com/aspnet/core/signalr/)
[![Tests](https://img.shields.io/badge/Tests-43%20Passed%20(100%25)-success)](#-test-ve-kalite-güvencesi)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

CafeFlowNet; modern restoran, kafe ve zincir işletmelerin dijital menü sunumu, müşteri sipariş takibi, canlı mutfak operasyonları, anlık satış analitiği ve işletme ayarlarını tek bir çatı altında yöneten **uçtan uca, kurumsal seviyede güvenli ve reaktif bir restoran otomasyon platformudur**.

---

## 🚀 Öne Çıkan Özellikler

### 1. 🍽️ Herkese Açık Ziyaretçi Deneyimi
- **Görsel Zengin Menü**: Kategorilere göre gruplanmış, kaliteli görseller, açıklamalar ve canlı fiyatlar.
- **Arama & Anlık Filtreleme**: Kategori bazlı filtreleme ve gerçek zamanlı ürün arama.
- **Ürün Detay Modalı**: Porsiyon, açıklama ve içerik bilgileri.
- **Duyuru Şeridi & Çalışma Bilgisi**: Restoranın anlık duyurusu, adresi, telefon numarası ve çalışma saatleri.
- **Mobil Uyumlu Hızlı Sepet**: Mobil cihazlarda pratik gezinme ve sepet takibi.

### 2. 👤 Sadakat Müşterisi Paneli
- **Güvenli Kimlik Doğrulama**: 15 dakikalık JWT erişim token'ı ve otomatik Refresh Token Rotasyonu (RTR).
- **Akıllı Sepet Yönetimi**: Miktar sınırlaması (üst limit koruması), ürün notu ve tahmini varış saati seçimi.
- **Mükerrer Sipariş Koruması**: Ağ kopmalarında veya çift tıklamada mükerrer siparişi önleyen `IdempotencyKey` desteği.
- **Canlı Sipariş Takip Çubuğu**: 4 aşamalı görsel durum çubuğu (`Alındı ➔ Hazırlanıyor ➔ Hazır ➔ Teslim Edildi`).
- **SignalR ile Anlık Bildirim**: Mutfak durumu değiştirdiğinde sayfayı yenilemeden anında güncellenen ekran.
- **Kendi Siparişini İptal Edebilme**: Yalnızca `Alındı` aşamasında müşteri tarafından iptal hakkı.
- **Tek Tıkla Yeniden Sipariş**: Geçmiş sipariş detaylarını tek dokunuşla sepete aktarma.
- **Profil & Güvenlik Yönetimi**: İletişim bilgisi güncelleme ve güvenli parola değişimi.

### 3. 🛡️ Restoran İşletmesi ve Yönetici Masası
- **Gerçek Veritabanı KPI Dashboard'u**: Bugünün cirosu, toplam sipariş adedi, ortalama sepet büyüklüğü, aktif müşteri sayısı.
- **Satış Analitiği & Grafikler**: Tarih aralığına göre filtrelenen ciro trendleri, en çok satan ürünler ve kategori dağılımı (iptal edilen siparişler hesaplamadan kesinlikle hariç tutulur).
- **Canlı Sipariş Yönetim Panosu (Kanban)**: Durum sütunlarına göre ayrılmış siparişler, durum ilerletme butonları ve audit tarihçesi.
- **Menü & Fiyat Masası**: Kategori ve ürün oluşturma, inline hızlı fiyat güncelleme, satış durumu (mevcut/tükendi) anahtarı, ilişkisel veri bütünlüğünü koruyan **Soft-Delete** mekanizması.
- **Müşteri & Hesap Yönetimi**: Sadakat müşterisi tanımlama, arama, tek tıkla hesabı dondurma veya aktifleştirme (dondurulan hesapların refresh token'ları anında düşürülür).
- **Restoran & Servis Ayarları**: Restoran adı, telefon, adres, çalışma saatleri, minimum sepet tutarı ve acil durumlarda **tek tuşla sipariş alımını durdurma/açma**.

---

## 🔒 Güvenlik Sertleştirmeleri (Security Hardening)

Platform, OWASP standartları ve kurumsal güvenlik kurallarına uygun olarak baştan sona sertleştirilmiştir:

- **Token Yeniden Kullanım Saldırısı Algılama (Replay Detection)**: Daha önce kullanılmış bir refresh token sunulursa, sistem bunu oturum hırsızlığı olarak algılar ve o kullanıcının tüm aktif oturumlarını derhal sonlandırır.
- **SHA-256 Hashed Token Saklama**: Veritabanında açık metin refresh token tutulmaz.
- **SignalR IDOR (Broken Object Level Authorization) Koruması**: `OrderHub` sunucu tarafında sipariş sahibini veritabanından doğrular; müşterilerin başka müşterilerin sipariş odalarına sızması engellenmiştir.
- **Fiyat Manipülasyonu Koruması**: İstemciden gelen birim fiyatlar kesinlikle yok sayılır; resmi tutar sunucudaki güncel menü fiyatlarından hesaplanır.
- **Rate Limiting**: Brute-force saldırılarına karşı kimlik doğrulama uçlarında IP başına dakikada maksimum 5 istek sınırı uygulanmıştır.
- **Üretim Anahtarı Koruması**: Canlı ortamda varsayılan veya zayıf JWT gizli anahtarı tespit edildiğinde API güvenlik amacıyla çalışmayı durdurur.

Detaylı güvenlik dokümantasyonu için [docs/SECURITY.md](docs/SECURITY.md) dosyasını inceleyin.

---

## 🧪 Test ve Kalite Güvencesi

Proje, **30 backend** ve **13 frontend** olmak üzere toplam **43 adet otomatik test** ile tam kapsamlı olarak doğrulanmıştır:

```bash
# Arka yüz testlerini çalıştırma (30 Test)
dotnet test

# Ön yüz testlerini çalıştırma (13 Test)
cd cafeflow-frontend
npm test

# Ön yüz üretim derlemesi (0 Hata / 0 Uyarı)
npm run build
```

| Test Paketi | Test Sayısı | Durum |
| :--- | :---: | :---: |
| `AuthTests.cs` (Token rotasyonu, replay tespiti, profil güncelleme) | 6 | ✅ Geçti |
| `OrderTests.cs` (Fiyat manipülasyonu, idempotency, iptal kuralları) | 5 | ✅ Geçti |
| `OrderStatusMachineTests.cs` (Durum geçişleri, terminal kilitleri, audit) | 4 | ✅ Geçti |
| `MenuAndCustomerTests.cs` (Soft-delete, kategori CRUD, müşteri dondurma) | 5 | ✅ Geçti |
| `ReportTests.cs` (Gerçek ciro hesabı, iptallerin dışlanması, en çok satanlar) | 3 | ✅ Geçti |
| `SignalROwnershipTests.cs` (SignalR IDOR yetki engellemesi) | 3 | ✅ Geçti |
| `ApiIntegrationTests.cs` (HTTP 401/403 uçtan uca koruma, ProblemDetails) | 4 | ✅ Geçti |
| `Frontend Testleri` (Sepet yönetimi, yetki rolleri, sipariş durum kuralları) | 13 | ✅ Geçti |
| **TOPLAM** | **43** | **%100 Başarılı** |

Detaylı test raporu ve çıktıları için [docs/TEST-REPORT.md](docs/TEST-REPORT.md) dosyasını inceleyin.

---

## 📁 Proje Dizin Yapısı

```text
CafeFlowNet/
├── CafeFlow.sln                          # Ana Visual Studio Çözüm Dosyası
├── CafeFlow.API/                         # .NET 8 Web API Projesi
│   ├── Controllers/                      # REST API Uç Noktaları
│   ├── Data/                             # EF Core DbContext, İndeksler ve İlişkiler
│   ├── DTOs/                             # İstek ve Yanıt Veri Modelleri
│   ├── Hubs/                             # SignalR OrderHub (Gerçek Zamanlı WebSocket)
│   ├── Migrations/                       # EF Core Veritabanı Migration Dosyaları
│   ├── Models/                           # Veritabanı Varlıkları (User, Order, MenuItem vb.)
│   ├── Services/                         # İş Kuralları Servisleri (Auth, Order, Menu vb.)
│   └── Program.cs                        # Pipeline, Rate Limiting, CORS ve DI Yapılandırması
├── CafeFlow.Tests/                       # .NET 8 xUnit Test Projesi (30 Test)
├── cafeflow-frontend/                    # Angular 17 SPA Projesi
│   ├── src/app/
│   │   ├── core/                         # Guards, Interceptors, Modeller ve Servisler
│   │   ├── features/
│   │   │   ├── public-menu/              # Herkese Açık Menü ve Sepet Bileşeni
│   │   │   ├── auth/                     # Giriş ve Kayıt Bileşeni
│   │   │   ├── loyal-customer/           # Sipariş Takip, Sepet, Geçmiş ve Profil
│   │   │   └── admin/                    # Dashboard, Sipariş, Menü, Müşteri, Ayarlar
│   │   └── shared/                       # Ortak Toast ve Modal Bileşenleri
│   └── tests/                            # Ön Yüz Birim Testleri (13 Test)
└── docs/                                 # Kapsamlı Dokümantasyon Dosyaları
    ├── ARCHITECTURE.md                   # Sistem ve Katman Mimarisi
    ├── SECURITY.md                       # Güvenlik ve Sertleştirme İlkeleri
    ├── TEST-REPORT.md                    # Otomatik Test ve Doğrulama Raporu
    ├── DEPLOYMENT.md                     # Canlıya Alma ve Docker Dağıtım Kılavuzu
    └── BASELINE-TEST-REPORT.md           # Başlangıç Durumu Ölçüm Raporu
```

---

## ⚡ Hızlı Başlangıç (Yerel Geliştirme)

### 1. Ön Koşullar
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js (v18+)](https://nodejs.org/)
- SQL Server veya SQL Server LocalDB (`sqllocaldb start mssqllocaldb`)

### 2. Arka Yüzü Çalıştırma
```bash
cd CafeFlow.API

# Veritabanını oluşturma ve migration'ları uygulama
dotnet ef database update

# API'yi başlatma
dotnet run
```
API varsayılan olarak `http://localhost:5076` (veya `https://localhost:7080`) adresinde çalışır. Swagger dokümantasyonuna `/swagger` adresinden erişebilirsiniz.

### 3. Ön Yüzü Çalıştırma
```bash
cd cafeflow-frontend

# Bağımlılıkları yükleme
npm install

# Geliştirme sunucusunu başlatma
npm start
```
Uygulama tarayıcınızda otomatik olarak `http://localhost:4200` adresinde açılacaktır.

---

## 🔑 Demo Giriş Bilgileri (Varsayılan Kullanıcılar)

Giriş ekranındaki hızlı butonlar kullanılarak veya aşağıdaki bilgilerle oturum açılabilir:

| Rol | E-posta | Parola | Yetkiler |
| :--- | :--- | :--- | :--- |
| **Yönetici (Admin)** | `owner@cafeflow.com` | `Admin123!` | Dashboard, Canlı Siparişler, Menü/Fiyat, Müşteriler, Ayarlar |
| **Müşteri (Customer)** | `customer@test.com` | `Customer123!` | Menü İnceleme, Sepet, Canlı Sipariş Takibi, Sipariş Geçmişi |

---

## 📚 Dokümantasyon İndeksi
- [Sistem Mimarisi (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Uygulama Güvenliği (SECURITY.md)](docs/SECURITY.md)
- [Test ve Doğrulama Raporu (TEST-REPORT.md)](docs/TEST-REPORT.md)
- [Dağıtım ve Canlıya Alma (DEPLOYMENT.md)](docs/DEPLOYMENT.md)
- [Başlangıç Test Raporu (BASELINE-TEST-REPORT.md)](docs/BASELINE-TEST-REPORT.md)

---

## 📄 Lisans
Bu proje MIT lisansı ile lisanslanmıştır.
