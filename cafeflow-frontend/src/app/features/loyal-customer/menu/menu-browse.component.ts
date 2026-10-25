import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../../core/services/menu.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { MenuCategory, MenuItem } from '../../../core/models';

@Component({
  selector: 'app-menu-browse',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      <!-- Top Navigation Header -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
              ☕
            </div>
            <div>
              <span class="text-xl font-black text-slate-900 dark:text-white leading-none block">CafeFlow</span>
              <span class="text-xs text-slate-500 dark:text-slate-400">Müşteri Portalı</span>
            </div>
          </div>

          <!-- Nav Links -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <a routerLink="/my" class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">
              🍽️ Menü
            </a>
            <a routerLink="/my/history" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              📜 Siparişlerim
            </a>
            <a routerLink="/my/profile" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              👤 Profilim
            </a>
          </nav>

          <!-- Right side actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <button (click)="themeService.toggleTheme()" 
                    class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              @if (themeService.isDark()) { ☀️ } @else { 🌙 }
            </button>

            <!-- Cart button -->
            <a routerLink="/my/cart" 
               class="flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all">
              <span>🛒</span>
              <span class="hidden sm:inline">Sepet</span>
              <span class="w-5 h-5 rounded-full bg-white text-amber-700 text-xs flex items-center justify-center font-black">
                {{ cartService.itemCount() }}
              </span>
              <span class="font-bold">{{ cartService.total() | number:'1.2-2' }} ₺</span>
            </a>

            <!-- Logout -->
            <button (click)="logout()" 
                    title="Çıkış Yap"
                    class="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
              🚪
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        <!-- Filter and Search Header -->
        <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button (click)="selectCategory(null)"
                    [ngClass]="selectedCategoryId() === null 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'"
                    class="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all">
              Tümü
            </button>
            @for (cat of categories(); track cat.id) {
              <button (click)="selectCategory(cat.id)"
                      [ngClass]="selectedCategoryId() === cat.id 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'"
                      class="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all">
                {{ cat.name }} ({{ cat.items.length }})
              </button>
            }
          </div>

          <div class="relative w-full md:w-72 shrink-0">
            <span class="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text"
                   [(ngModel)]="searchQuery"
                   placeholder="Lezzet ara..."
                   class="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none" />
          </div>
        </div>

        <!-- Product Grid -->
        @if (filteredItems().length === 0) {
          <div class="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span class="text-5xl block mb-2">🍽️</span>
            <h3 class="font-bold text-base text-slate-800 dark:text-slate-200">Ürün Bulunamadı</h3>
            <p class="text-xs text-slate-400 mt-1">Arama veya kategori filtrenize uygun ürün yok.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            @for (item of filteredItems(); track item.id) {
              <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-lg flex flex-col h-full">
                
                <div class="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-4xl">☕</div>
                  }
                  @if (!item.isAvailable) {
                    <div class="absolute top-2 left-2 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Tükendi
                    </div>
                  }
                </div>

                <div class="flex-grow flex flex-col">
                  <h3 class="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">{{ item.name }}</h3>
                  @if (item.description) {
                    <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">{{ item.description }}</p>
                  }

                  <div class="mt-auto flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span class="text-base font-black text-slate-900 dark:text-white">{{ item.price | number:'1.2-2' }} ₺</span>
                    
                    <button (click)="addToCart(item)"
                            [disabled]="!item.isAvailable"
                            class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1">
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

    </div>
  `
})
export class MenuBrowseComponent implements OnInit {
  readonly categories = signal<MenuCategory[]>([]);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = '';

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
    return items.filter(i => i.name.toLowerCase().includes(query) || (i.description && i.description.toLowerCase().includes(query)));
  });

  constructor(
    private menuService: MenuService,
    public cartService: CartService,
    public authService: AuthService,
    public themeService: ThemeService,
    private toastService: ToastService,
    private signalRService: SignalRService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.menuService.getMenu().subscribe(categories => this.categories.set(categories));
    this.signalRService.connect();
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
  }

  addToCart(item: MenuItem): void {
    if (!item.isAvailable) return;
    this.cartService.addItem(item, 1);
    this.toastService.success('Sepete Eklendi', `${item.name} sepetinize eklendi.`);
  }

  logout(): void {
    this.signalRService.disconnect();
    this.authService.logout();
    this.toastService.info('Oturum Kapatıldı', 'Güvenli şekilde çıkış yapıldı.');
    this.router.navigate(['/']);
  }
}
