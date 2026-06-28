import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-customer-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1>Loyal customers</h1>
      <p class="hint">Add a customer here so they can log in and order remotely.</p>

      <div class="add-form">
        <input type="text" placeholder="Full name" [(ngModel)]="newCustomer.fullName" />
        <input type="email" placeholder="Email" [(ngModel)]="newCustomer.email" />
        <input type="text" placeholder="Phone (optional)" [(ngModel)]="newCustomer.phoneNumber" />
        <input type="text" placeholder="Temporary password" [(ngModel)]="newCustomer.temporaryPassword" />
        <button (click)="addCustomer()" [disabled]="!canSubmit()">Add customer</button>
      </div>

      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }

      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Phone</th><th>Added on</th><th></th></tr>
        </thead>
        <tbody>
          @for (customer of customers(); track customer.id) {
            <tr>
              <td>{{ customer.fullName }}</td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.phoneNumber || '—' }}</td>
              <td>{{ customer.createdAt | date:'mediumDate' }}</td>
              <td><button class="remove-btn" (click)="removeCustomer(customer)">Remove</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page { padding:1.5rem; max-width:900px; }
    h1 { margin:0 0 0.25rem; }
    .hint { color:#777; font-size:0.9rem; margin:0 0 1rem; }
    .add-form { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.25rem;
      padding:1rem; background:#fafafa; border-radius:10px; }
    .add-form input { padding:0.55rem; border:1px solid #ccc; border-radius:6px; flex:1; min-width:150px; }
    .add-form button { padding:0.55rem 1rem; background:#1e5fa8; color:white; border:none;
      border-radius:6px; cursor:pointer; white-space:nowrap; }
    .add-form button:disabled { opacity:0.5; cursor:not-allowed; }
    .error { color:#c0392b; font-size:0.85rem; }
    table { width:100%; border-collapse:collapse; margin-top:0.5rem; }
    th { text-align:left; font-size:0.8rem; color:#888; padding:0.5rem; border-bottom:1px solid #eee; }
    td { padding:0.55rem 0.5rem; border-bottom:1px solid #f3f3f3; }
    .remove-btn { color:#c0392b; background:none; border:none; cursor:pointer; font-size:0.85rem; }
  `]
})
export class CustomerManagerComponent implements OnInit {
  readonly customers = signal<User[]>([]);
  readonly errorMessage = signal<string | null>(null);

  newCustomer = { fullName: '', email: '', phoneNumber: '', temporaryPassword: '' };

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  canSubmit(): boolean {
    return !!(this.newCustomer.fullName && this.newCustomer.email && this.newCustomer.temporaryPassword);
  }

  loadCustomers(): void {
    this.customerService.getLoyalCustomers().subscribe(customers => this.customers.set(customers));
  }

  addCustomer(): void {
    this.errorMessage.set(null);
    this.customerService.addLoyalCustomer({
      fullName: this.newCustomer.fullName,
      email: this.newCustomer.email,
      phoneNumber: this.newCustomer.phoneNumber || undefined,
      temporaryPassword: this.newCustomer.temporaryPassword
    }).subscribe({
      next: () => {
        this.newCustomer = { fullName: '', email: '', phoneNumber: '', temporaryPassword: '' };
        this.loadCustomers();
      },
      error: err => {
        this.errorMessage.set(
          err.status === 409 ? 'A user with this email already exists.' : 'Could not add customer.'
        );
      }
    });
  }

  removeCustomer(customer: User): void {
    if (!confirm(`Remove loyal status for ${customer.fullName}?`)) return;
    this.customerService.removeLoyalCustomer(customer.id).subscribe(() => this.loadCustomers());
  }
}
