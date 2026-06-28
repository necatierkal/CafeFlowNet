import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, User, UserRole } from '../models';

const ACCESS_TOKEN_KEY = 'cf_access_token';
const REFRESH_TOKEN_KEY = 'cf_refresh_token';
const USER_KEY = 'cf_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals — the rest of the app reads these reactively
  private readonly _currentUser = signal<User | null>(this.loadStoredUser());
  readonly currentUser = this._currentUser.asReadonly();

  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === UserRole.Admin);
  readonly isLoyalCustomer = computed(() => this._currentUser()?.role === UserRole.LoyalCustomer);

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.storeSession(response)),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      // Best-effort revoke; don't block logout on the network call
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe();
    }
    this.clearSession();
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => this.storeSession(response)),
      catchError(err => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private storeSession(response: AuthResponse): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this._currentUser.set(response.user);
  }

  private clearSession(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }

  private loadStoredUser(): User | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as User : null;
  }
}
