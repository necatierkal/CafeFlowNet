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
    <div class="min-h-screen bg-slate-50 font-sans pb-20">
      
      <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight">CafeFlow</h1>
          </div>
          
          @if (authService.isLoggedIn()) {
            <a [routerLink]="authService.isAdmin() ? '/admin' : '/my'" 
               class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg text-sm">
              Hesabıma Git →
            </a>
          } @else {
            <a routerLink="/login" 
               class="text-slate-600 hover:text-indigo-600 font-semibold transition-colors text-sm">
              Müşteri Girişi →
            </a>
          }
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-6 pt-10">
        @if (loading()) {
          <div class="flex justify-center items-center py-32">
            <div class="animate-pulse flex flex-col items-center">
              <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p class="text-slate-500 font-medium">Menü hazırlanıyor...</p>
            </div>
          </div>
        } 
        @else if (categories().length === 0) {
          <div class="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">
            <span class="text-6xl mb-4 block opacity-50">🍽️</span>
            <h3 class="text-xl font-bold text-slate-700 mb-2">Menü Şu An Boş</h3>
            <p class="text-slate-500 max-w-md mx-auto">Şu an menüde ürün bulunmuyor. Lütfen daha sonra tekrar kontrol edin.</p>
          </div>
        } 
        @else {
          @for (category of categories(); track category.id) {
            <section class="mb-16 animate-fade-in-up">
              
              <div class="mb-8 flex items-center gap-4">
                <h2 class="text-3xl font-extrabold text-slate-800">{{ category.name }}</h2>
                <div class="h-[2px] flex-grow bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                
                @for (item of category.items; track item.id) {
                  <div class="bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 group flex flex-col h-full cursor-pointer relative top-0 hover:-top-1">
                    
                    <div class="relative w-full h-48 rounded-3xl overflow-hidden mb-4 bg-gradient-to-br from-slate-100 to-slate-50">
                      @if (item.imageUrl) {
                        <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      } @else {
                        <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                          <svg class="w-12 h-12 mb-2 opacity-50 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      }
                      
                      </div>
                    
                    <div class="px-3 pb-2 flex flex-col flex-grow">
                      <div class="flex justify-between items-start gap-2 mb-2">
                        <h3 class="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{{ item.name }}</h3>
                      </div>
                      
                      @if (item.description) {
                        <p class="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{{ item.description }}</p>
                      }
                      
                      <div class="mt-auto flex justify-between items-center pt-2">
                        <span class="text-xl font-black text-slate-800">{{ item.price | number:'1.2-2' }} <span class="text-sm text-slate-400 font-medium">₺</span></span>
                        
                        <div class="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                      </div>
                    </div>

                  </div>
                }
                
              </div>
            </section>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* Yumuşak giriş animasyonu için ekstra CSS */
    .animate-fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
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