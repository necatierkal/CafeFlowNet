import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantSetting, UpdateRestaurantSettingRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingService {
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<RestaurantSetting> {
    return this.http.get<RestaurantSetting>(this.baseUrl);
  }

  updateSettings(dto: UpdateRestaurantSettingRequest): Observable<RestaurantSetting> {
    return this.http.put<RestaurantSetting>(this.baseUrl, dto);
  }
}
