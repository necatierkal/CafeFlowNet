import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      <!-- Top Navigation Header -->
      <div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a routerLink="/my" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              ←
            </a>
            <h1 class="text-xl font-black text-slate-900 dark:text-white">Profil & Güvenlik Ayarlarım</h1>
          </div>
          <button (click)="logout()" class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
            Çıkış Yap
          </button>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        <!-- Profile Info Card -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {{ (user()?.fullName || 'U').substring(0, 1).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ user()?.fullName }}</h2>
              <span class="text-xs text-slate-400 block">{{ user()?.email }}</span>
              <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                ⭐ Sadık Müşteri
              </span>
            </div>
          </div>

          <!-- Update Profile Form -->
          <form [formGroup]="profileForm" (ngSubmit)="submitProfile()" class="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 class="font-bold text-sm text-slate-900 dark:text-white">Kişisel Bilgileri Güncelle</h3>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Adınız ve Soyadınız</label>
              <input type="text" formControlName="fullName"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Telefon Numarası</label>
              <input type="tel" formControlName="phoneNumber"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <button type="submit" 
                    [disabled]="profileForm.invalid || updatingProfile()"
                    class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all">
              {{ updatingProfile() ? 'Kaydediliyor...' : 'Bilgileri Güncelle' }}
            </button>
          </form>
        </div>

        <!-- Change Password Card -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 class="font-bold text-sm text-slate-900 dark:text-white mb-2">Şifre Değiştir</h3>
          <p class="text-xs text-slate-500 mb-4">Hesap güvenliğiniz için şifrenizi düzenli aralıklarla güncellemenizi öneririz.</p>

          <form [formGroup]="passwordForm" (ngSubmit)="submitPassword()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mevcut Şifre</label>
              <input type="password" formControlName="currentPassword"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Yeni Şifre (En az 6 karakter)</label>
              <input type="password" formControlName="newPassword"
                     class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <button type="submit" 
                    [disabled]="passwordForm.invalid || changingPassword()"
                    class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all">
              {{ changingPassword() ? 'Şifre Güncelleniyor...' : 'Yeni Şifreyi Kaydet' }}
            </button>
          </form>
        </div>

      </div>

    </div>
  `
})
export class CustomerProfileComponent implements OnInit {
  readonly user = signal<User | null>(null);
  readonly updatingProfile = signal(false);
  readonly changingPassword = signal(false);

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['']
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe(u => {
      this.user.set(u);
      this.profileForm.patchValue({
        fullName: u.fullName,
        phoneNumber: u.phoneNumber || ''
      });
    });
  }

  submitProfile(): void {
    if (this.profileForm.invalid) return;
    this.updatingProfile.set(true);

    const { fullName, phoneNumber } = this.profileForm.value;
    this.authService.updateProfile({
      fullName: fullName!,
      phoneNumber: phoneNumber || undefined
    }).subscribe({
      next: u => {
        this.updatingProfile.set(false);
        this.user.set(u);
        this.toastService.success('Profil Güncellendi', 'Bilgileriniz başarıyla kaydedildi.');
      },
      error: () => {
        this.updatingProfile.set(false);
        this.toastService.error('Hata', 'Profil güncellenirken bir sorun oluştu.');
      }
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) return;
    this.changingPassword.set(true);

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword({
      currentPassword: currentPassword!,
      newPassword: newPassword!
    }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordForm.reset();
        this.toastService.success('Şifre Güncellendi', 'Lütfen yeni şifrenizle giriş yapınız.');
        this.router.navigate(['/login']);
      },
      error: err => {
        this.changingPassword.set(false);
        const msg = err.error?.message || 'Mevcut şifreniz hatalı.';
        this.toastService.error('Hata', msg);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Oturum Kapatıldı');
    this.router.navigate(['/']);
  }
}
