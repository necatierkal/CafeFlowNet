import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { UserRole } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      <!-- Container Card -->
      <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 transition-all">
        
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-md shadow-indigo-600/20">
            ☕
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">CafeFlow</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Restoran & Gurme Kahve Deneyimi</p>
        </div>

        <!-- Mode Tabs: Login vs Register -->
        <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
          <button (click)="isRegisterMode.set(false)"
                  [ngClass]="!isRegisterMode() ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'"
                  class="flex-1 py-2 text-xs rounded-xl transition-all">
            Giriş Yap
          </button>
          <button (click)="isRegisterMode.set(true)"
                  [ngClass]="isRegisterMode() ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'"
                  class="flex-1 py-2 text-xs rounded-xl transition-all">
            Yeni Kayıt Ol
          </button>
        </div>

        <!-- LOGIN FORM -->
        @if (!isRegisterMode()) {
          <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="space-y-4">
            
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">E-posta Adresi</label>
              <input type="email" 
                     formControlName="email" 
                     autocomplete="email"
                     placeholder="adiniz@ornek.com"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
                <span class="text-rose-500 text-[11px] block mt-1">Geçerli bir e-posta adresi giriniz.</span>
              }
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Şifre</label>
              <input [type]="showPassword() ? 'text' : 'password'" 
                     formControlName="password" 
                     autocomplete="current-password"
                     placeholder="••••••••"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" (change)="showPassword.set(!showPassword())" class="rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Şifreyi Göster</span>
              </label>
            </div>

            @if (errorMessage()) {
              <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {{ errorMessage() }}
              </div>
            }

            <button type="submit" 
                    [disabled]="loginForm.invalid || loading()"
                    class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
              @if (loading()) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Giriş Yapılıyor...</span>
              } @else {
                <span>Giriş Yap</span>
              }
            </button>

            <!-- Quick fill buttons for testing -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">Hızlı Giriş Seçenekleri</span>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" 
                        (click)="fillDemoAdmin()"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors">
                  🛡️ Yönetici Demo
                </button>
                <button type="button" 
                        (click)="fillDemoCustomer()"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors">
                  👤 Müşteri Demo
                </button>
              </div>
            </div>

          </form>
        }

        <!-- REGISTER FORM -->
        @if (isRegisterMode()) {
          <form [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="space-y-3.5">
            
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Adınız ve Soyadınız</label>
              <input type="text" 
                     formControlName="fullName" 
                     placeholder="Örn: Ahmet Yılmaz"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              @if (registerForm.get('fullName')?.touched && registerForm.get('fullName')?.invalid) {
                <span class="text-rose-500 text-[11px] block mt-1">Lütfen adınızı giriniz (en az 2 karakter).</span>
              }
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">E-posta Adresi</label>
              <input type="email" 
                     formControlName="email" 
                     placeholder="adiniz@ornek.com"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
                <span class="text-rose-500 text-[11px] block mt-1">Geçerli bir e-posta adresi giriniz.</span>
              }
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Telefon Numarası</label>
              <input type="tel" 
                     formControlName="phoneNumber" 
                     placeholder="0555 123 4567"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Şifre (En az 6 karakter)</label>
              <input type="password" 
                     formControlName="password" 
                     placeholder="••••••••"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                <span class="text-rose-500 text-[11px] block mt-1">Şifre en az 6 karakter olmalıdır.</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {{ errorMessage() }}
              </div>
            }

            <button type="submit" 
                    [disabled]="registerForm.invalid || loading()"
                    class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-2">
              @if (loading()) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Hesap Oluşturuluyor...</span>
              } @else {
                <span>Hesabımı Oluştur</span>
              }
            </button>
          </form>
        }

        <!-- Back to Home -->
        <div class="mt-6 text-center">
          <a routerLink="/" class="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            ← Menüye Geri Dön
          </a>
        </div>

      </div>

    </div>
  `
})
export class LoginComponent {
  readonly isRegisterMode = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private toastService: ToastService
  ) {}

  submitLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: response => {
        this.loading.set(false);
        this.toastService.success('Giriş Başarılı', `Hoş geldiniz, ${response.user.fullName}!`);
        const destination = response.user.role === UserRole.Admin ? '/admin' : '/my';
        this.router.navigate([destination]);
      },
      error: err => {
        this.loading.set(false);
        const msg = err.error?.message || 'E-posta veya şifre hatalı, ya da hesap devre dışı.';
        this.errorMessage.set(msg);
      }
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { fullName, email, phoneNumber, password } = this.registerForm.value;
    this.authService.register({
      fullName: fullName!,
      email: email!,
      phoneNumber: phoneNumber || undefined,
      password: password!
    }).subscribe({
      next: response => {
        this.loading.set(false);
        this.toastService.success('Kayıt Başarılı', 'Hesabınız oluşturuldu. Giriş yapıldı.');
        this.router.navigate(['/my']);
      },
      error: err => {
        this.loading.set(false);
        const msg = err.error?.message || 'Bu e-posta adresiyle kayıtlı bir hesap zaten bulunuyor.';
        this.errorMessage.set(msg);
      }
    });
  }

  fillDemoAdmin(): void {
    this.loginForm.patchValue({
      email: 'owner@cafeflow.com',
      password: 'Admin123!'
    });
  }

  fillDemoCustomer(): void {
    this.loginForm.patchValue({
      email: 'testcustomer@cafeflow.com',
      password: 'CustomerPass123!'
    });
  }
}
