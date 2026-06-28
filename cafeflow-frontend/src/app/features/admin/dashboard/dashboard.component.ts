import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <h1>Dashboard</h1>

      <div class="stats">
        <div class="stat-card">
          <span class="label">Today's orders</span>
          <span class="value">{{ todaysOrders().length }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Today's revenue</span>
          <span class="value">{{ todaysRevenue() | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Active orders</span>
          <span class="value">{{ activeOrders().length }}</span>
        </div>
      </div>

      <div class="links">
        <a routerLink="/admin/menu" class="link-card">
          <strong>Menu manager</strong>
          <span>Edit items, prices, and availability</span>
        </a>
        <a routerLink="/admin/orders" class="link-card">
          <strong>Live orders</strong>
          <span>Track and update incoming orders</span>
        </a>
        <a routerLink="/admin/customers" class="link-card">
          <strong>Loyal customers</strong>
          <span>Add or remove customer access</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; max-width:900px; }
    h1 { margin:0 0 1rem; }
    .stats { display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin-bottom:1.5rem; }
    .stat-card { background:#fafafa; border-radius:10px; padding:1rem; display:flex; flex-direction:column; gap:0.3rem; }
    .label { font-size:0.8rem; color:#888; }
    .value { font-size:1.6rem; font-weight:600; color:#1e5fa8; }
    .links { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; }
    .link-card { display:flex; flex-direction:column; gap:0.3rem; padding:1rem; border:1px solid #eee;
      border-radius:10px; text-decoration:none; color:inherit; }
    .link-card:hover { border-color:#1e5fa8; }
    .link-card span { font-size:0.85rem; color:#777; }
    @media (max-width:700px) { .stats { grid-template-columns:1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly allOrders = signal<Order[]>([]);

  readonly todaysOrders = computed(() => {
    const today = new Date().toDateString();
    return this.allOrders().filter(o => new Date(o.createdAt).toDateString() === today);
  });

  readonly todaysRevenue = computed(() =>
    this.todaysOrders().reduce((sum, o) => sum + o.totalAmount, 0)
  );

  readonly activeOrders = computed(() =>
    this.allOrders().filter(o =>
      o.status === OrderStatus.Received || o.status === OrderStatus.Preparing || o.status === OrderStatus.Ready
    )
  );

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe(orders => this.allOrders.set(orders));
  }
}
