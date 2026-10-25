import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Order, OrderStatus } from '../../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-manager',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
              <span class="text-lg font-black text-slate-900 dark:text-white leading-none block">Canlı Sipariş Panosu</span>
              <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SignalR Gerçek Zamanlı Dinleniyor
              </span>
            </div>
          </div>

          <!-- Admin Nav Menu -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <a routerLink="/admin" class="px-3 py-1 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              📈 Genel Bakış
            </a>
            <a routerLink="/admin/orders" class="px-3 py-1 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">
              🔔 Canlı Siparişler
            </a>
            <a routerLink="/admin/menu" class="px-3 py-1 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
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
            <button (click)="refreshOrders()" 
                    class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors">
              🔄 Yenile
            </button>
            <button (click)="themeService.toggleTheme()" class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
              @if (themeService.isDark()) { ☀️ } @else { 🌙 }
            </button>
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        <!-- Controls: Search and Status Tabs -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          
          <!-- Filter Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            @for (tab of statusTabs; track tab.key) {
              <button (click)="selectedTab.set(tab.key)"
                      [ngClass]="selectedTab() === tab.key 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'"
                      class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5">
                <span>{{ tab.label }}</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] font-black"
                      [ngClass]="selectedTab() === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
                  {{ getCountByTab(tab.key) }}
                </span>
              </button>
            }
          </div>

          <!-- Search Input -->
          <div class="relative w-full md:w-72 shrink-0">
            <span class="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text"
                   [(ngModel)]="searchQuery"
                   placeholder="Müşteri adı veya sipariş no..."
                   class="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-24">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-xs text-slate-500">Siparişler yükleniyor...</p>
          </div>
        } 
        
        @else if (filteredOrders().length === 0) {
          <div class="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span class="text-5xl block mb-2">📋</span>
            <h3 class="font-bold text-base text-slate-800 dark:text-slate-200">Bu Görünümde Sipariş Yok</h3>
            <p class="text-xs text-slate-400 mt-1">Seçili durumda bekleyen sipariş bulunmuyor.</p>
          </div>
        } 
        
        @else {
          <!-- Order Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (order of filteredOrders(); track order.id) {
              <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all flex flex-col justify-between"
                   [ngClass]="{
                     'border-l-4 border-l-amber-500': order.status === 'Received',
                     'border-l-4 border-l-sky-500': order.status === 'Preparing',
                     'border-l-4 border-l-emerald-500': order.status === 'Ready',
                     'border-l-4 border-l-slate-400': order.status === 'Completed',
                     'border-l-4 border-l-rose-500': order.status === 'Cancelled'
                   }">
                
                <!-- Card Header -->
                <div>
                  <div class="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="font-bold text-sm text-slate-900 dark:text-white">{{ order.customerName || 'Müşteri' }}</h3>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="getStatusBadgeClass(order.status)">
                          {{ getStatusLabel(order.status) }}
                        </span>
                      </div>
                      <span class="text-[11px] text-slate-400">#{{ order.id.substring(0, 8) }} • {{ order.createdAt | date:'HH:mm' }}</span>
                    </div>

                    <div class="text-right">
                      <span class="font-black text-sm text-slate-900 dark:text-white">{{ order.totalAmount | number:'1.2-2' }} ₺</span>
                    </div>
                  </div>

                  <!-- Customer Phone & Notes -->
                  @if (order.customerPhone) {
                    <div class="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                      <span>📞</span> <span>{{ order.customerPhone }}</span>
                    </div>
                  }

                  @if (order.notes) {
                    <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs mb-3">
                      <strong>Not:</strong> {{ order.notes }}
                    </div>
                  }

                  <!-- Items list -->
                  <div class="py-2 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    @for (item of order.items; track item.menuItemId) {
                      <div class="py-1.5 flex justify-between items-center">
                        <span class="text-slate-700 dark:text-slate-300 font-medium">{{ item.quantity }}× {{ item.itemName }}</span>
                        <span class="text-slate-500">{{ item.lineTotal | number:'1.2-2' }} ₺</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Card Actions -->
                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button (click)="openDetail(order)" class="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                    Detaylar →
                  </button>

                  <div class="flex items-center gap-1.5">
                    <!-- Advance Button -->
                    @if (getNextStatus(order.status)) {
                      <button (click)="advance(order)"
                              class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1">
                        <span>{{ getNextActionLabel(order.status) }}</span>
                        <span>→</span>
                      </button>
                    }

                    <!-- Cancel button -->
                    @if (order.status !== 'Completed' && order.status !== 'Cancelled') {
                      <button (click)="openCancelModal(order)"
                              title="Siparişi İptal Et"
                              class="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 text-xs transition-colors">
                        ✕
                      </button>
                    }
                  </div>
                </div>

              </div>
            }
          </div>
        }

      </main>

      <!-- Order Detail Modal -->
      @if (selectedOrder()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div (click)="$event.stopPropagation()" class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-black text-slate-900 dark:text-white">Sipariş Detayı #{{ selectedOrder()!.id.substring(0, 8) }}</h3>
                <span class="text-xs text-slate-400">{{ selectedOrder()!.createdAt | date:'dd MMMM yyyy, HH:mm:ss' }}</span>
              </div>
              <button (click)="selectedOrder.set(null)" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <div class="space-y-4 mb-6">
              <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span class="text-slate-400 block">Müşteri</span>
                  <strong class="text-slate-800 dark:text-slate-200">{{ selectedOrder()!.customerName }}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block">Telefon</span>
                  <strong class="text-slate-800 dark:text-slate-200">{{ selectedOrder()!.customerPhone || '-' }}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block">Durum</span>
                  <span class="px-2 py-0.5 rounded-full font-bold text-[10px]" [ngClass]="getStatusBadgeClass(selectedOrder()!.status)">
                    {{ getStatusLabel(selectedOrder()!.status) }}
                  </span>
                </div>
              </div>

              <!-- Line items -->
              <div class="border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                <span class="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-2">Sipariş Kalemleri</span>
                <div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  @for (item of selectedOrder()!.items; track item.menuItemId) {
                    <div class="py-2 flex justify-between items-center">
                      <span>{{ item.quantity }}× {{ item.itemName }} ({{ item.unitPrice | number:'1.2-2' }} ₺)</span>
                      <strong>{{ item.lineTotal | number:'1.2-2' }} ₺</strong>
                    </div>
                  }
                </div>
                <div class="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-black text-sm">
                  <span>Toplam</span>
                  <span class="text-indigo-600 dark:text-indigo-400">{{ selectedOrder()!.totalAmount | number:'1.2-2' }} ₺</span>
                </div>
              </div>

              <!-- History Timeline -->
              @if (selectedOrder()!.statusHistory && selectedOrder()!.statusHistory!.length > 0) {
                <div class="border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                  <span class="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-2">Hareket Geçmişi</span>
                  <div class="space-y-3">
                    @for (hist of selectedOrder()!.statusHistory; track hist.id) {
                      <div class="flex items-start gap-2 text-xs">
                        <span class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <div class="flex-grow">
                          <div class="flex justify-between items-center">
                            <strong class="text-slate-800 dark:text-slate-200">{{ getStatusLabel(hist.toStatus) }}</strong>
                            <span class="text-slate-400 text-[10px]">{{ hist.changedAt | date:'HH:mm:ss' }}</span>
                          </div>
                          @if (hist.notes) {
                            <p class="text-[11px] text-slate-500">{{ hist.notes }} (İşlem: {{ hist.changedByName || 'Sistem' }})</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <button (click)="selectedOrder.set(null)" class="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">
              Kapat
            </button>
          </div>
        </div>
      }

      <!-- Admin Cancel Order Modal -->
      @if (orderToCancel()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div (click)="$event.stopPropagation()" class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-lg font-black text-slate-900 dark:text-white mb-2">Siparişi İptal Et</h3>
            <p class="text-xs text-slate-500 mb-4">Siparişi iptal etmek istediğinize emin misiniz? İptal sebebi geçmişe kaydedilecektir:</p>

            <textarea [(ngModel)]="cancelNotes" 
                      rows="3" 
                      placeholder="Örn: Stok yetersiz, müşteri talep etti..."
                      class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs mb-4 outline-none focus:ring-2 focus:ring-rose-500"></textarea>

            <div class="flex gap-2">
              <button (click)="orderToCancel.set(null)" class="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">Vazgeç</button>
              <button (click)="confirmAdminCancel()" class="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs">İptal Et</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class OrderManagerComponent implements OnInit, OnDestroy {
  readonly allOrders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly selectedTab = signal<string>('all');
  readonly selectedOrder = signal<Order | null>(null);
  readonly orderToCancel = signal<Order | null>(null);
  cancelNotes = '';
  searchQuery = '';

  statusTabs = [
    { key: 'all', label: 'Tüm Siparişler' },
    { key: 'active', label: '⚡ Aktifler' },
    { key: OrderStatus.Received, label: 'Yeni Alınanlar' },
    { key: OrderStatus.Preparing, label: 'Hazırlanıyor' },
    { key: OrderStatus.Ready, label: 'Hazır' },
    { key: OrderStatus.Completed, label: 'Tamamlandı' },
    { key: OrderStatus.Cancelled, label: 'İptal' }
  ];

  filteredOrders = computed(() => {
    const orders = this.allOrders();
    const tab = this.selectedTab();
    const query = this.searchQuery.trim().toLowerCase();

    let result = orders;

    if (tab === 'active') {
      result = orders.filter(o => o.status === OrderStatus.Received || o.status === OrderStatus.Preparing || o.status === OrderStatus.Ready);
    } else if (tab !== 'all') {
      result = orders.filter(o => o.status === tab);
    }

    if (!query) return result;

    return result.filter(o => 
      (o.customerName && o.customerName.toLowerCase().includes(query)) ||
      (o.customerPhone && o.customerPhone.includes(query)) ||
      o.id.toLowerCase().includes(query) ||
      (o.notes && o.notes.toLowerCase().includes(query))
    );
  });

  private newOrderSub?: Subscription;
  private statusSub?: Subscription;

  constructor(
    private orderService: OrderService,
    private signalRService: SignalRService,
    public themeService: ThemeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.refreshOrders();

    this.signalRService.connect();

    // Live update on new order
    this.newOrderSub = this.signalRService.newOrder$.subscribe(order => {
      this.toastService.info('Yeni Sipariş Geldi! 🔔', `${order.customerName} - ${order.totalAmount} ₺`);
      this.allOrders.update(list => [order, ...list]);
    });

    // Live update on status change
    this.statusSub = this.signalRService.orderStatusChanged$.subscribe(update => {
      this.allOrders.update(list => list.map(o => o.id === update.orderId ? { ...o, status: update.status as OrderStatus } : o));
    });
  }

  ngOnDestroy(): void {
    this.newOrderSub?.unsubscribe();
    this.statusSub?.unsubscribe();
  }

  refreshOrders(): void {
    this.loading.set(true);
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this.allOrders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getCountByTab(tabKey: string): number {
    const list = this.allOrders();
    if (tabKey === 'all') return list.length;
    if (tabKey === 'active') return list.filter(o => o.status === OrderStatus.Received || o.status === OrderStatus.Preparing || o.status === OrderStatus.Ready).length;
    return list.filter(o => o.status === tabKey).length;
  }

  getNextStatus(current: OrderStatus): OrderStatus | null {
    switch (current) {
      case OrderStatus.Received: return OrderStatus.Preparing;
      case OrderStatus.Preparing: return OrderStatus.Ready;
      case OrderStatus.Ready: return OrderStatus.Completed;
      default: return null;
    }
  }

  getNextActionLabel(current: OrderStatus): string {
    switch (current) {
      case OrderStatus.Received: return 'Hazırla';
      case OrderStatus.Preparing: return 'Hazır Yap';
      case OrderStatus.Ready: return 'Teslim Et';
      default: return '';
    }
  }

  advance(order: Order): void {
    const next = this.getNextStatus(order.status);
    if (!next) return;

    this.orderService.updateStatus(order.id, next, `Durum güncellendi: ${this.getStatusLabel(next)}`).subscribe({
      next: updated => {
        this.allOrders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.toastService.success('Durum Güncellendi', `#${order.id.substring(0, 8)} -> ${this.getStatusLabel(next)}`);
      },
      error: err => {
        const msg = err.error?.message || 'Durum güncellenemedi.';
        this.toastService.error('Hata', msg);
      }
    });
  }

  openCancelModal(order: Order): void {
    this.cancelNotes = '';
    this.orderToCancel.set(order);
  }

  confirmAdminCancel(): void {
    const order = this.orderToCancel();
    if (!order) return;

    this.orderService.updateStatus(order.id, OrderStatus.Cancelled, this.cancelNotes || 'Yönetici tarafından iptal edildi.').subscribe({
      next: updated => {
        this.orderToCancel.set(null);
        this.allOrders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.toastService.warning('Sipariş İptal Edildi', `#${order.id.substring(0, 8)} iptal edildi.`);
      },
      error: err => {
        const msg = err.error?.message || 'İptal işlemi başarısız.';
        this.toastService.error('Hata', msg);
      }
    });
  }

  openDetail(order: Order): void {
    this.selectedOrder.set(order);
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

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Received: return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case OrderStatus.Preparing: return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
      case OrderStatus.Ready: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case OrderStatus.Completed: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      case OrderStatus.Cancelled: return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  }
}
