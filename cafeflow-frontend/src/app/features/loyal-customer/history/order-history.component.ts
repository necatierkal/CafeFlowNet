import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { MenuService } from '../../../core/services/menu.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <h1>Your order history</h1>

      @if (orders().length === 0) {
        <p class="empty">You haven't placed any orders yet. <a routerLink="/my">Browse the menu →</a></p>
      } @else {
        @for (order of orders(); track order.id) {
          <div class="order-card">
            <div class="order-top">
              <span class="date">{{ order.createdAt | date:'medium' }}</span>
              <span class="status-badge">{{ order.status }}</span>
            </div>
            <ul class="items">
              @for (item of order.items; track item.menuItemId) {
                <li>{{ item.quantity }}× {{ item.itemName }}</li>
              }
            </ul>
            <div class="order-bottom">
              <span class="total">{{ order.totalAmount | number:'1.2-2' }}</span>
              <button (click)="reorder(order)">Reorder</button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; max-width:520px; margin:0 auto; }
    h1 { margin:0 0 1rem; }
    .empty { color:#777; }
    .order-card { border:1px solid #eee; border-radius:10px; padding:0.9rem; margin-bottom:0.75rem; }
    .order-top { display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.4rem; }
    .date { color:#888; }
    .status-badge { background:#eef4fb; color:#1e5fa8; padding:0.1rem 0.5rem; border-radius:6px; font-weight:500; }
    .items { margin:0 0 0.5rem; padding-left:1.1rem; font-size:0.88rem; color:#444; }
    .order-bottom { display:flex; justify-content:space-between; align-items:center; }
    .total { font-weight:600; color:#1e5fa8; }
    button { font-size:0.82rem; padding:0.4rem 0.75rem; border:1px solid #1e5fa8; background:white;
      color:#1e5fa8; border-radius:6px; cursor:pointer; }
    button:hover { background:#1e5fa8; color:white; }
  `]
})
export class OrderHistoryComponent implements OnInit {
  readonly orders = signal<Order[]>([]);

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private menuService: MenuService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe(orders => this.orders.set(orders));
  }

  /** Re-adds this past order's items to the cart, using current menu data/prices. */
  reorder(order: Order): void {
    this.menuService.getMenu().subscribe(categories => {
      const allItems = categories.flatMap(c => c.items);
      this.cartService.clear();

      for (const line of order.items) {
        const currentItem = allItems.find(i => i.id === line.menuItemId);
        if (currentItem && currentItem.isAvailable) {
          this.cartService.addItem(currentItem, line.quantity);
        }
      }
      this.router.navigate(['/my/cart']);
    });
  }
}
