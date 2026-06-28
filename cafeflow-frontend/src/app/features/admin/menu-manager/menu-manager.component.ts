import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../../core/services/menu.service';
import { MenuCategory, MenuItem } from '../../../core/models';

@Component({
  selector: 'app-menu-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Menu manager</h1>
      <p class="hint">Edit a price and press Enter or click away — it saves instantly and goes live on the public menu.</p>

      @if (savedItemId()) {
        <div class="toast">Saved ✓</div>
      }

      @for (category of categories(); track category.id) {
        <section class="category">
          <h2>{{ category.name }}</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of category.items; track item.id) {
                <tr [class.unavailable]="!item.isAvailable">
                  <td>
                    <strong>{{ item.name }}</strong>
                    @if (item.description) {
                      <div class="desc">{{ item.description }}</div>
                    }
                  </td>
                  <td>
                    <div class="price-edit">
                      <span>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        [value]="item.price"
                        (change)="updatePrice(item, $event)"
                      />
                    </div>
                  </td>
                  <td>
                    <label class="switch">
                      <input
                        type="checkbox"
                        [checked]="item.isAvailable"
                        (change)="toggleAvailability(item)"
                      />
                      <span class="slider"></span>
                    </label>
                  </td>
                  <td>
                    <button class="delete-btn" (click)="deleteItem(item)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <button class="add-btn" (click)="showAddForm.set(!showAddForm())">
        {{ showAddForm() ? 'Cancel' : '+ Add new item' }}
      </button>

      @if (showAddForm()) {
        <div class="add-form">
          <select [(ngModel)]="newItem.categoryId">
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
          <input type="text" placeholder="Item name" [(ngModel)]="newItem.name" />
          <input type="text" placeholder="Description (optional)" [(ngModel)]="newItem.description" />
          <input type="number" step="0.01" placeholder="Price" [(ngModel)]="newItem.price" />
          <button (click)="addItem()" [disabled]="!newItem.name || !newItem.price">Add item</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; max-width:900px; }
    h1 { margin:0 0 0.25rem; }
    .hint { color:#777; font-size:0.9rem; margin:0 0 1rem; }
    .toast { position:fixed; top:1rem; right:1rem; background:#1e7d4f; color:white;
      padding:0.5rem 1rem; border-radius:8px; font-size:0.9rem; }
    .category { margin-bottom:1.5rem; }
    .category h2 { font-size:1.1rem; margin:0 0 0.5rem; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; font-size:0.8rem; color:#888; padding:0.4rem; border-bottom:1px solid #eee; }
    td { padding:0.5rem 0.4rem; border-bottom:1px solid #f3f3f3; vertical-align:middle; }
    tr.unavailable td { opacity:0.45; }
    .desc { font-size:0.8rem; color:#999; }
    .price-edit { display:flex; align-items:center; gap:0.25rem; }
    .price-edit input { width:80px; padding:0.35rem; border:1px solid #ccc; border-radius:6px; }
    .switch { position:relative; display:inline-block; width:38px; height:22px; }
    .switch input { opacity:0; width:0; height:0; }
    .slider { position:absolute; inset:0; background:#ccc; border-radius:22px; cursor:pointer; transition:0.2s; }
    .slider::before { content:""; position:absolute; width:16px; height:16px; left:3px; top:3px;
      background:white; border-radius:50%; transition:0.2s; }
    .switch input:checked + .slider { background:#1e7d4f; }
    .switch input:checked + .slider::before { transform:translateX(16px); }
    .delete-btn { color:#c0392b; background:none; border:none; cursor:pointer; font-size:0.85rem; }
    .add-btn { margin-top:1rem; padding:0.6rem 1rem; border-radius:8px; border:1px solid #1e5fa8;
      background:white; color:#1e5fa8; font-weight:500; cursor:pointer; }
    .add-form { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:1rem; padding:1rem;
      background:#fafafa; border-radius:10px; }
    .add-form input, .add-form select { padding:0.5rem; border:1px solid #ccc; border-radius:6px; }
    .add-form button { padding:0.5rem 1rem; background:#1e5fa8; color:white; border:none;
      border-radius:6px; cursor:pointer; }
  `]
})
export class MenuManagerComponent implements OnInit {
  readonly categories = signal<MenuCategory[]>([]);
  readonly savedItemId = signal<number | null>(null);
  readonly showAddForm = signal(false);

  newItem = { categoryId: 0, name: '', description: '', price: null as number | null };

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.menuService.getMenuForAdmin().subscribe(categories => {
      this.categories.set(categories);
      if (categories.length && !this.newItem.categoryId) {
        this.newItem.categoryId = categories[0].id;
      }
    });
  }

  updatePrice(item: MenuItem, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (isNaN(value) || value <= 0) return;

    this.menuService.updateItem(item.id, { price: value }).subscribe(updated => {
      item.price = updated.price;
      this.flashSaved(item.id);
    });
  }

  toggleAvailability(item: MenuItem): void {
    this.menuService.toggleAvailability(item).subscribe(updated => {
      item.isAvailable = updated.isAvailable;
      this.flashSaved(item.id);
    });
  }

  deleteItem(item: MenuItem): void {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    this.menuService.deleteItem(item.id).subscribe(() => this.loadMenu());
  }

  addItem(): void {
    if (!this.newItem.name || !this.newItem.price) return;

    this.menuService.createItem({
      categoryId: this.newItem.categoryId,
      name: this.newItem.name,
      description: this.newItem.description || undefined,
      price: this.newItem.price,
      isAvailable: true,
      displayOrder: 0
    }).subscribe(() => {
      this.newItem = { categoryId: this.newItem.categoryId, name: '', description: '', price: null };
      this.showAddForm.set(false);
      this.loadMenu();
    });
  }

  private flashSaved(itemId: number): void {
    this.savedItemId.set(itemId);
    setTimeout(() => this.savedItemId.set(null), 1500);
  }
}
