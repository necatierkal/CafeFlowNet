import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { loyalCustomerGuard } from './core/guards/loyal-customer.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public-menu/menu-page.component')
      .then(m => m.MenuPageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'my',
    canActivate: [authGuard, loyalCustomerGuard],
    loadChildren: () => import('./features/loyal-customer/loyal-customer.routes')
      .then(m => m.LOYAL_CUSTOMER_ROUTES)
  },
  { path: '**', redirectTo: '' }
];
