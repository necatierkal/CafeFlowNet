import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { MenuCategory } from '../../core/models';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="topbar">
      <h1>CafeFlow</h1>
      @if (authService.isLoggedIn()) {
        <a [routerLink]="authService.isAdmin() ? '/admin' : '/my'" class="cta">
          Go to my account →
        </a>
      } @else {
        <a routerLink="/login" class="cta">Loyal customer login →</a>
      }
    </header>

    @if (loading()) {
      <p class="status">Loading menu…</p>
    } @else if (categories().length === 0) {
      <p class="status">No menu items available right now. Please check back soon.</p>
    } @else {
      @for (category of categories(); track category.id) {
        <section class="category">
          <h2>{{ category.name }}</h2>
          <div class="grid">
            @for (item of category.items; track item.id) {
              <div class="card">
                @if (item.imageUrl) {
                  <img [src]="item.imageUrl" [alt]="item.name" />
                }
                <div class="card-body">
                  <div class="card-top">
                    <h3>{{ item.name }}</h3>
                    <span class="price">{{ item.price | number:'1.2-2' }}</span>
                  </div>
                  @if (item.description) {
                    <p class="desc">{{ item.description }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }
    }
  `,
  styles: [`
    .topbar { display:flex; justify-content:space-between; align-items:center;
      padding:1rem 1.5rem; border-bottom:1px solid #eee; }
    h1 { margin:0; font-size:1.4rem; }
    .cta { color:#1e5fa8; font-weight:500; font-size:0.9rem; text-decoration:none; }
    .status { padding:2rem; text-align:center; color:#777; }
    .category { padding:1.5rem; }
    .category h2 { margin:0 0 1rem; font-size:1.2rem; border-bottom:2px solid #1e5fa8;
      display:inline-block; padding-bottom:0.25rem; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1rem; }
    .card { border:1px solid #eee; border-radius:10px; overflow:hidden; background:white; }
    .card img { width:100%; height:140px; object-fit:cover; display:block; }
    .card-body { padding:0.85rem; }
    .card-top { display:flex; justify-content:space-between; align-items:baseline; gap:0.5rem; }
    .card-top h3 { margin:0; font-size:1rem; }
    .price { font-weight:600; color:#1e5fa8; white-space:nowrap; }
    .desc { margin:0.4rem 0 0; font-size:0.85rem; color:#777; }
  `]
})
export class MenuPageComponent implements OnInit {
  readonly categories = signal<MenuCategory[]>([]);
  readonly loading = signal(true);

  constructor(
    private menuService: MenuService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.menuService.getMenu().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
