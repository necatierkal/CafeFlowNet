import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Order } from '../models';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connection?: signalR.HubConnection;

  /** Emits whenever the admin dashboard should add a new order to the board. */
  readonly newOrder$ = new Subject<Order>();

  /** Emits { orderId, status } whenever any tracked order's status changes. */
  readonly orderStatusChanged$ = new Subject<{ orderId: string; status: string }>();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.connection) return; // already connected

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => this.authService.getAccessToken() ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('NewOrder', (order: Order) => this.newOrder$.next(order));
    this.connection.on('OrderStatusChanged', (data: { orderId: string; status: string }) =>
      this.orderStatusChanged$.next(data)
    );

    this.connection.start().catch(err => console.error('SignalR connection failed:', err));
  }

  /** Loyal customers call this after placing an order to receive live status updates. */
  joinOrderGroup(orderId: string): void {
    this.connection?.invoke('JoinOrderGroup', orderId).catch(err => console.error(err));
  }

  leaveOrderGroup(orderId: string): void {
    this.connection?.invoke('LeaveOrderGroup', orderId).catch(err => console.error(err));
  }

  disconnect(): void {
    this.connection?.stop();
    this.connection = undefined;
  }
}
