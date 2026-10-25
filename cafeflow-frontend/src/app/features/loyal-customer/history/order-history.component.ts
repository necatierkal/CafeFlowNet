import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { MenuService } from '../../../core/services/menu.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      <!-- Top Navigation -->
      <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a routerLink="/my" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              ←
            </a>
            <h1 class="text-xl font-black text-slate-900 dark:text-white">Sipariş Geçmişim</h1>
          </div>
          <a routerLink="/my" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            + Yeni Sipariş Ver
          </a>
        </div>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-24">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-sm text-slate-500">Siparişleriniz yükleniyor...</p>
          </div>
        } 
        
        @else if (orders().length === 0) {
          <div class="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span class="text-6xl mb-4 block">📜</span>
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Henüz Siparişiniz Yok</h3>
            <p class="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm mb-6">
              Geçmişte vermiş olduğunuz siparişleriniz burada listelenecektir.
            </p>
            <a routerLink="/my" class="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition-all">
              Menüyü Keşfet →
            </a>
          </div>
        } 
        
        @else {
          <div class="space-y-4">
            @for (order of orders(); track order.id) {
              <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
                
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0"
                         [ngClass]="getStatusBgClass(order.status)">
                      {{ getStatusIcon(order.status) }}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-black text-sm text-slate-900 dark:text-white">#{{ order.id.substring(0, 8) }}</span>
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" [ngClass]="getStatusBadgeClass(order.status)">
                          {{ getStatusLabel(order.status) }}
                        </span>
                      </div>
                      <span class="text-xs text-slate-400 block mt-0.5">{{ order.createdAt | date:'dd MMMM yyyy, HH:mm' }}</span>
                    </div>
                  </div>

                  <div class="text-left sm:text-right">
                    <span class="text-xs text-slate-400 block">Sipariş Tutarı</span>
                    <span class="text-lg font-black text-slate-900 dark:text-white">{{ order.totalAmount | number:'1.2-2' }} ₺</span>
                  </div>
                </div>

                <!-- Items preview -->
                <div class="py-3">
                  <div class="flex flex-wrap gap-2">
                    @for (item of order.items; track item.menuItemId) {
                      <span class="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        {{ item.quantity }}× {{ item.itemName }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Footer buttons -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                  <a [routerLink]="['/my/orders', order.id]" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Canlı Takip & Detaylar →
                  </a>

                  <button (click)="reorder(order)" 
                          class="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold text-xs transition-colors flex items-center gap-1.5">
                    <span>🔁</span>
                    <span>Tekrar Sipariş Ver</span>
                  </button>
                </div>

              </div>
            }
          </div>
        }

      </div>

    </div>
  `
})
export class OrderHistoryComponent implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private menuService: MenuService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  reorder(order: Order): void {
    this.menuService.getMenu().subscribe(categories => {
      const allItems = categories.flatMap(c => c.items);
      this.cartService.clear();

      let addedCount = 0;
      for (const line of order.items) {
        const currentItem = allItems.find(i => i.id === line.menuItemId);
        if (currentItem && currentItem.isAvailable) {
          this.cartService.addItem(currentItem, line.quantity);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        this.toastService.success('Sepete Aktarıldı', 'Ürünler güncel menü fiyatlarıyla sepetinize aktarıldı.');
        this.router.navigate(['/my/cart']);
      } else {
        this.toastService.warning('Ürünler Satışta Değil', 'Önceki siparişteki ürünler şu an menüde bulunmuyor.');
      }
    });
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Received: return 'Alındı';
      case OrderStatus.Preparing: return 'Hazırlanıyor';
      case OrderStatus.Ready: return 'Hazır';
      case OrderStatus.Completed: return 'Tamamlandı';
      case OrderStatus.Cancelled: return 'İptal';
      default: return status;
    }
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Received: return '📥';
      case OrderStatus.Preparing: return '🍳';
      case OrderStatus.Ready: return '🔔';
      case OrderStatus.Completed: return '🎉';
      case OrderStatus.Cancelled: return '🚫';
      default: return '📦';
    }
  }

  getStatusBgClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Received: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case OrderStatus.Preparing: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
      case OrderStatus.Ready: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case OrderStatus.Completed: return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
      case OrderStatus.Cancelled: return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Received: return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case OrderStatus.Preparing: return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
      case OrderStatus.Ready: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case OrderStatus.Completed: return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      case OrderStatus.Cancelled: return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  }
}
