import { Injectable, signal, computed } from '@angular/core';
import { CartLine, MenuItem } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>([]);
  readonly lines = this._lines.asReadonly();

  readonly itemCount = computed(() =>
    this._lines().reduce((sum, line) => sum + line.quantity, 0)
  );

  readonly total = computed(() =>
    this._lines().reduce((sum, line) => sum + line.menuItem.price * line.quantity, 0)
  );

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
    this._lines.update(lines =>
      lines.map(l => l.menuItem.id === menuItemId ? { ...l, quantity } : l)
    );
  }

  removeItem(menuItemId: number): void {
    this._lines.update(lines => lines.filter(l => l.menuItem.id !== menuItemId));
  }

  clear(): void {
    this._lines.set([]);
  }
}
