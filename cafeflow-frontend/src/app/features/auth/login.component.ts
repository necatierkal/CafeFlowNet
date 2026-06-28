import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-wrap">
      <form class="login-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>CafeFlow</h1>
        <p class="subtitle">Sign in to your account</p>

        <label>Email</label>
        <input type="email" formControlName="email" autocomplete="email" />

        <label>Password</label>
        <input type="password" formControlName="password" autocomplete="current-password" />

        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        <button type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Signing in…' : 'Sign in' }}
        </button>

        <a routerLink="/" class="back-link">← Back to menu</a>
      </form>
    </div>
  `,
  styles: [`
    .login-wrap { display:flex; justify-content:center; align-items:center; min-height:80vh; padding:1rem; }
    .login-card { width:100%; max-width:360px; display:flex; flex-direction:column; gap:0.75rem;
      border:1px solid #e2e2e2; border-radius:12px; padding:2rem; }
    h1 { margin:0; font-size:1.5rem; }
    .subtitle { margin:0 0 0.5rem; color:#666; font-size:0.9rem; }
    label { font-size:0.85rem; font-weight:500; }
    input { padding:0.6rem; border:1px solid #ccc; border-radius:8px; font-size:1rem; }
    button { margin-top:0.5rem; padding:0.7rem; border:none; border-radius:8px;
      background:#1e5fa8; color:white; font-weight:500; cursor:pointer; }
    button:disabled { opacity:0.6; cursor:not-allowed; }
    .error { color:#c0392b; font-size:0.85rem; margin:0; }
    .back-link { text-align:center; font-size:0.85rem; color:#666; margin-top:0.5rem; text-decoration:none; }
  `]
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.value;
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: response => {
        this.loading.set(false);
        const destination = response.user.role === UserRole.Admin ? '/admin' : '/my';
        this.router.navigate([destination]);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Incorrect email or password. Please try again.');
      }
    });
  }
}
