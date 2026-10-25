import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Order } from '../models';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connection?: signalR.HubConnection;
  private trackedOrderIds = new Set<string>();

  /** Emits whenever the admin dashboard should add a new order to the board. */
  readonly newOrder$ = new Subject<Order>();

  /** Emits { orderId, status, notes } whenever any tracked order's status changes. */
  readonly orderStatusChanged$ = new Subject<{ orderId: string; status: string; notes?: string }>();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.connection) {
      this.disconnect();
    }

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => this.authService.getAccessToken() ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('NewOrder', (order: Order) => this.newOrder$.next(order));
    this.connection.on('OrderStatusChanged', (data: { orderId: string; status: string; notes?: string }) =>
      this.orderStatusChanged$.next(data)
    );

    this.connection.onreconnected(() => {
      // Re-join any previously tracked orders on reconnect
      for (const orderId of this.trackedOrderIds) {
        this.connection?.invoke('JoinOrderGroup', orderId).catch(() => {});
      }
    });

    this.connection.start().catch(() => {
      // Network failure on initial connection is handled gracefully
    });
  }

  /** Customers call this after placing or tracking an order to receive live status updates. */
  joinOrderGroup(orderId: string): void {
    this.trackedOrderIds.add(orderId);
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      this.connection.invoke('JoinOrderGroup', orderId).catch(() => {});
    }
  }

  leaveOrderGroup(orderId: string): void {
    this.trackedOrderIds.delete(orderId);
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      this.connection.invoke('LeaveOrderGroup', orderId).catch(() => {});
    }
  }

  disconnect(): void {
    this.trackedOrderIds.clear();
    if (this.connection) {
      this.connection.stop().catch(() => {});
      this.connection = undefined;
    }
  }
}
