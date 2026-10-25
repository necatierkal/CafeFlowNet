import { Injectable, signal, computed, effect } from '@angular/core';
import { CartLine, MenuItem } from '../models';

const CART_KEY = 'cf_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>(this.loadCart());
  readonly lines = this._lines.asReadonly();

  readonly itemCount = computed(() =>
    this._lines().reduce((sum, line) => sum + line.quantity, 0)
  );

  readonly total = computed(() =>
    this._lines().reduce((sum, line) => sum + line.menuItem.price * line.quantity, 0)
  );

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(this._lines()));
      } catch {
        // Ignore storage errors
      }
    });
  }

  addItem(menuItem: MenuItem, quantity = 1): void {
    const existing = this._lines().find(l => l.menuItem.id === menuItem.id);
    if (existing) {
      this.setQuantity(menuItem.id, existing.quantity + quantity);
    } else {
      this._lines.update(lines => [...lines, { menuItem, quantity }]);
    }
  }

  setQuantity(menuItemId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(menuItemId);
      return;
    }
    // Upper bound cap per item line
    const cappedQuantity = Math.min(100, quantity);
    this._lines.update(lines =>
      lines.map(l => l.menuItem.id === menuItemId ? { ...l, quantity: cappedQuantity } : l)
    );
  }

  removeItem(menuItemId: number): void {
    this._lines.update(lines => lines.filter(l => l.menuItem.id !== menuItemId));
  }

  clear(): void {
    this._lines.set([]);
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // Ignore
    }
  }

  private loadCart(): CartLine[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) as CartLine[] : [];
    } catch {
      return [];
    }
  }
}
