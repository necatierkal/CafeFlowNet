import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { Order, OrderStatus } from '../../../core/models';
import { Subscription } from 'rxjs';

const STEPS: OrderStatus[] = [OrderStatus.Received, OrderStatus.Preparing, OrderStatus.Ready, OrderStatus.Completed];

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (order()) {
      <div class="page">
        <h1>Order status</h1>

        <div class="progress">
          @for (step of steps; track step) {
            <div class="step" [class.active]="isStepReached(step)">
              <div class="dot"></div>
              <span>{{ step }}</span>
            </div>
          }
        </div>

        <div class="order-summary">
          <h2>Your order</h2>
          @for (item of order()!.items; track item.menuItemId) {
            <div class="line">
              <span>{{ item.quantity }}× {{ item.itemName }}</span>
              <span>{{ item.lineTotal | number:'1.2-2' }}</span>
            </div>
          }
          <div class="line total">
            <span>Total</span>
            <span>{{ order()!.totalAmount | number:'1.2-2' }}</span>
          </div>
        </div>

        <a routerLink="/my" class="back-link">← Back to menu</a>
      </div>
    } @else {
      <p class="status">Loading order…</p>
    }
  `,
  styles: [`
    .page { padding:1.5rem; max-width:480px; margin:0 auto; }
    h1 { margin:0 0 1.5rem; }
    .progress { display:flex; justify-content:space-between; margin-bottom:2rem; position:relative; }
    .step { display:flex; flex-direction:column; align-items:center; gap:0.4rem; flex:1; }
    .dot { width:18px; height:18px; border-radius:50%; background:#ddd; }
    .step.active .dot { background:#1e7d4f; }
    .step span { font-size:0.75rem; color:#999; text-align:center; }
    .step.active span { color:#1e7d4f; font-weight:500; }
    .order-summary { border:1px solid #eee; border-radius:10px; padding:1rem; }
    .order-summary h2 { margin:0 0 0.6rem; font-size:1rem; }
    .line { display:flex; justify-content:space-between; padding:0.3rem 0; font-size:0.9rem; }
    .line.total { border-top:1px solid #eee; margin-top:0.4rem; padding-top:0.5rem; font-weight:600; }
    .back-link { display:inline-block; margin-top:1.5rem; color:#1e5fa8; text-decoration:none; font-size:0.9rem; }
    .status { padding:2rem; text-align:center; color:#777; }
  `]
})
export class OrderStatusComponent implements OnInit, OnDestroy {
  readonly order = signal<Order | null>(null);
  readonly steps = STEPS;
  private subscription?: Subscription;
  private orderId!: string;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.params['id'];

    this.orderService.getMyOrders().subscribe(orders => {
      const found = orders.find(o => o.id === this.orderId);
      if (found) this.order.set(found);
    });

    this.signalRService.connect();
    this.signalRService.joinOrderGroup(this.orderId);

    this.subscription = this.signalRService.orderStatusChanged$.subscribe(update => {
      if (update.orderId === this.orderId) {
        this.order.update(current => current ? { ...current, status: update.status as OrderStatus } : current);
      }
    });
  }

  ngOnDestroy(): void {
    this.signalRService.leaveOrderGroup(this.orderId);
    this.subscription?.unsubscribe();
  }

  isStepReached(step: OrderStatus): boolean {
    const current = this.order();
    if (!current) return false;
    return STEPS.indexOf(step) <= STEPS.indexOf(current.status);
  }
}
