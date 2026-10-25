import test from 'node:test';
import assert from 'node:assert/strict';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

class TokenManager {
  private user: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setAuth(user: User, accessToken: string, refreshToken: string): void {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearAuth(): void {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
  }

  isLoggedIn(): boolean {
    return !!(this.accessToken && this.user);
  }

  isAdmin(): boolean {
    return this.user?.role === 'Admin';
  }

  isLoyalCustomer(): boolean {
    return this.user?.role === 'LoyalCustomer';
  }

  canAccessAdminRoutes(): boolean {
    return this.isLoggedIn() && this.isAdmin() && (this.user?.isActive ?? false);
  }

  canAccessCustomerRoutes(): boolean {
    return this.isLoggedIn() && this.isLoyalCustomer() && (this.user?.isActive ?? false);
  }
}

test('TokenManager recognizes logged in Admin with active status', () => {
  const manager = new TokenManager();
  manager.setAuth(
    { id: '1', fullName: 'Admin User', email: 'admin@cafeflow.com', role: 'Admin', isActive: true },
    'mock_access_token',
    'mock_refresh_token'
  );

  assert.equal(manager.isLoggedIn(), true);
  assert.equal(manager.isAdmin(), true);
  assert.equal(manager.canAccessAdminRoutes(), true);
  assert.equal(manager.canAccessCustomerRoutes(), false);
});

test('TokenManager blocks deactivated Admin from routes', () => {
  const manager = new TokenManager();
  manager.setAuth(
    { id: '1', fullName: 'Admin User', email: 'admin@cafeflow.com', role: 'Admin', isActive: false },
    'mock_access_token',
    'mock_refresh_token'
  );

  assert.equal(manager.isLoggedIn(), true);
  assert.equal(manager.canAccessAdminRoutes(), false);
});

test('TokenManager handles LoyalCustomer permissions correctly', () => {
  const manager = new TokenManager();
  manager.setAuth(
    { id: '2', fullName: 'Customer One', email: 'cust@test.com', role: 'LoyalCustomer', isActive: true },
    'mock_access_token',
    'mock_refresh_token'
  );

  assert.equal(manager.isLoyalCustomer(), true);
  assert.equal(manager.canAccessCustomerRoutes(), true);
  assert.equal(manager.canAccessAdminRoutes(), false);
});

test('TokenManager clears state on logout', () => {
  const manager = new TokenManager();
  manager.setAuth(
    { id: '2', fullName: 'Customer One', email: 'cust@test.com', role: 'LoyalCustomer', isActive: true },
    'mock_access_token',
    'mock_refresh_token'
  );

  manager.clearAuth();
  assert.equal(manager.isLoggedIn(), false);
  assert.equal(manager.canAccessCustomerRoutes(), false);
});
