import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <h1>Your order</h1>

      @if (cartService.lines().length === 0) {
        <p class="empty">Your cart is empty. <a routerLink="/my">Browse the menu →</a></p>
      } @else {
        @for (line of cartService.lines(); track line.menuItem.id) {
          <div class="line">
            <div class="line-info">
              <strong>{{ line.menuItem.name }}</strong>
              <span>{{ line.menuItem.price | number:'1.2-2' }} each</span>
            </div>
            <div class="qty-controls">
              <button (click)="cartService.setQuantity(line.menuItem.id, line.quantity - 1)">−</button>
              <span>{{ line.quantity }}</span>
              <button (click)="cartService.setQuantity(line.menuItem.id, line.quantity + 1)">+</button>
            </div>
            <span class="line-total">{{ line.menuItem.price * line.quantity | number:'1.2-2' }}</span>
          </div>
        }

        <div class="total-row">
          <span>Total</span>
          <strong>{{ cartService.total() | number:'1.2-2' }}</strong>
        </div>

        <label>Estimated arrival time (optional)</label>
        <input type="time" [(ngModel)]="arrivalTime" />

        <label>Notes for the kitchen (optional)</label>
        <textarea [(ngModel)]="notes" rows="2" placeholder="e.g. no onions, extra napkins"></textarea>

        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        <button class="place-order-btn" (click)="placeOrder()" [disabled]="placing()">
          {{ placing() ? 'Placing order…' : 'Place order' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; max-width:560px; margin:0 auto; }
    h1 { margin:0 0 1rem; }
    .empty { color:#777; }
    .line { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid #f0f0f0; }
    .line-info { flex:1; display:flex; flex-direction:column; }
    .line-info span { font-size:0.8rem; color:#999; }
    .qty-controls { display:flex; align-items:center; gap:0.5rem; }
    .qty-controls button { width:26px; height:26px; border:1px solid #ccc; background:white;
      border-radius:6px; cursor:pointer; }
    .line-total { font-weight:600; min-width:60px; text-align:right; }
    .total-row { display:flex; justify-content:space-between; padding:0.75rem 0; margin-top:0.5rem;
      border-top:2px solid #1e5fa8; font-size:1.1rem; }
    label { display:block; margin-top:1rem; font-size:0.85rem; font-weight:500; }
    input, textarea { width:100%; padding:0.55rem; border:1px solid #ccc; border-radius:6px;
      margin-top:0.3rem; font-family:inherit; }
    .error { color:#c0392b; font-size:0.85rem; margin-top:0.75rem; }
    .place-order-btn { width:100%; margin-top:1.25rem; padding:0.75rem; background:#1e5fa8;
      color:white; border:none; border-radius:8px; font-weight:500; cursor:pointer; font-size:1rem; }
    .place-order-btn:disabled { opacity:0.6; cursor:not-allowed; }
  `]
})
export class CartComponent {
  readonly placing = signal(false);
  readonly errorMessage = signal<string | null>(null);

  arrivalTime = '';
  notes = '';

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  placeOrder(): void {
    this.placing.set(true);
    this.errorMessage.set(null);

    let estimatedArrival: string | undefined;
    if (this.arrivalTime) {
      const [hours, minutes] = this.arrivalTime.split(':').map(Number);
      const arrival = new Date();
      arrival.setHours(hours, minutes, 0, 0);
      estimatedArrival = arrival.toISOString();
    }

    this.orderService.placeOrder({
      items: this.cartService.lines().map(l => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
      estimatedArrival,
      notes: this.notes || undefined
    }).subscribe({
      next: order => {
        this.cartService.clear();
        this.placing.set(false);
        this.router.navigate(['/my/orders', order.id]);
      },
      error: () => {
        this.placing.set(false);
        this.errorMessage.set('Could not place order — one or more items may no longer be available.');
      }
    });
  }
}
