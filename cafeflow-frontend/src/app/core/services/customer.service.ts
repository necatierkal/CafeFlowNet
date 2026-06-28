import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, CreateLoyalCustomerRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getLoyalCustomers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/loyal`);
  }

  /** Admin adds a customer as "loyal" so they can log in and order remotely. */
  addLoyalCustomer(dto: CreateLoyalCustomerRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/loyal`, dto);
  }

  removeLoyalCustomer(customerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/loyal/${customerId}`);
  }
}
