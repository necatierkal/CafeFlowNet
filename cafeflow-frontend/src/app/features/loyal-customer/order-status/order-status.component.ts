import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      <!-- Top Bar -->
      <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a routerLink="/my/history" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              ←
            </a>
            <div>
              <h1 class="text-lg font-black text-slate-900 dark:text-white leading-tight">Canlı Sipariş Takibi</h1>
              <span class="text-xs text-slate-400">Sipariş ID: #{{ orderId.substring(0, 8) }}</span>
            </div>
          </div>
          <button (click)="refreshOrder()" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors">
            🔄 Yenile
          </button>
        </div>
      </div>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-24">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-sm text-slate-500">Sipariş durumu alınıyor...</p>
          </div>
        } 
        
        @else if (order()) {
          
          <!-- Status Alert / Banner -->
          @if (order()!.status === 'Cancelled') {
            <div class="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 mb-6 flex items-start gap-4">
              <span class="text-3xl">🚫</span>
              <div>
                <h3 class="font-bold text-base leading-tight">Sipariş İptal Edildi</h3>
                <p class="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {{ order()!.cancellationReason || 'Bu sipariş iptal edilmiştir.' }}
                </p>
              </div>
            </div>
          } @else if (order()!.status === 'Completed') {
            <div class="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 mb-6 flex items-start gap-4">
              <span class="text-3xl">🎉</span>
              <div>
                <h3 class="font-bold text-base leading-tight">Siparişiniz Teslim Edildi!</h3>
                <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Afiyet olsun! CafeFlow'u tercih ettiğiniz için teşekkür ederiz.
                </p>
              </div>
            </div>
          }

          <!-- Live Progress Stepper (Only active if not cancelled) -->
          @if (order()!.status !== 'Cancelled') {
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
              <div class="flex justify-between items-center mb-6">
                <div>
                  <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Güncel Durum</span>
                  <h2 class="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {{ getStatusLabel(order()!.status) }}
                  </h2>
                </div>
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pulse">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Canlı Bağlantı Aktif</span>
                </div>
              </div>

              <!-- Stepper Bar -->
              <div class="grid grid-cols-4 gap-2 relative">
                @for (step of steps; track step.key; let i = $index) {
                  <div class="flex flex-col items-center text-center">
                    <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm mb-2 transition-all duration-300"
                         [ngClass]="getStepIndex(order()!.status) >= i 
                           ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                           : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'">
                      <span>{{ step.icon }}</span>
                    </div>
                    <span class="text-[11px] font-bold"
                          [ngClass]="getStepIndex(order()!.status) >= i 
                            ? 'text-indigo-600 dark:text-indigo-400' 
                            : 'text-slate-400 dark:text-slate-600'">
                      {{ step.label }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Order Summary Card -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
            <h3 class="font-bold text-sm text-slate-900 dark:text-white mb-4">Sipariş Kalemleri</h3>

            <div class="divide-y divide-slate-100 dark:divide-slate-800 mb-4">
              @for (item of order()!.items; track item.menuItemId) {
                <div class="py-2.5 flex justify-between items-center text-sm">
                  <span class="font-medium text-slate-700 dark:text-slate-300">{{ item.quantity }}× {{ item.itemName }}</span>
                  <span class="font-black text-slate-900 dark:text-white">{{ item.lineTotal | number:'1.2-2' }} ₺</span>
                </div>
              }
            </div>

            @if (order()!.notes) {
              <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                <span class="text-[11px] font-bold text-slate-400 block mb-0.5">Sipariş Notunuz:</span>
                <p class="text-xs text-slate-600 dark:text-slate-300">{{ order()!.notes }}</p>
              </div>
            }

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-bold">
              <span class="text-sm text-slate-500">Toplam Tutar</span>
              <span class="text-xl font-black text-slate-900 dark:text-white">{{ order()!.totalAmount | number:'1.2-2' }} ₺</span>
            </div>
          </div>

          <!-- Status History Timeline Card -->
          @if (order()!.statusHistory && order()!.statusHistory!.length > 0) {
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
              <h3 class="font-bold text-sm text-slate-900 dark:text-white mb-4">Sipariş Hareket Geçmişi</h3>
              <div class="space-y-4">
                @for (hist of order()!.statusHistory; track hist.id) {
                  <div class="flex items-start gap-3">
                    <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                    <div class="flex-grow">
                      <div class="flex justify-between items-center">
                        <span class="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {{ getStatusLabel(hist.toStatus) }}
                        </span>
                        <span class="text-[11px] text-slate-400">{{ hist.changedAt | date:'HH:mm' }}</span>
                      </div>
                      @if (hist.notes) {
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ hist.notes }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Actions: Cancel Order (Only if Received) OR Reorder -->
          <div class="flex flex-col gap-3">
            @if (order()!.status === 'Received') {
              <button (click)="openCancelModal()"
                      class="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors">
                ⚠️ Siparişi İptal Et
              </button>
            }

            <button (click)="reorder()"
                    class="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
              <span>🔁 Bu Siparişi Tekrarla</span>
            </button>
          </div>

        } @else {
          <div class="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span class="text-5xl block mb-3">❓</span>
            <h3 class="font-bold text-base mb-1">Sipariş Bulunamadı</h3>
            <p class="text-xs text-slate-500 mb-4">Bu sipariş mevcut değil veya erişim yetkiniz bulunmuyor.</p>
            <a routerLink="/my/history" class="text-indigo-600 font-bold text-xs hover:underline">Sipariş Geçmişime Git →</a>
          </div>
        }

      </div>

      <!-- Cancel Modal -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div (click)="$event.stopPropagation()" class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-lg font-black text-slate-900 dark:text-white mb-2">Siparişi İptal Et</h3>
            <p class="text-xs text-slate-500 mb-4">Sipariş henüz mutfakta hazırlanmaya başlanmadığı için iptal edebilirsiniz. Lütfen bir sebep belirtin:</p>
            
            <textarea [(ngModel)]="cancelReason" 
                      rows="3" 
                      placeholder="Örn: Yanlış ürün seçtim, vazgeçtim..."
                      class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs mb-4 focus:ring-2 focus:ring-rose-500 outline-none"></textarea>

            <div class="flex gap-2">
              <button (click)="showCancelModal.set(false)" class="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">Vazgeç</button>
              <button (click)="confirmCancel()" 
                      [disabled]="cancelling() || !cancelReason.trim()"
                      class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50">
                {{ cancelling() ? 'İptal Ediliyor...' : 'İptali Onayla' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class OrderStatusComponent implements OnInit, OnDestroy {
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly showCancelModal = signal(false);
  readonly cancelling = signal(false);
  cancelReason = '';

  orderId!: string;
  private subscription?: Subscription;

  steps = [
    { key: OrderStatus.Received, label: 'Alındı', icon: '📥' },
    { key: OrderStatus.Preparing, label: 'Hazırlanıyor', icon: '🍳' },
    { key: OrderStatus.Ready, label: 'Hazır', icon: '🔔' },
    { key: OrderStatus.Completed, label: 'Teslim Edildi', icon: '🎉' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private signalRService: SignalRService,
    private cartService: CartService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.params['id'];
    this.refreshOrder();

    this.signalRService.connect();
    this.signalRService.joinOrderGroup(this.orderId);

    this.subscription = this.signalRService.orderStatusChanged$.subscribe(update => {
      if (update.orderId === this.orderId) {
        this.toastService.info('Sipariş Durumu Güncellendi', `Yeni durum: ${this.getStatusLabel(update.status as OrderStatus)}`);
        this.refreshOrder();
      }
    });
  }

  ngOnDestroy(): void {
    this.signalRService.leaveOrderGroup(this.orderId);
    this.subscription?.unsubscribe();
  }

  refreshOrder(): void {
    this.orderService.getOrderById(this.orderId).subscribe({
      next: order => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getStepIndex(status: OrderStatus): number {
    switch (status) {
      case OrderStatus.Received: return 0;
      case OrderStatus.Preparing: return 1;
      case OrderStatus.Ready: return 2;
      case OrderStatus.Completed: return 3;
      default: return -1;
    }
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Received: return 'Sipariş Alındı';
      case OrderStatus.Preparing: return 'Mutfakta Hazırlanıyor';
      case OrderStatus.Ready: return 'Hazır / Masaya / Servise Verildi';
      case OrderStatus.Completed: return 'Tamamlandı';
      case OrderStatus.Cancelled: return 'İptal Edildi';
      default: return status;
    }
  }

  openCancelModal(): void {
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  confirmCancel(): void {
    if (!this.cancelReason.trim()) return;
    this.cancelling.set(true);

    this.orderService.cancelMyOrder(this.orderId, this.cancelReason.trim()).subscribe({
      next: updated => {
        this.cancelling.set(false);
        this.showCancelModal.set(false);
        this.order.set(updated);
        this.toastService.warning('Sipariş İptal Edildi', 'Talebiniz üzerine siparişiniz iptal edildi.');
      },
      error: err => {
        this.cancelling.set(false);
        const msg = err.error?.message || 'Sipariş iptal edilemedi.';
        this.toastService.error('Hata', msg);
      }
    });
  }

  reorder(): void {
    const o = this.order();
    if (!o) return;

    for (const item of o.items) {
      this.cartService.addItem({
        id: item.menuItemId,
        name: item.itemName,
        price: item.unitPrice,
        categoryId: 1,
        isAvailable: true,
        displayOrder: 1
      }, item.quantity);
    }

    this.toastService.success('Ürünler Sepete Eklendi', 'Önceki siparişinizin ürünleri sepetinize aktarıldı.');
    this.router.navigate(['/my/cart']);
  }
}
