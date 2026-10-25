import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in-right"
             [ngClass]="{
               'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100': toast.type === 'success',
               'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100': toast.type === 'error',
               'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100': toast.type === 'warning',
               'bg-indigo-50/95 dark:bg-indigo-950/90 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100': toast.type === 'info'
             }">
          <div class="text-xl shrink-0 mt-0.5">
            @if (toast.type === 'success') { ✅ }
            @else if (toast.type === 'error') { ❌ }
            @else if (toast.type === 'warning') { ⚠️ }
            @else { ℹ️ }
          </div>
          <div class="flex-grow">
            <h4 class="font-bold text-sm leading-tight">{{ toast.title }}</h4>
            @if (toast.message) {
              <p class="text-xs mt-1 opacity-90 leading-relaxed">{{ toast.message }}</p>
            }
          </div>
          <button (click)="toastService.remove(toast.id)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors">
            ✕
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
