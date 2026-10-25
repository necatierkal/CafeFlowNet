import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, CreateOrderRequest, OrderStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /** Customer places an order */
  placeOrder(dto: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, dto);
  }

  /** Customer's own order history */
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/my`);
  }

  /** Get specific order by ID */
  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${orderId}`);
  }

  /** Customer cancels order before preparation starts */
  cancelMyOrder(orderId: string, reason: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${orderId}/cancel`, { reason });
  }

  /** Admin — all orders with flexible filters */
  getAllOrders(status?: OrderStatus, fromDate?: string, toDate?: string, searchTerm?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<Order[]>(this.baseUrl, { params });
  }

  /** Admin — update order status */
  updateStatus(orderId: string, status: OrderStatus, notes?: string): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${orderId}/status`, { status, notes });
  }
}
