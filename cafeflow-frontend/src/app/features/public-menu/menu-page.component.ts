import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { SettingService } from '../../core/services/setting.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { MenuCategory, MenuItem, RestaurantSetting } from '../../core/models';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 pb-24">
      
      <!-- Sticky Navigation Bar -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20">
              ☕
            </div>
            <div>
              <span class="text-xl font-black tracking-tight text-slate-900 dark:text-white block leading-none">
                {{ settings()?.restaurantName || 'CafeFlow' }}
              </span>
              <span class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {{ settings()?.isAcceptingOrders ? 'Siparişler Açık' : 'Şu an kapalı' }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2.5 sm:gap-4">
            
            <!-- Dark / Light Mode Toggle -->
            <button (click)="themeService.toggleTheme()" 
                    class="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    [title]="themeService.isDark() ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'">
              @if (themeService.isDark()) { ☀️ } @else { 🌙 }
            </button>

            <!-- Cart button if has items -->
            @if (cartService.itemCount() > 0) {
              <a [routerLink]="authService.isLoggedIn() ? (authService.isAdmin() ? '/admin' : '/my/cart') : '/login'"
                 class="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-sm hover:bg-amber-500/20 transition-all border border-amber-300 dark:border-amber-700">
                <span>🛒</span>
                <span class="hidden sm:inline">Sepet</span>
                <span class="w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                  {{ cartService.itemCount() }}
                </span>
                <span class="font-bold text-xs">{{ cartService.total() | number:'1.2-2' }} ₺</span>
              </a>
            }

            <!-- Auth Status -->
            @if (authService.isLoggedIn()) {
              <a [routerLink]="authService.isAdmin() ? '/admin' : '/my'" 
                 class="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 sm:px-5 py-2 rounded-full font-semibold transition-all shadow-md shadow-indigo-600/20 text-xs sm:text-sm flex items-center gap-1.5">
                <span>{{ authService.isAdmin() ? 'Yönetici Paneli' : 'Siparişlerim' }}</span>
                <span>→</span>
              </a>
            } @else {
              <a routerLink="/login" 
                 class="text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors text-xs sm:text-sm px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                Giriş Yap / Kayıt Ol
              </a>
            }
          </div>
        </div>
      </header>

      <!-- Hero Header Section -->
      <section class="relative overflow-hidden bg-gradient-to-b from-amber-50/50 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 pt-10 pb-12 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold mb-4">
              <span>✨</span>
              <span>Gurme Restoran & Nitelikli Kahve Deneyimi</span>
            </div>
            
            <h1 class="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              En Taze Lezzetleri Keşfedin & Anında Sipariş Verin.
            </h1>
            
            <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {{ settings()?.description || 'Özenle seçilmiş malzemeler, usta şeflerimizin elinden gurme yemekler ve taze kavrulmuş kahveler.' }}
            </p>

            <!-- Restaurant Info Badges -->
            <div class="flex flex-wrap gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              @if (settings()?.address) {
                <div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span>📍</span>
                  <span>{{ settings()?.address }}</span>
                </div>
              }
              @if (settings()?.phoneNumber) {
                <div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span>📞</span>
                  <span>{{ settings()?.phoneNumber }}</span>
                </div>
              }
              @if (settings()?.openingHours) {
                <div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span>🕒</span>
                  <span>{{ settings()?.openingHours }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Main Menu Section -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        <!-- Search and Filter Bar -->
        <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          
          <!-- Category Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button (click)="selectCategory(null)"
                    [ngClass]="selectedCategoryId() === null 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
                    class="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all">
              Tüm Ürünler
            </button>
            @for (cat of categories(); track cat.id) {
              <button (click)="selectCategory(cat.id)"
                      [ngClass]="selectedCategoryId() === cat.id 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'"
                      class="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all">
                {{ cat.name }} ({{ cat.items.length }})
              </button>
            }
          </div>

          <!-- Search input -->
          <div class="relative w-full md:w-72 shrink-0">
            <span class="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
            <input type="text"
                   [(ngModel)]="searchQuery"
                   placeholder="Menüde lezzet ara..."
                   class="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all shadow-sm" />
            @if (searchQuery) {
              <button (click)="searchQuery = ''" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs">✕</button>
            }
          </div>
        </div>

        <!-- Menu Grid Container -->
        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
              <div class="bg-white dark:bg-slate-800/80 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse">
                <div class="w-full h-44 rounded-2xl bg-slate-200 dark:bg-slate-700 mb-4"></div>
                <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-4"></div>
                <div class="flex justify-between items-center pt-2">
                  <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                  <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
              </div>
            }
          </div>
        } @else if (filteredItems().length === 0) {
          <div class="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
            <span class="text-6xl mb-4 block">🔍</span>
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Ürün Bulunamadı</h3>
            <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
              Arama kriterlerinize uygun lezzet bulunamadı. Lütfen arama terimini değiştirin veya kategori filtresini temizleyin.
            </p>
            @if (searchQuery || selectedCategoryId() !== null) {
              <button (click)="resetFilters()" class="mt-4 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-100 transition-colors">
                Filtreleri Temizle
              </button>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            @for (item of filteredItems(); track item.id) {
              <div (click)="openDetail(item)"
                   class="bg-white dark:bg-slate-900 rounded-3xl p-3.5 shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all duration-300 group flex flex-col h-full cursor-pointer relative top-0 hover:-top-1.5">
                
                <!-- Product Image Container -->
                <div class="relative w-full h-48 rounded-2xl overflow-hidden mb-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/60">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" 
                         [alt]="item.name" 
                         (error)="onImageError($event)"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                  } @else {
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <span class="text-4xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
                    </div>
                  }

                  <!-- Availability Badge -->
                  @if (!item.isAvailable) {
                    <div class="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      Tükendi / Satışta Değil
                    </div>
                  }
                </div>
                
                <!-- Content -->
                <div class="px-2 pb-1 flex flex-col flex-grow">
                  <div class="flex justify-between items-start gap-2 mb-1.5">
                    <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {{ item.name }}
                    </h3>
                  </div>
                  
                  @if (item.description) {
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                      {{ item.description }}
                    </p>
                  }
                  
                  <!-- Bottom Row: Price & Add to Cart -->
                  <div class="mt-auto flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span class="text-lg font-black text-slate-900 dark:text-white">{{ item.price | number:'1.2-2' }}</span>
                      <span class="text-xs text-slate-400 dark:text-slate-500 font-medium ml-0.5">₺</span>
                    </div>
                    
                    <button (click)="handleAddToCart($event, item)" 
                            [disabled]="!item.isAvailable"
                            [title]="!item.isAvailable ? 'Satışta Değil' : 'Sepete Ekle'"
                            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                            [ngClass]="item.isAvailable 
                              ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-amber-500/20' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'">
                      <span>+</span>
                      <span>Ekle</span>
                    </button>
                  </div>
                </div>

              </div>
            }
          </div>
        }

      </main>

      <!-- Product Detail Modal -->
      @if (selectedItem()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div (click)="$event.stopPropagation()"
               class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
            
            <div class="relative h-64 bg-slate-100 dark:bg-slate-800">
              @if (selectedItem()!.imageUrl) {
                <img [src]="selectedItem()!.imageUrl" [alt]="selectedItem()!.name" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
              }
              <button (click)="closeDetail()" 
                      class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-900 transition-colors">
                ✕
              </button>
            </div>

            <div class="p-6">
              <div class="flex justify-between items-start gap-4 mb-2">
                <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ selectedItem()!.name }}</h3>
                <div class="text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0">
                  {{ selectedItem()!.price | number:'1.2-2' }} ₺
                </div>
              </div>

              <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {{ selectedItem()!.description || 'Özel malzemelerle hazırlanmış enfes lezzet.' }}
              </p>

              <!-- Modal Footer / Add to Cart -->
              <div class="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-2xl p-1 bg-slate-50 dark:bg-slate-800">
                  <button (click)="decreaseModalQty()" class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 font-bold">-</button>
                  <span class="w-10 text-center font-bold text-sm">{{ modalQuantity }}</span>
                  <button (click)="increaseModalQty()" class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 font-bold">+</button>
                </div>

                <button (click)="addModalItemToCart()"
                        [disabled]="!selectedItem()!.isAvailable"
                        class="flex-grow py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                  <span>🛒 Sepete Ekle</span>
                  <span>•</span>
                  <span>{{ (selectedItem()!.price * modalQuantity) | number:'1.2-2' }} ₺</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- Bottom Floating Mobile Cart Bar -->
      @if (cartService.itemCount() > 0) {
        <div class="fixed bottom-4 left-4 right-4 sm:hidden z-40">
          <a [routerLink]="authService.isLoggedIn() ? '/my/cart' : '/login'"
             class="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 font-bold text-sm">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-white text-indigo-600 text-xs flex items-center justify-center font-black">
                {{ cartService.itemCount() }}
              </span>
              <span>Sepeti İncele</span>
            </div>
            <span>{{ cartService.total() | number:'1.2-2' }} ₺ →</span>
          </a>
        </div>
      }

    </div>
  `
})
export class MenuPageComponent implements OnInit {
  categories = signal<MenuCategory[]>([]);
  settings = signal<RestaurantSetting | null>(null);
  loading = signal(true);
  selectedCategoryId = signal<number | null>(null);
  selectedItem = signal<MenuItem | null>(null);
  searchQuery = '';
  modalQuantity = 1;

  filteredItems = computed(() => {
    const cats = this.categories();
    const catId = this.selectedCategoryId();
    const query = this.searchQuery.trim().toLowerCase();

    let items: MenuItem[] = [];
    if (catId === null) {
      items = cats.flatMap(c => c.items);
    } else {
      const match = cats.find(c => c.id === catId);
      items = match ? match.items : [];
    }

    if (!query) return items;

    return items.filter(i => 
      i.name.toLowerCase().includes(query) || 
      (i.description && i.description.toLowerCase().includes(query))
    );
  });

  constructor(
    private menuService: MenuService,
    private settingService: SettingService,
    public authService: AuthService,
    public cartService: CartService,
    public themeService: ThemeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.settingService.getSettings().subscribe({
      next: s => this.settings.set(s),
      error: () => {}
    });

    this.menuService.getMenu().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Menü Yüklenemedi', 'Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.');
      }
    });
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategoryId.set(null);
  }

  openDetail(item: MenuItem): void {
    this.modalQuantity = 1;
    this.selectedItem.set(item);
  }

  closeDetail(): void {
    this.selectedItem.set(null);
  }

  increaseModalQty(): void {
    if (this.modalQuantity < 50) this.modalQuantity++;
  }

  decreaseModalQty(): void {
    if (this.modalQuantity > 1) this.modalQuantity--;
  }

  addModalItemToCart(): void {
    const item = this.selectedItem();
    if (!item || !item.isAvailable) return;

    this.cartService.addItem(item, this.modalQuantity);
    this.toastService.success('Sepete Eklendi', `${this.modalQuantity}x ${item.name} sepete eklendi.`);
    this.closeDetail();
  }

  handleAddToCart(event: Event, item: MenuItem): void {
    event.stopPropagation();
    if (!item.isAvailable) return;

    this.cartService.addItem(item, 1);
    this.toastService.success('Sepete Eklendi', `${item.name} sepetinize eklendi.`);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.style.display = 'none';
  }
}
