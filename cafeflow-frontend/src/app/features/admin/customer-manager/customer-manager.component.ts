import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, CreateLoyalCustomerRequest } from '../../../core/models';

@Component({
  selector: 'app-customer-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      <!-- Admin Top Navbar -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
              👥
            </div>
            <div>
              <span class="text-xl font-black text-slate-900 dark:text-white leading-none block">CafeFlow</span>
              <span class="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Müşteri & Sadakat Masası</span>
            </div>
          </div>

          <!-- Admin Nav Menu -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <a routerLink="/admin" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              📈 Genel Bakış
            </a>
            <a routerLink="/admin/orders" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              🔔 Canlı Siparişler
            </a>
            <a routerLink="/admin/menu" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              🍽️ Menü & Fiyatlar
            </a>
            <a routerLink="/admin/customers" class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm">
              👥 Müşteriler
            </a>
            <a routerLink="/admin/settings" class="px-3.5 py-1.5 rounded-xl font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              ⚙️ Ayarlar
            </a>
          </nav>

          <div class="flex items-center gap-3">
            <button (click)="themeService.toggleTheme()" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Tema Değiştir">
              {{ themeService.isDark() ? '☀️' : '🌙' }}
            </button>
            <button (click)="authService.logout()" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        
        <!-- Header Info & Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-black text-slate-900 dark:text-white">Müşteri Yönetimi</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kayıtlı ve sadakat müşterilerinin durumlarını, iletişim bilgilerini ve oturum yetkilerini yönetin.
            </p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <button (click)="openAddModal()" class="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2">
              <span>➕</span> Yeni Müşteri Tanımla
            </button>
          </div>
        </div>

        <!-- Metric Badges -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
              👥
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Toplam Müşteri</p>
              <p class="text-xl font-black text-slate-900 dark:text-white mt-0.5">{{ totalCount() }}</p>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
              🟢
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Aktif Hesaplar</p>
              <p class="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{{ activeCount() }}</p>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold">
              ⛔
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Pasif / Engelli Hesaplar</p>
              <p class="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{{ inactiveCount() }}</p>
            </div>
          </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div class="relative w-full sm:w-80">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchChange()"
              placeholder="İsim, e-posta veya telefon ile ara..." 
              class="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button 
              (click)="setStatusFilter('all')" 
              [class.bg-indigo-600]="statusFilter() === 'all'"
              [class.text-white]="statusFilter() === 'all'"
              [class.bg-slate-100]="statusFilter() !== 'all'"
              [class.dark:bg-slate-800]="statusFilter() !== 'all'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
              Tümü ({{ totalCount() }})
            </button>
            <button 
              (click)="setStatusFilter('active')" 
              [class.bg-emerald-600]="statusFilter() === 'active'"
              [class.text-white]="statusFilter() === 'active'"
              [class.bg-slate-100]="statusFilter() !== 'active'"
              [class.dark:bg-slate-800]="statusFilter() !== 'active'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
              Aktif ({{ activeCount() }})
            </button>
            <button 
              (click)="setStatusFilter('inactive')" 
              [class.bg-rose-600]="statusFilter() === 'inactive'"
              [class.text-white]="statusFilter() === 'inactive'"
              [class.bg-slate-100]="statusFilter() !== 'inactive'"
              [class.dark:bg-slate-800]="statusFilter() !== 'inactive'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
              Pasif ({{ inactiveCount() }})
            </button>
          </div>
        </div>

        <!-- Customer Table -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th class="py-3 px-4">Müşteri</th>
                  <th class="py-3 px-4">İletişim</th>
                  <th class="py-3 px-4">Kayıt Tarihi</th>
                  <th class="py-3 px-4">Son Giriş</th>
                  <th class="py-3 px-4 text-center">Durum</th>
                  <th class="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                @for (c of filteredCustomers(); track c.id) {
                  <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {{ getInitials(c.fullName) }}
                        </div>
                        <div>
                          <p class="font-bold text-slate-900 dark:text-white">{{ c.fullName }}</p>
                          <span class="inline-block text-[10px] font-semibold text-slate-400">{{ c.role }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="space-y-0.5">
                        <p class="text-slate-800 dark:text-slate-200 font-medium">{{ c.email }}</p>
                        <p class="text-[11px] text-slate-500">{{ c.phoneNumber || 'Telefon belirtilmemiş' }}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {{ c.createdAt | date:'dd MMM yyyy, HH:mm' }}
                    </td>
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {{ c.lastLoginAt ? (c.lastLoginAt | date:'dd MMM yyyy, HH:mm') : 'Giriş yapılmadı' }}
                    </td>
                    <td class="py-3 px-4 text-center">
                      @if (c.isActive) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          🟢 Aktif
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          ⛔ Pasif
                        </span>
                      }
                    </td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <!-- Toggle Status Button -->
                        <button 
                          (click)="toggleStatus(c)" 
                          [title]="c.isActive ? 'Hesabı dondur / pasife al' : 'Hesabı aktifleştir'"
                          [ngClass]="c.isActive 
                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30' 
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'"
                          class="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors">
                          {{ c.isActive ? 'Dondur' : 'Aktifleştir' }}
                        </button>

                        <!-- Remove Button -->
                        <button 
                          (click)="removeCustomer(c)" 
                          title="Sadakat durumunu kaldır"
                          class="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-400">
                      <div class="text-3xl mb-2">🔍</div>
                      <p class="font-bold text-slate-600 dark:text-slate-300 text-sm">Müşteri kaydı bulunamadı</p>
                      <p class="text-xs text-slate-400 mt-1">Arama teriminizi veya filtreleri değiştirerek tekrar deneyin.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <!-- Add Customer Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div class="flex justify-between items-center mb-5">
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Yeni Sadakat Müşterisi</h3>
              <button (click)="closeAddModal()" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <form (ngSubmit)="submitNewCustomer()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ad Soyad *</label>
                <input 
                  type="text" 
                  [(ngModel)]="newCustomer.fullName" 
                  name="fullName" 
                  required
                  placeholder="Örn: Ahmet Yılmaz" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-posta Adresi *</label>
                <input 
                  type="email" 
                  [(ngModel)]="newCustomer.email" 
                  name="email" 
                  required
                  placeholder="Örn: ahmet@example.com" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefon Numarası</label>
                <input 
                  type="tel" 
                  [(ngModel)]="newCustomer.phoneNumber" 
                  name="phoneNumber" 
                  placeholder="Örn: 05551234567" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">Geçici Parola *</label>
                  <button type="button" (click)="generateRandomPassword()" class="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Rastgele Üret
                  </button>
                </div>
                <input 
                  type="text" 
                  [(ngModel)]="newCustomer.temporaryPassword" 
                  name="temporaryPassword" 
                  required
                  placeholder="En az 6 karakter" 
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p class="text-[10px] text-slate-400 mt-1">Müşteri ilk giriş yaptığında parolasını değiştirmesi zorunlu tutulacaktır.</p>
              </div>

              <div class="flex items-center gap-3 pt-3">
                <button 
                  type="button" 
                  (click)="closeAddModal()" 
                  class="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  İptal
                </button>
                <button 
                  type="submit" 
                  [disabled]="isSubmitting() || !isFormValid()" 
                  class="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 transition-all">
                  {{ isSubmitting() ? 'Kaydediliyor...' : 'Kaydet' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class CustomerManagerComponent implements OnInit {
  readonly customers = signal<User[]>([]);
  readonly showAddModal = signal(false);
  readonly isSubmitting = signal(false);
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  searchQuery = '';

  newCustomer = {
    fullName: '',
    email: '',
    phoneNumber: '',
    temporaryPassword: ''
  };

  readonly totalCount = computed(() => this.customers().length);
  readonly activeCount = computed(() => this.customers().filter(c => c.isActive).length);
  readonly inactiveCount = computed(() => this.customers().filter(c => !c.isActive).length);

  readonly filteredCustomers = computed(() => {
    let list = this.customers();
    const query = this.searchQuery.toLowerCase().trim();

    if (this.statusFilter() === 'active') {
      list = list.filter(c => c.isActive);
    } else if (this.statusFilter() === 'inactive') {
      list = list.filter(c => !c.isActive);
    }

    if (query) {
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.phoneNumber && c.phoneNumber.includes(query))
      );
    }

    return list;
  });

  constructor(
    private customerService: CustomerService,
    public authService: AuthService,
    public themeService: ThemeService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getLoyalCustomers().subscribe({
      next: (data) => this.customers.set(data),
      error: () => this.toast.error('Müşteri listesi yüklenemedi.')
    });
  }

  onSearchChange(): void {
    // computed handles filtering reactivity
  }

  setStatusFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(filter);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  openAddModal(): void {
    this.generateRandomPassword();
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.newCustomer = { fullName: '', email: '', phoneNumber: '', temporaryPassword: '' };
  }

  generateRandomPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newCustomer.temporaryPassword = res;
  }

  isFormValid(): boolean {
    return !!(
      this.newCustomer.fullName.trim() &&
      this.newCustomer.email.trim() &&
      this.newCustomer.temporaryPassword.length >= 6
    );
  }

  submitNewCustomer(): void {
    if (!this.isFormValid()) return;
    this.isSubmitting.set(true);

    const dto: CreateLoyalCustomerRequest = {
      fullName: this.newCustomer.fullName.trim(),
      email: this.newCustomer.email.trim(),
      phoneNumber: this.newCustomer.phoneNumber.trim() || undefined,
      temporaryPassword: this.newCustomer.temporaryPassword
    };

    this.customerService.addLoyalCustomer(dto).subscribe({
      next: () => {
        this.toast.success('Müşteri başarıyla kaydedildi!');
        this.closeAddModal();
        this.loadCustomers();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.status === 409 ? 'Bu e-posta adresiyle kayıtlı bir müşteri zaten var.' : 'Müşteri eklenirken hata oluştu.';
        this.toast.error(msg);
      }
    });
  }

  toggleStatus(customer: User): void {
    const nextStatus = !customer.isActive;
    const actionText = nextStatus ? 'aktifleştirmek' : 'dondurmak / pasife almak';
    if (!confirm(`${customer.fullName} adlı müşterinin hesabını ${actionText} istediğinize emin misiniz?`)) return;

    this.customerService.toggleCustomerStatus(customer.id, nextStatus).subscribe({
      next: (updated) => {
        this.toast.success(`Hesap durumu ${updated.isActive ? 'Aktif' : 'Pasif'} olarak güncellendi.`);
        this.loadCustomers();
      },
      error: () => this.toast.error('Müşteri durumu güncellenirken hata oluştu.')
    });
  }

  removeCustomer(customer: User): void {
    if (!confirm(`${customer.fullName} adlı kullanıcının sadakat müşteri yetkisini kaldırmak istediğinize emin misiniz?`)) return;

    this.customerService.removeLoyalCustomer(customer.id).subscribe({
      next: () => {
        this.toast.success('Sadakat müşteri kaydı kaldırıldı.');
        this.loadCustomers();
      },
      error: () => this.toast.error('İşlem sırasında hata oluştu.')
    });
  }
}
