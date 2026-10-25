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
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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
  isDeleted?: boolean;
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
  isDeleted?: boolean;
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
  categoryId?: number;
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

export interface UpdateMenuCategoryRequest {
  name?: string;
  displayOrder?: number;
  isActive?: boolean;
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
  idempotencyKey?: string;
}

export interface OrderItem {
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderStatusHistory {
  id: number;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedAt: string;
  changedByName?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  estimatedArrival?: string;
  totalAmount: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface CreateLoyalCustomerRequest {
  email: string;
  fullName: string;
  phoneNumber?: string;
  temporaryPassword: string;
}

export interface TopSellingItem {
  menuItemId: number;
  name: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface CategorySales {
  categoryName: string;
  itemsSold: number;
  revenue: number;
  percentage: number;
}

export interface DailySales {
  date: string;
  ordersCount: number;
  revenue: number;
}

export interface DashboardSummary {
  todayOrdersCount: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  todayRevenue: number;
  rangeRevenue: number;
  rangeOrdersCount: number;
  averageOrderValue: number;
  totalCustomersCount: number;
  topSellingItems: TopSellingItem[];
  categorySales: CategorySales[];
  dailySales: DailySales[];
}

export interface RestaurantSetting {
  id: number;
  restaurantName: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  openingHours?: string;
  isAcceptingOrders: boolean;
  minimumOrderAmount: number;
  updatedAt: string;
}

export interface UpdateRestaurantSettingRequest {
  restaurantName: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  openingHours?: string;
  isAcceptingOrders: boolean;
  minimumOrderAmount: number;
}
