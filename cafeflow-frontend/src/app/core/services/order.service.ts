import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, CreateOrderRequest, OrderStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /** Loyal customer places a remote order. */
  placeOrder(dto: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, dto);
  }

  /** Loyal customer's own order history. */
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/my`);
  }

  /** Admin — all orders, optionally filtered by status. */
  getAllOrders(status?: OrderStatus): Observable<Order[]> {
    const params: Record<string, string> = status ? { status } : {};
    return this.http.get<Order[]>(this.baseUrl, { params });
  }

  /** Admin — move an order to the next stage (Received → Preparing → Ready → Completed). */
  updateStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${orderId}/status`, { status });
  }
}
