import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      <!-- Top Bar -->
      <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a routerLink="/my" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              ←
            </a>
            <h1 class="text-xl font-black text-slate-900 dark:text-white">Sipariş Sepetim</h1>
          </div>
          @if (cartService.lines().length > 0) {
            <button (click)="clearCart()" class="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">
              Sepeti Temizle
            </button>
          }
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        
        @if (cartService.lines().length === 0) {
          <div class="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span class="text-6xl mb-4 block">🛒</span>
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Sepetiniz Boş</h3>
            <p class="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm mb-6">
              Henüz sepetinize lezzetli bir ürün eklemediniz. Menümüzü inceleyerek hemen sipariş oluşturabilirsiniz.
            </p>
            <a routerLink="/my" 
               class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all">
              <span>Menüyü İncele</span>
              <span>→</span>
            </a>
          </div>
        } @else {
          
          <!-- Cart Items Card -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
            <h2 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Seçilen Lezzetler ({{ cartService.itemCount() }} adet)</span>
            </h2>

            <div class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (line of cartService.lines(); track line.menuItem.id) {
                <div class="py-4 flex items-center justify-between gap-4">
                  <div class="flex-grow">
                    <h3 class="font-bold text-sm text-slate-900 dark:text-white">{{ line.menuItem.name }}</h3>
                    <span class="text-xs text-slate-400">{{ line.menuItem.price | number:'1.2-2' }} ₺ / adet</span>
                  </div>

                  <!-- Qty controls -->
                  <div class="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-800">
                    <button (click)="cartService.setQuantity(line.menuItem.id, line.quantity - 1)"
                            class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors">
                      −
                    </button>
                    <span class="w-8 text-center font-bold text-xs">{{ line.quantity }}</span>
                    <button (click)="cartService.setQuantity(line.menuItem.id, line.quantity + 1)"
                            class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors">
                      +
                    </button>
                  </div>

                  <!-- Line total -->
                  <div class="text-right min-w-[70px]">
                    <span class="font-black text-sm text-slate-900 dark:text-white">
                      {{ (line.menuItem.price * line.quantity) | number:'1.2-2' }} ₺
                    </span>
                  </div>

                  <!-- Delete -->
                  <button (click)="cartService.removeItem(line.menuItem.id)" class="text-slate-400 hover:text-rose-500 text-xs p-1">
                    ✕
                  </button>
                </div>
              }
            </div>

            <!-- Total summary -->
            <div class="mt-6 pt-4 border-t-2 border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span class="text-xs text-slate-400 block">Ödenecek Toplam Tutar</span>
                <span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Tüm fiyatlar ve KDV dahil</span>
              </div>
              <div class="text-2xl font-black text-slate-900 dark:text-white">
                {{ cartService.total() | number:'1.2-2' }} <span class="text-sm font-medium text-slate-400">₺</span>
              </div>
            </div>
          </div>

          <!-- Order Details Card -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 space-y-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Sipariş Notu & Varış Süresi</h3>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tahmini Varış Saatiniz (İsteğe bağlı)
              </label>
              <input type="time" 
                     [(ngModel)]="arrivalTime"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span class="text-[11px] text-slate-400 block mt-1">Siparişinizin tam vaktinde sıcak ve hazır olması için varış saatinizi belirtebilirsiniz.</span>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mutfak ve Barista Notu (İsteğe bağlı)
              </label>
              <textarea [(ngModel)]="notes" 
                        rows="2" 
                        placeholder="Örn: Kahvem lütfen az şekerli olsun, peçete ekleyebilir misiniz?"
                        class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"></textarea>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs mb-6">
              {{ errorMessage() }}
            </div>
          }

          <!-- Place Order Button -->
          <button (click)="placeOrder()" 
                  [disabled]="placing()"
                  class="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black text-base shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-3">
            @if (placing()) {
              <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Siparişiniz İletiliyor...</span>
            } @else {
              <span>Siparişi Onayla & Gönder</span>
              <span>•</span>
              <span>{{ cartService.total() | number:'1.2-2' }} ₺</span>
            }
          </button>
        }

      </div>

    </div>
  `
})
export class CartComponent {
  readonly placing = signal(false);
  readonly errorMessage = signal<string | null>(null);

  arrivalTime = '';
  notes = '';

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private toastService: ToastService
  ) {}

  clearCart(): void {
    if (confirm('Sepetinizdeki tüm ürünleri temizlemek istediğinize emin misiniz?')) {
      this.cartService.clear();
      this.toastService.info('Sepet Temizlendi');
    }
  }

  placeOrder(): void {
    if (this.cartService.lines().length === 0) return;
    this.placing.set(true);
    this.errorMessage.set(null);

    let estimatedArrival: string | undefined;
    if (this.arrivalTime) {
      const [hours, minutes] = this.arrivalTime.split(':').map(Number);
      const arrival = new Date();
      arrival.setHours(hours, minutes, 0, 0);
      estimatedArrival = arrival.toISOString();
    }

    // Unique idempotency key to prevent double submissions
    const idempotencyKey = 'cf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    this.orderService.placeOrder({
      items: this.cartService.lines().map(l => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
      estimatedArrival,
      notes: this.notes.trim() || undefined,
      idempotencyKey
    }).subscribe({
      next: order => {
        this.cartService.clear();
        this.placing.set(false);
        this.toastService.success('Sipariş Alındı! 🎉', 'Siparişiniz mutfağa iletildi.');
        this.router.navigate(['/my/orders', order.id]);
      },
      error: err => {
        this.placing.set(false);
        const msg = err.error?.message || 'Sipariş oluşturulamadı — menüdeki ürünlerden biri artık mevcut olmayabilir.';
        this.errorMessage.set(msg);
        this.toastService.error('Sipariş Başarısız', msg);
      }
    });
  }
}
