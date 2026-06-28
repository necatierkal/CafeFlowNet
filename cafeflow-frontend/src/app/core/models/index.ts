export enum UserRole {
  Admin = 'Admin',
  LoyalCustomer = 'LoyalCustomer'
}

export enum OrderStatus {
  Received = 'Received',
  Preparing = 'Preparing',
  Ready = 'Ready',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface MenuCategory {
  id: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  displayOrder: number;
}

export interface CreateMenuItemRequest {
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  displayOrder: number;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  displayOrder?: number;
}

export interface CreateMenuCategoryRequest {
  name: string;
  displayOrder: number;
}

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

export interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  estimatedArrival?: string;
  notes?: string;
}

export interface OrderItem {
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  estimatedArrival?: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CreateLoyalCustomerRequest {
  email: string;
  fullName: string;
  phoneNumber?: string;
  temporaryPassword: string;
}
