import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SettingService } from '../../../core/services/setting.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { RestaurantSetting, UpdateRestaurantSettingRequest } from '../../../core/models';

@Component({
  selector: 'app-settings-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      <!-- Admin Top Navbar -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
              ⚙️
            </div>
            <div>
              <span class="text-xl font-black text-slate-900 dark:text-white leading-none block">CafeFlow</span>
              <span class="text-xs text-indigo-600 dark:text-indigo-400 font-bold">İşletme & Sistem Ayarları</span>
            </div>
          </div>

          <!-- Admin Nav Menu -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <a routerLink="/admin" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              📈 Genel Bakış
            </a>
            <a routerLink="/admin/orders" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              🔔 Canlı Siparişler
            </a>
            <a routerLink="/admin/menu" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              🍽️ Menü & Fiyatlar
            </a>
            <a routerLink="/admin/customers" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              👥 Müşteriler
            </a>
            <a routerLink="/admin/settings" class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">
              ⚙️ Ayarlar
            </a>
          </nav>

          <div class="flex items-center gap-3">
            <button (click)="themeService.toggleTheme()" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Tema Değiştir">
              {{ themeService.isDark() ? '☀️' : '🌙' }}
            </button>
            <button (click)="authService.logout()" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        
        <div class="mb-6">
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Restoran ve Hizmet Ayarları</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Müşteri menüsünde görüntülenen restoran detaylarını, sipariş kabul durumunu ve minimum sipariş şartlarını yapılandırın.
          </p>
        </div>

        @if (isLoading()) {
          <div class="py-12 text-center text-slate-400">
            <div class="inline-block animate-spin text-3xl mb-2">⏳</div>
            <p class="text-xs font-medium">Ayarlar yükleniyor...</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Settings Form (2 cols) -->
            <div class="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              
              <!-- Quick Acceptance Toggle Banner -->
              <div class="p-4 rounded-2xl border flex items-center justify-between gap-4"
                   [ngClass]="form.isAcceptingOrders 
                     ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60' 
                     : 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60'">
                <div>
                  <h4 class="text-xs font-bold"
                      [ngClass]="form.isAcceptingOrders ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'">
                    {{ form.isAcceptingOrders ? '🟢 Sipariş Alımı Açık' : '⛔ Sipariş Alımı Durduruldu' }}
                  </h4>
                  <p class="text-[11px] mt-0.5"
                     [ngClass]="form.isAcceptingOrders ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'">
                    {{ form.isAcceptingOrders ? 'Müşteriler sepetlerini onaylayabilir ve sipariş verebilir.' : 'Müşterilere şu anda sipariş alınmadığı uyarısı gösterilir.' }}
                  </p>
                </div>
                <button 
                  type="button" 
                  (click)="form.isAcceptingOrders = !form.isAcceptingOrders" 
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
                  [ngClass]="form.isAcceptingOrders ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'">
                  {{ form.isAcceptingOrders ? 'Durdur' : 'Aç' }}
                </button>
              </div>

              <!-- Form Fields -->
              <form (ngSubmit)="saveSettings()" class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Restoran / Kafe Adı *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="form.restaurantName" 
                    name="restaurantName" 
                    required
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">İletişim Telefonu</label>
                    <input 
                      type="text" 
                      [(ngModel)]="form.phoneNumber" 
                      name="phoneNumber" 
                      placeholder="+90 212 555 0123"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-posta</label>
                    <input 
                      type="email" 
                      [(ngModel)]="form.email" 
                      name="email" 
                      placeholder="info@cafeflow.com"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Çalışma Saatleri</label>
                    <input 
                      type="text" 
                      [(ngModel)]="form.openingHours" 
                      name="openingHours" 
                      placeholder="Her gün 09:00 - 23:30"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min. Sipariş Tutarı (₺)</label>
                    <input 
                      type="number" 
                      [(ngModel)]="form.minimumOrderAmount" 
                      name="minimumOrderAmount" 
                      min="0"
                      step="5"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fiziki Adres</label>
                  <textarea 
                    [(ngModel)]="form.address" 
                    name="address" 
                    rows="2"
                    placeholder="Cadde, sokak, no, ilçe/şehir"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duyuru / İşletme Açıklaması</label>
                  <input 
                    type="text" 
                    [(ngModel)]="form.description" 
                    name="description" 
                    placeholder="Örn: Hafta içi saat 14:00 - 17:00 arası kahve çeşitlerinde %15 indirim!"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p class="text-[10px] text-slate-400 mt-1">Bu metin herkese açık menü sayfasında restoranın tanıtımı olarak gösterilir.</p>
                </div>

                <div class="pt-2">
                  <button 
                    type="submit" 
                    [disabled]="isSaving()" 
                    class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <span>💾</span> {{ isSaving() ? 'Ayarlar Kaydediliyor...' : 'Değişiklikleri Kaydet' }}
                  </button>
                </div>
              </form>

            </div>

            <!-- Preview & Info (1 col) -->
            <div class="space-y-4">
              <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <h3 class="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Müşteri Görünümü Önizleme</h3>
                
                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                      ☕
                    </div>
                    <div>
                      <h4 class="font-bold text-xs text-slate-900 dark:text-white">{{ form.restaurantName || 'Restoran Adı' }}</h4>
                      <p class="text-[10px] text-slate-500">{{ form.openingHours || 'Çalışma saatleri' }}</p>
                    </div>
                  </div>

                  @if (form.description) {
                    <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                      📢 {{ form.description }}
                    </div>
                  }

                  <div class="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <p>📍 {{ form.address || 'Adres bilgisi yok' }}</p>
                    <p>📞 {{ form.phoneNumber || 'Telefon bilgisi yok' }}</p>
                    <p>💳 Min. Sipariş: {{ form.minimumOrderAmount }} ₺</p>
                  </div>
                </div>
              </div>

              <!-- System Security Info -->
              <div class="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
                <h4 class="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>🛡️</span> Sistem Durumu
                </h4>
                <p class="text-indigo-800/80 dark:text-indigo-400/80 text-[11px] leading-relaxed">
                  Tüm ayar güncellemeleri anında API önbelleğine işlenir ve müşterilerin sepet ve menü ekranlarına otomatik olarak yansıtılır.
                </p>
              </div>
            </div>

          </div>
        }

      </main>

    </div>
  `
})
export class SettingsManagerComponent implements OnInit {
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);

  form: UpdateRestaurantSettingRequest = {
    restaurantName: '',
    description: '',
    address: '',
    phoneNumber: '',
    email: '',
    openingHours: '',
    isAcceptingOrders: true,
    minimumOrderAmount: 0
  };

  constructor(
    private settingService: SettingService,
    public authService: AuthService,
    public themeService: ThemeService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.settingService.getSettings().subscribe({
      next: (data: RestaurantSetting) => {
        this.form = {
          restaurantName: data.restaurantName,
          description: data.description || '',
          address: data.address || '',
          phoneNumber: data.phoneNumber || '',
          email: data.email || '',
          openingHours: data.openingHours || '',
          isAcceptingOrders: data.isAcceptingOrders,
          minimumOrderAmount: data.minimumOrderAmount
        };
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Ayarlar yüklenirken bir sorun oluştu.');
        this.isLoading.set(false);
      }
    });
  }

  saveSettings(): void {
    if (!this.form.restaurantName.trim()) {
      this.toast.error('Restoran adı boş bırakılamaz.');
      return;
    }

    this.isSaving.set(true);
    this.settingService.updateSettings(this.form).subscribe({
      next: () => {
        this.toast.success('Restoran ayarları başarıyla güncellendi!');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Ayarlar kaydedilirken hata oluştu.');
        this.isSaving.set(false);
      }
    });
  }
}
