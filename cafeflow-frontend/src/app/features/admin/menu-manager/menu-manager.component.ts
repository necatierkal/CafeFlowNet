import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../../core/services/menu.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { MenuCategory, MenuItem } from '../../../core/models';

@Component({
  selector: 'app-menu-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      <!-- Top Navigation Header -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          
          <div class="flex items-center gap-3">
            <a routerLink="/admin" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              ←
            </a>
            <div>
              <span class="text-lg font-black text-slate-900 dark:text-white leading-none block">Menü & Fiyat Masası</span>
              <span class="text-xs text-slate-400">Ürün, kategori ve anlık fiyat yönetimi</span>
            </div>
          </div>

          <!-- Admin Nav Menu -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <a routerLink="/admin" class="px-3 py-1 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              📈 Genel Bakış
            </a>
            <a routerLink="/admin/orders" class="px-3 py-1 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              🔔 Canlı Siparişler
            </a>
            <a routerLink="/admin/menu" class="px-3 py-1 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">
              🍽️ Menü & Fiyatlar
            </a>
            <a routerLink="/admin/customers" class="px-3 py-1 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              👥 Müşteriler
            </a>
            <a routerLink="/admin/settings" class="px-3 py-1 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              ⚙️ Ayarlar
            </a>
          </nav>

          <div class="flex items-center gap-2">
            <button (click)="openAddCategoryModal()" class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors">
              + Yeni Kategori
            </button>
            <button (click)="openAddItemModal()" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors">
              + Yeni Ürün Ekle
            </button>
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        <!-- Search bar -->
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div class="text-xs text-slate-500">
            💡 Fiyat kutucuğuna yeni tutar yazıp <strong>Enter</strong>'a bastığınızda fiyat anında genel menüde güncellenir.
          </div>

          <div class="relative w-full sm:w-72 shrink-0">
            <span class="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text"
                   [(ngModel)]="searchQuery"
                   placeholder="Ürün adı ara..."
                   class="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-24">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-xs text-slate-500">Menü yükleniyor...</p>
          </div>
        } 
        
        @else {
          <div class="space-y-8">
            @for (category of filteredCategories(); track category.id) {
              <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                
                <!-- Category Header -->
                <div class="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div class="flex items-center gap-3">
                    <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ category.name }}</h2>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {{ category.items.length }} ürün
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button (click)="openEditCategoryModal(category)" class="text-xs text-slate-400 hover:text-indigo-600 font-semibold p-1">
                      ✏️ Düzenle
                    </button>
                    <button (click)="deleteCategory(category)" class="text-xs text-slate-400 hover:text-rose-600 font-semibold p-1">
                      🗑️ Sil
                    </button>
                  </div>
                </div>

                <!-- Items Table -->
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th class="py-2.5 px-3 font-bold">Ürün</th>
                        <th class="py-2.5 px-3 font-bold">Fiyat (₺)</th>
                        <th class="py-2.5 px-3 font-bold text-center">Satışta</th>
                        <th class="py-2.5 px-3 font-bold text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                      @for (item of category.items; track item.id) {
                        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors" [class.opacity-50]="!item.isAvailable">
                          
                          <!-- Name & Description -->
                          <td class="py-3 px-3">
                            <div class="flex items-center gap-3">
                              @if (item.imageUrl) {
                                <img [src]="item.imageUrl" [alt]="item.name" class="w-10 h-10 rounded-xl object-cover shrink-0" />
                              } @else {
                                <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">☕</div>
                              }
                              <div>
                                <strong class="text-slate-900 dark:text-white block">{{ item.name }}</strong>
                                @if (item.description) {
                                  <span class="text-slate-400 text-[11px] line-clamp-1">{{ item.description }}</span>
                                }
                              </div>
                            </div>
                          </td>

                          <!-- Price Quick Edit -->
                          <td class="py-3 px-3">
                            <div class="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                              <input type="number" 
                                     step="0.5" 
                                     min="0"
                                     [value]="item.price"
                                     (change)="updatePrice(item, $event)"
                                     class="w-20 bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none" />
                              <span class="text-slate-400 font-bold">₺</span>
                            </div>
                          </td>

                          <!-- Availability Toggle -->
                          <td class="py-3 px-3 text-center">
                            <button (click)="toggleAvailability(item)" 
                                    class="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                                    [ngClass]="item.isAvailable ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'">
                              {{ item.isAvailable ? 'Satışta' : 'Tükendi' }}
                            </button>
                          </td>

                          <!-- Actions -->
                          <td class="py-3 px-3 text-right">
                            <div class="flex items-center justify-end gap-2">
                              <button (click)="openEditItemModal(item)" class="p-1 text-slate-400 hover:text-indigo-600 font-bold">
                                ✏️
                              </button>
                              <button (click)="deleteItem(item)" class="p-1 text-slate-400 hover:text-rose-600 font-bold">
                                🗑️
                              </button>
                            </div>
                          </td>

                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

              </div>
            }
          </div>
        }

      </main>

      <!-- Category Modal -->
      @if (showCategoryModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div (click)="$event.stopPropagation()" class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-lg font-black text-slate-900 dark:text-white mb-4">
              {{ editingCategoryId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle' }}
            </h3>

            <div class="space-y-3 mb-5">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Adı</label>
                <input type="text" [(ngModel)]="categoryName" placeholder="Örn: Tatlılar, Sıcak Kahveler"
                       class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sıralama Sırası</label>
                <input type="number" [(ngModel)]="categoryOrder"
                       class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div class="flex gap-2">
              <button (click)="showCategoryModal.set(false)" class="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">Vazgeç</button>
              <button (click)="saveCategory()" [disabled]="!categoryName.trim()" class="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50">Kaydet</button>
            </div>
          </div>
        </div>
      }

      <!-- Item Modal -->
      @if (showItemModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div (click)="$event.stopPropagation()" class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 class="text-lg font-black text-slate-900 dark:text-white mb-4">
              {{ editingItemId ? 'Ürün Düzenle' : 'Yeni Menü Ürünü Ekle' }}
            </h3>

            <div class="space-y-3 mb-6">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                <select [(ngModel)]="itemForm.categoryId" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none">
                  @for (c of categories(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ürün Adı</label>
                <input type="text" [(ngModel)]="itemForm.name" placeholder="Örn: San Sebastian Cheesecake"
                       class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fiyat (₺)</label>
                <input type="number" step="0.5" [(ngModel)]="itemForm.price" placeholder="0.00"
                       class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Açıklama</label>
                <textarea [(ngModel)]="itemForm.description" rows="2" placeholder="Ürün içeriği, malzemeler..."
                          class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Görsel URL (İsteğe bağlı)</label>
                <input type="url" [(ngModel)]="itemForm.imageUrl" placeholder="https://..."
                       class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input type="checkbox" id="itemAvailable" [(ngModel)]="itemForm.isAvailable" class="rounded text-indigo-600" />
                <label for="itemAvailable" class="text-xs font-bold cursor-pointer">Satışta Açık (Müşteriler sipariş verebilir)</label>
              </div>
            </div>

            <div class="flex gap-2">
              <button (click)="showItemModal.set(false)" class="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">Vazgeç</button>
              <button (click)="saveItem()" [disabled]="!itemForm.name.trim() || itemForm.price <= 0" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50">Kaydet</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class MenuManagerComponent implements OnInit {
  readonly categories = signal<MenuCategory[]>([]);
  readonly loading = signal(true);
  readonly showCategoryModal = signal(false);
  readonly showItemModal = signal(false);

  editingCategoryId: number | null = null;
  categoryName = '';
  categoryOrder = 1;

  editingItemId: number | null = null;
  itemForm = {
    categoryId: 0,
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    isAvailable: true
  };

  searchQuery = '';

  filteredCategories = computed(() => {
    const cats = this.categories();
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return cats;

    return cats.map(c => ({
      ...c,
      items: c.items.filter(i => i.name.toLowerCase().includes(query) || (i.description && i.description.toLowerCase().includes(query)))
    })).filter(c => c.items.length > 0);
  });

  constructor(
    private menuService: MenuService,
    private toastService: ToastService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.loading.set(true);
    this.menuService.getMenuForAdmin().subscribe({
      next: cats => {
        this.categories.set(cats);
        this.loading.set(false);
        if (cats.length && !this.itemForm.categoryId) {
          this.itemForm.categoryId = cats[0].id;
        }
      },
      error: () => this.loading.set(false)
    });
  }

  updatePrice(item: MenuItem, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (isNaN(val) || val <= 0) return;

    this.menuService.updateItem(item.id, { price: val }).subscribe({
      next: updated => {
        item.price = updated.price;
        this.toastService.success('Fiyat Güncellendi', `${item.name}: ${item.price} ₺`);
      },
      error: err => {
        this.toastService.error('Hata', err.error?.message || 'Fiyat güncellenemedi.');
      }
    });
  }

  toggleAvailability(item: MenuItem): void {
    this.menuService.toggleAvailability(item).subscribe({
      next: updated => {
        item.isAvailable = updated.isAvailable;
        this.toastService.info('Durum Güncellendi', `${item.name} durumu: ${item.isAvailable ? 'Satışta' : 'Tükendi'}`);
      },
      error: err => this.toastService.error('Hata', err.error?.message || 'Durum değiştirilemedi.')
    });
  }

  deleteItem(item: MenuItem): void {
    if (!confirm(`"${item.name}" ürününü menüden kaldırmak istediğinize emin misiniz? (Geçmiş siparişlerdeki verisi korunacaktır)`)) return;

    this.menuService.deleteItem(item.id).subscribe({
      next: () => {
        this.toastService.success('Ürün Kaldırıldı', `${item.name} menüden kaldırıldı.`);
        this.loadMenu();
      },
      error: () => this.toastService.error('Hata', 'Ürün silinemedi.')
    });
  }

  openAddCategoryModal(): void {
    this.editingCategoryId = null;
    this.categoryName = '';
    this.categoryOrder = this.categories().length + 1;
    this.showCategoryModal.set(true);
  }

  openEditCategoryModal(cat: MenuCategory): void {
    this.editingCategoryId = cat.id;
    this.categoryName = cat.name;
    this.categoryOrder = cat.displayOrder;
    this.showCategoryModal.set(true);
  }

  saveCategory(): void {
    if (!this.categoryName.trim()) return;

    if (this.editingCategoryId) {
      this.menuService.updateCategory(this.editingCategoryId, {
        name: this.categoryName.trim(),
        displayOrder: this.categoryOrder
      }).subscribe({
        next: () => {
          this.toastService.success('Kategori Güncellendi');
          this.showCategoryModal.set(false);
          this.loadMenu();
        },
        error: () => this.toastService.error('Hata', 'Kategori güncellenemedi.')
      });
    } else {
      this.menuService.createCategory({
        name: this.categoryName.trim(),
        displayOrder: this.categoryOrder
      }).subscribe({
        next: () => {
          this.toastService.success('Kategori Eklendi');
          this.showCategoryModal.set(false);
          this.loadMenu();
        },
        error: () => this.toastService.error('Hata', 'Kategori eklenemedi.')
      });
    }
  }

  deleteCategory(cat: MenuCategory): void {
    if (!confirm(`"${cat.name}" kategorisini ve altındaki tüm ürünleri kaldırmak istediğinize emin misiniz?`)) return;

    this.menuService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.toastService.success('Kategori Kaldırıldı');
        this.loadMenu();
      },
      error: () => this.toastService.error('Hata', 'Kategori silinemedi.')
    });
  }

  openAddItemModal(): void {
    this.editingItemId = null;
    const cats = this.categories();
    this.itemForm = {
      categoryId: cats.length > 0 ? cats[0].id : 0,
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      isAvailable: true
    };
    this.showItemModal.set(true);
  }

  openEditItemModal(item: MenuItem): void {
    this.editingItemId = item.id;
    this.itemForm = {
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable
    };
    this.showItemModal.set(true);
  }

  saveItem(): void {
    if (!this.itemForm.name.trim() || this.itemForm.price <= 0) return;

    if (this.editingItemId) {
      this.menuService.updateItem(this.editingItemId, {
        categoryId: this.itemForm.categoryId,
        name: this.itemForm.name.trim(),
        description: this.itemForm.description.trim() || undefined,
        price: this.itemForm.price,
        imageUrl: this.itemForm.imageUrl.trim() || undefined,
        isAvailable: this.itemForm.isAvailable
      }).subscribe({
        next: () => {
          this.toastService.success('Ürün Güncellendi');
          this.showItemModal.set(false);
          this.loadMenu();
        },
        error: err => this.toastService.error('Hata', err.error?.message || 'Ürün kaydedilemedi.')
      });
    } else {
      this.menuService.createItem({
        categoryId: this.itemForm.categoryId,
        name: this.itemForm.name.trim(),
        description: this.itemForm.description.trim() || undefined,
        price: this.itemForm.price,
        imageUrl: this.itemForm.imageUrl.trim() || undefined,
        isAvailable: this.itemForm.isAvailable,
        displayOrder: 0
      }).subscribe({
        next: () => {
          this.toastService.success('Ürün Eklendi');
          this.showItemModal.set(false);
          this.loadMenu();
        },
        error: err => this.toastService.error('Hata', err.error?.message || 'Ürün eklenemedi.')
      });
    }
  }
}
