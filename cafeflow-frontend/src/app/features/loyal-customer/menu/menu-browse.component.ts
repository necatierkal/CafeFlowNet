import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../../core/services/menu.service';
import { CartService } from '../../../core/services/cart.service';
import { MenuCategory, MenuItem } from '../../../core/models';

@Component({
  selector: 'app-menu-browse',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="topbar">
      <h1>Order ahead</h1>
      <a routerLink="/my/cart" class="cart-link">
        Cart ({{ cartService.itemCount() }}) — {{ cartService.total() | number:'1.2-2' }}
      </a>
    </header>

    @for (category of categories(); track category.id) {
      <section class="category">
        <h2>{{ category.name }}</h2>
        <div class="grid">
          @for (item of category.items; track item.id) {
            <div class="card">
              <div class="card-top">
                <h3>{{ item.name }}</h3>
                <span class="price">{{ item.price | number:'1.2-2' }}</span>
              </div>
              @if (item.description) {
                <p class="desc">{{ item.description }}</p>
              }
              <button (click)="cartService.addItem(item)">Add to cart</button>
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: [`
    .topbar { display:flex; justify-content:space-between; align-items:center;
      padding:1rem 1.5rem; border-bottom:1px solid #eee; position:sticky; top:0; background:white; }
    h1 { margin:0; font-size:1.3rem; }
    .cart-link { color:#1e5fa8; font-weight:500; text-decoration:none; font-size:0.9rem; }
    .category { padding:1.25rem 1.5rem; }
    .category h2 { font-size:1.1rem; margin:0 0 0.75rem; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; }
    .card { border:1px solid #eee; border-radius:10px; padding:0.85rem; display:flex; flex-direction:column; gap:0.4rem; }
    .card-top { display:flex; justify-content:space-between; align-items:baseline; gap:0.5rem; }
    .card-top h3 { margin:0; font-size:1rem; }
    .price { font-weight:600; color:#1e5fa8; white-space:nowrap; }
    .desc { margin:0; font-size:0.85rem; color:#777; flex:1; }
    button { padding:0.45rem; border:1px solid #1e5fa8; background:white; color:#1e5fa8;
      border-radius:6px; cursor:pointer; font-size:0.85rem; }
    button:hover { background:#1e5fa8; color:white; }
  `]
})
export class MenuBrowseComponent implements OnInit {
  readonly categories = signal<MenuCategory[]>([]);

  constructor(
    private menuService: MenuService,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    this.menuService.getMenu().subscribe(categories => this.categories.set(categories));
  }
}
