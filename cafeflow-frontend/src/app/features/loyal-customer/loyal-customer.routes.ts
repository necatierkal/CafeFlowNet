import { Routes } from '@angular/router';

export const LOYAL_CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./menu/menu-browse.component')
      .then(m => m.MenuBrowseComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.component')
      .then(m => m.CartComponent)
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./order-status/order-status.component')
      .then(m => m.OrderStatusComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./history/order-history.component')
      .then(m => m.OrderHistoryComponent)
  }
];
