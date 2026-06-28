import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MenuCategory, MenuItem, CreateMenuItemRequest,
  UpdateMenuItemRequest, CreateMenuCategoryRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly baseUrl = `${environment.apiUrl}/menu`;

  constructor(private http: HttpClient) {}

  /** Public menu — only available items. Used by guests and loyal customers. */
  getMenu(): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.baseUrl}/categories`);
  }

  /** Admin menu view — includes unavailable items so they can be re-enabled. */
  getMenuForAdmin(): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.baseUrl}/categories/admin`);
  }

  createCategory(dto: CreateMenuCategoryRequest): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(`${this.baseUrl}/categories`, dto);
  }

  createItem(dto: CreateMenuItemRequest): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.baseUrl}/items`, dto);
  }

  /**
   * Updates a menu item. Pass only the fields you want to change —
   * e.g. updateItem(5, { price: 7.50 }) changes just the price.
   * This is the core "owner can change price easily" endpoint.
   */
  updateItem(id: number, dto: UpdateMenuItemRequest): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/items/${id}`, dto);
  }

  toggleAvailability(item: MenuItem): Observable<MenuItem> {
    return this.updateItem(item.id, { isAvailable: !item.isAvailable });
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/items/${id}`);
  }
}
