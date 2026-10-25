import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, CreateLoyalCustomerRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getLoyalCustomers(search?: string): Observable<User[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<User[]>(`${this.baseUrl}/loyal`, { params });
  }

  getCustomerById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/loyal/${id}`);
  }

  addLoyalCustomer(dto: CreateLoyalCustomerRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/loyal`, dto);
  }

  toggleCustomerStatus(customerId: string, isActive: boolean): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/loyal/${customerId}/status`, { isActive });
  }

  removeLoyalCustomer(customerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/loyal/${customerId}`);
  }
}
