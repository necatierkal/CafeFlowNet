import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { DashboardSummary } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      <!-- Admin Top Navigation Header -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
              📊
            </div>
            <div>
              <span class="text-xl font-black text-slate-900 dark:text-white leading-none block">CafeFlow</span>
              <span class="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Restoran Yönetim Masası</span>
            </div>
          </div>

          <!-- Admin Nav Menu -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <a routerLink="/admin" class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">
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
            <a routerLink="/admin/settings" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              ⚙️ İşletme Ayarları
            </a>
          </nav>

          <!-- Right actions -->
          <div class="flex items-center gap-2.5">
            <button (click)="themeService.toggleTheme()" 
                    class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              @if (themeService.isDark()) { ☀️ } @else { 🌙 }
            </button>

            <button (click)="logout()" 
                    title="Çıkış Yap"
                    class="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
              🚪
            </button>
          </div>
        </div>
      </header>

      <!-- Main Dashboard Container -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        <!-- Header Controls & Date Range Filter -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 class="text-2xl font-black text-slate-900 dark:text-white">İşletme Performansı & Raporlar</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Veritabanından hesaplanan anlık gerçek satış ve sipariş ölçümleri</p>
          </div>

          <div class="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button (click)="setRange('today')"
                    [ngClass]="activeRange === 'today' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'"
                    class="px-3.5 py-1.5 rounded-xl text-xs transition-all">
              Bugün
            </button>
            <button (click)="setRange('7days')"
                    [ngClass]="activeRange === '7days' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'"
                    class="px-3.5 py-1.5 rounded-xl text-xs transition-all">
              Son 7 Gün
            </button>
            <button (click)="setRange('month')"
                    [ngClass]="activeRange === 'month' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'"
                    class="px-3.5 py-1.5 rounded-xl text-xs transition-all">
              Son 30 Gün
            </button>
          </div>
        </div>

        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-24">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-xs text-slate-500">Raporlar hesaplanıyor...</p>
          </div>
        } 
        
        @else if (summary()) {
          
          <!-- Key Metrics Grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            
            <!-- Revenue -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {{ activeRange === 'today' ? 'Bugünkü Ciro' : 'Dönem Cirosu' }}
              </span>
              <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {{ (activeRange === 'today' ? summary()!.todayRevenue : summary()!.rangeRevenue) | number:'1.2-2' }} ₺
              </div>
              <span class="text-[10px] text-slate-400 block mt-1">İptaller hariç net</span>
            </div>

            <!-- Active Orders -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Aktif Sipariş
                </span>
                @if (summary()!.activeOrdersCount > 0) {
                  <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                }
              </div>
              <div class="text-2xl font-black text-amber-600 dark:text-amber-400">
                {{ summary()!.activeOrdersCount }}
              </div>
              <span class="text-[10px] text-slate-400 block mt-1">Hazırlık / Serviste</span>
            </div>

            <!-- Orders Count -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {{ activeRange === 'today' ? 'Bugünkü Sipariş' : 'Toplam Sipariş' }}
              </span>
              <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {{ activeRange === 'today' ? summary()!.todayOrdersCount : summary()!.rangeOrdersCount }}
              </div>
              <span class="text-[10px] text-slate-400 block mt-1">Toplam iletilen</span>
            </div>

            <!-- Completed -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Tamamlanan
              </span>
              <div class="text-2xl font-black text-slate-900 dark:text-white">
                {{ summary()!.completedOrdersCount }}
              </div>
              <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">Teslim edildi</span>
            </div>

            <!-- Avg Order Value -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Ort. Sepet Tutarı
              </span>
              <div class="text-2xl font-black text-slate-900 dark:text-white">
                {{ summary()!.averageOrderValue | number:'1.2-2' }} ₺
              </div>
              <span class="text-[10px] text-slate-400 block mt-1">Sipariş başına</span>
            </div>

            <!-- Customers -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Sadık Müşteriler
              </span>
              <div class="text-2xl font-black text-slate-900 dark:text-white">
                {{ summary()!.totalCustomersCount }}
              </div>
              <span class="text-[10px] text-slate-400 block mt-1">Kayıtlı aktif müşteri</span>
            </div>

          </div>

          <!-- Middle Section: Top Selling Items & Category Distribution -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            <!-- Top Selling Items -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h2 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>🏆 En Çok Sipariş Edilen Lezzetler</span>
                <span class="text-xs font-normal text-slate-400">Adet ve Ciro Katkısı</span>
              </h2>

              @if (summary()!.topSellingItems.length === 0) {
                <div class="text-center py-12 text-slate-400 text-xs">
                  Bu dönemde henüz tamamlanmış sipariş bulunmuyor.
                </div>
              } @else {
                <div class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (item of summary()!.topSellingItems; track item.menuItemId; let i = $index) {
                    <div class="py-3 flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                          #{{ i + 1 }}
                        </div>
                        <div>
                          <h4 class="font-bold text-xs text-slate-900 dark:text-white">{{ item.name }}</h4>
                          <span class="text-[11px] text-slate-400">{{ item.quantitySold }} adet satıldı</span>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="font-black text-xs text-emerald-600 dark:text-emerald-400">{{ item.totalRevenue | number:'1.2-2' }} ₺</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Category Sales Distribution -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h2 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>🍰 Kategori Bazında Satış Payı</span>
                <span class="text-xs font-normal text-slate-400">Yüzdelik Ciro Dağılımı</span>
              </h2>

              @if (summary()!.categorySales.length === 0) {
                <div class="text-center py-12 text-slate-400 text-xs">
                  Kategori satış verisi bulunmuyor.
                </div>
              } @else {
                <div class="space-y-4">
                  @for (cat of summary()!.categorySales; track cat.categoryName) {
                    <div>
                      <div class="flex justify-between items-center text-xs font-bold mb-1">
                        <span class="text-slate-800 dark:text-slate-200">{{ cat.categoryName }} ({{ cat.itemsSold }} adet)</span>
                        <span class="text-slate-900 dark:text-white">{{ cat.revenue | number:'1.2-2' }} ₺ (%{{ cat.percentage }})</span>
                      </div>
                      <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full transition-all duration-500"
                             [style.width.%]="cat.percentage"></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          <!-- Bottom: Daily Trend Visualizer -->
          @if (summary()!.dailySales.length > 0) {
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-8">
              <h2 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>📅 Günlük Satış Eğilimi</span>
                <span class="text-xs font-normal text-slate-400">Günlük Tamamlanan Ciro</span>
              </h2>

              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                @for (day of summary()!.dailySales; track day.date) {
                  <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span class="text-[10px] font-bold text-slate-400 block mb-1">{{ day.date | date:'dd MMM' }}</span>
                    <span class="text-xs font-black text-slate-900 dark:text-white block">{{ day.revenue | number:'1.0-0' }} ₺</span>
                    <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">{{ day.ordersCount }} sipariş</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Quick Navigation Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <a routerLink="/admin/orders" class="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 hover:shadow-md transition-all group">
              <div class="text-2xl mb-2 group-hover:scale-110 transition-transform">🔔</div>
              <h3 class="font-bold text-sm text-indigo-950 dark:text-indigo-200">Canlı Sipariş Panosu</h3>
              <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Anlık sipariş durumlarını takip edin ve güncelleyin</p>
            </a>

            <a routerLink="/admin/menu" class="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 hover:shadow-md transition-all group">
              <div class="text-2xl mb-2 group-hover:scale-110 transition-transform">🍽️</div>
              <h3 class="font-bold text-sm text-amber-950 dark:text-amber-200">Menü ve Fiyat Masası</h3>
              <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">Ürün ve kategori ekleyin, fiyatları anında güncelleyin</p>
            </a>

            <a routerLink="/admin/customers" class="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 hover:shadow-md transition-all group">
              <div class="text-2xl mb-2 group-hover:scale-110 transition-transform">👥</div>
              <h3 class="font-bold text-sm text-emerald-950 dark:text-emerald-200">Müşteri Yönetimi</h3>
              <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Sadakat müşterilerini listeleyin, ekleyin ve yönetin</p>
            </a>

            <a routerLink="/admin/settings" class="p-5 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 hover:shadow-md transition-all group">
              <div class="text-2xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
              <h3 class="font-bold text-sm text-purple-950 dark:text-purple-200">İşletme Ayarları</h3>
              <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">Restoran iletişim, çalışma saatleri ve sipariş kabulü</p>
            </a>
          </div>

        }

      </main>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  activeRange: 'today' | '7days' | 'month' = 'month';

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    public themeService: ThemeService,
    private toastService: ToastService,
    private signalRService: SignalRService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signalRService.connect();
    this.fetchData();
  }

  setRange(range: 'today' | '7days' | 'month'): void {
    this.activeRange = range;
    this.fetchData();
  }

  fetchData(): void {
    this.loading.set(true);

    let fromDate: string | undefined;
    const now = new Date();

    if (this.activeRange === 'today') {
      fromDate = now.toISOString().split('T')[0];
    } else if (this.activeRange === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString().split('T')[0];
    } else {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      fromDate = d.toISOString().split('T')[0];
    }

    this.reportService.getDashboardSummary(fromDate).subscribe({
      next: s => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Rapor Yüklenemedi', 'Sunucu ile iletişim kurulurken bir hata oluştu.');
      }
    });
  }

  logout(): void {
    this.signalRService.disconnect();
    this.authService.logout();
    this.toastService.info('Oturum Kapatıldı');
    this.router.navigate(['/']);
  }
}
