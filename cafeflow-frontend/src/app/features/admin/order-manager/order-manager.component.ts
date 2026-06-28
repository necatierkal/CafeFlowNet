import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { Order, OrderStatus } from '../../../core/models';
import { Subscription } from 'rxjs';

const COLUMNS: { status: OrderStatus; label: string; next: OrderStatus | null }[] = [
  { status: OrderStatus.Received, label: 'Received', next: OrderStatus.Preparing },
  { status: OrderStatus.Preparing, label: 'Preparing', next: OrderStatus.Ready },
  { status: OrderStatus.Ready, label: 'Ready', next: OrderStatus.Completed },
  { status: OrderStatus.Completed, label: 'Completed', next: null }
];

@Component({
  selector: 'app-order-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>Live orders</h1>
      <div class="board">
        @for (column of columns; track column.status) {
          <div class="column">
            <h2>{{ column.label }} ({{ ordersByStatus(column.status)().length }})</h2>
            @for (order of ordersByStatus(column.status)(); track order.id) {
              <div class="order-card">
                <div class="order-top">
                  <strong>{{ order.customerName }}</strong>
                  <span class="time">{{ order.createdAt | date:'shortTime' }}</span>
                </div>
                <ul class="items">
                  @for (item of order.items; track item.menuItemId) {
                    <li>{{ item.quantity }}× {{ item.itemName }}</li>
                  }
                </ul>
                <div class="order-bottom">
                  <span class="total">{{ order.totalAmount | number:'1.2-2' }}</span>
                  @if (column.next) {
                    <button (click)="advance(order, column.next)">
                      Mark {{ getLabel(column.next) }} →
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; }
    h1 { margin:0 0 1rem; }
    .board { display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; }
    .column { background:#fafafa; border-radius:10px; padding:0.75rem; min-height:200px; }
    .column h2 { font-size:0.95rem; margin:0 0 0.75rem; color:#555; }
    .order-card { background:white; border:1px solid #eee; border-radius:8px; padding:0.75rem; margin-bottom:0.6rem; }
    .order-top { display:flex; justify-content:space-between; font-size:0.9rem; }
    .time { color:#999; font-size:0.8rem; }
    .items { margin:0.4rem 0; padding-left:1rem; font-size:0.85rem; color:#444; }
    .order-bottom { display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; }
    .total { font-weight:600; color:#1e5fa8; }
    button { font-size:0.78rem; padding:0.35rem 0.6rem; border:1px solid #1e5fa8; background:white;
      color:#1e5fa8; border-radius:6px; cursor:pointer; }
    button:hover { background:#1e5fa8; color:white; }
    @media (max-width: 900px) { .board { grid-template-columns:1fr; } }
  `]
})
export class OrderManagerComponent implements OnInit, OnDestroy {
  readonly columns = COLUMNS;
  readonly allOrders = signal<Order[]>([]);
  private subscription?: Subscription;

  constructor(
    private orderService: OrderService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe(orders => this.allOrders.set(orders));

    this.signalRService.connect();
    this.subscription = this.signalRService.newOrder$.subscribe(order => {
      this.allOrders.update(orders => [order, ...orders]);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  ordersByStatus(status: OrderStatus) {
    return computed(() => this.allOrders().filter(o => o.status === status));
  }

  advance(order: Order, next: OrderStatus): void {
    this.orderService.updateStatus(order.id, next).subscribe(updated => {
      this.allOrders.update(orders => orders.map(o => o.id === updated.id ? updated : o));
    });
  }

  getLabel(status: OrderStatus): string {
    return COLUMNS.find(c => c.status === status)?.label ?? status;
  }
}
