import test from 'node:test';
import assert from 'node:assert/strict';

interface CartItem {
  menuItemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

class CartManager {
  private items: CartItem[] = [];

  getItems(): CartItem[] {
    return [...this.items];
  }

  addItem(item: { menuItemId: number; name: string; unitPrice: number; quantity?: number }): void {
    const existing = this.items.find(i => i.menuItemId === item.menuItemId);
    const qty = item.quantity ?? 1;
    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, 50);
    } else {
      this.items.push({
        menuItemId: item.menuItemId,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: Math.min(qty, 50)
      });
    }
  }

  updateQuantity(menuItemId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(menuItemId);
      return;
    }
    const item = this.items.find(i => i.menuItemId === menuItemId);
    if (item) {
      item.quantity = Math.min(quantity, 50);
    }
  }

  removeItem(menuItemId: number): void {
    this.items = this.items.filter(i => i.menuItemId !== menuItemId);
  }

  clear(): void {
    this.items = [];
  }

  getTotalPrice(): number {
    return this.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  getTotalCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

test('CartManager adds new item correctly', () => {
  const cart = new CartManager();
  cart.addItem({ menuItemId: 1, name: 'Espresso', unitPrice: 75, quantity: 2 });
  
  assert.equal(cart.getItems().length, 1);
  assert.equal(cart.getItems()[0].quantity, 2);
  assert.equal(cart.getTotalPrice(), 150);
  assert.equal(cart.getTotalCount(), 2);
});

test('CartManager increments quantity for existing item', () => {
  const cart = new CartManager();
  cart.addItem({ menuItemId: 1, name: 'Espresso', unitPrice: 75, quantity: 1 });
  cart.addItem({ menuItemId: 1, name: 'Espresso', unitPrice: 75, quantity: 3 });

  assert.equal(cart.getItems().length, 1);
  assert.equal(cart.getItems()[0].quantity, 4);
  assert.equal(cart.getTotalPrice(), 300);
});

test('CartManager caps item quantity at 50', () => {
  const cart = new CartManager();
  cart.addItem({ menuItemId: 1, name: 'Espresso', unitPrice: 75, quantity: 45 });
  cart.addItem({ menuItemId: 1, name: 'Espresso', unitPrice: 75, quantity: 10 });

  assert.equal(cart.getItems()[0].quantity, 50);
});

test('CartManager updates quantity and removes on 0', () => {
  const cart = new CartManager();
  cart.addItem({ menuItemId: 1, name: 'Latte', unitPrice: 90, quantity: 2 });
  cart.updateQuantity(1, 5);
  assert.equal(cart.getItems()[0].quantity, 5);

  cart.updateQuantity(1, 0);
  assert.equal(cart.getItems().length, 0);
  assert.equal(cart.getTotalPrice(), 0);
});

test('CartManager calculates multi-item totals accurately', () => {
  const cart = new CartManager();
  cart.addItem({ menuItemId: 1, name: 'Latte', unitPrice: 90, quantity: 2 });
  cart.addItem({ menuItemId: 2, name: 'Cheesecake', unitPrice: 140, quantity: 1 });

  assert.equal(cart.getTotalCount(), 3);
  assert.equal(cart.getTotalPrice(), 320);

  cart.removeItem(1);
  assert.equal(cart.getItems().length, 1);
  assert.equal(cart.getTotalPrice(), 140);

  cart.clear();
  assert.equal(cart.getItems().length, 0);
  assert.equal(cart.getTotalPrice(), 0);
});
