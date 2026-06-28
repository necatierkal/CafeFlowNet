import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./menu-manager/menu-manager.component')
      .then(m => m.MenuManagerComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./order-manager/order-manager.component')
      .then(m => m.OrderManagerComponent)
  },
  {
    path: 'customers',
    loadComponent: () => import('./customer-manager/customer-manager.component')
      .then(m => m.CustomerManagerComponent)
  }
];
