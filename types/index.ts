export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'DELIVERY' | 'CLIENT';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  address?: string;
  locationId: number | null;
  locationIds: number[];
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  isMain: boolean;
  isActive: boolean;
}

export interface ServerConfig {
  slug: string;
  baseUrl: string;
  tenantHost: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// ─── Catalog ──────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Addon {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
  groupId: number;
}

export interface AddonGroup {
  id: number;
  name: string;
  type: 'ADDITION' | 'SUBSTITUTION';
  isActive: boolean;
  addons: Addon[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  ingredients?: string;
  price: number;
  image?: string;
  categoryId: number;
  category?: { id: number; name: string };
  isActive: boolean;
  sortOrder: number;
  promoPrice?: number | null;
  stockEnabled: boolean;
  stockCurrent: number | null;
  variants: ProductVariant[];
  addonGroups: { addonGroupId: number; addonGroup: AddonGroup }[];
}

// ─── Tables ───────────────────────────────────────────────────────────

export type TableStatus = 'FREE' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface Table {
  id: number;
  name: string;
  number: number;
  capacity: number;
  zone?: string;
  status: TableStatus;
  isActive: boolean;
  locationId: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────

export interface CartAddon {
  addonId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string; // unique key for the cart
  productId: number;
  productName: string;
  productImage?: string;
  variantId?: number;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  addons: CartAddon[];
}

// ─── Orders ───────────────────────────────────────────────────────────

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_PICKUP' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  product: { id: number; name: string; image?: string };
  variant?: { id: number; name: string } | null;
  addons: { addon: { id: number; name: string; price: number }; quantity: number }[];
}

export interface Order {
  id: number;
  code: string;
  type: OrderType;
  status: OrderStatus;
  kitchenStatus?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
  tableId?: number | null;
  table?: { id: number; name: string; number: number } | null;
  guestName?: string;
  guestPhone?: string;
  guestAddress?: string;
  user?: { name: string; phone: string; address?: string | null } | null;
  deliveryUser?: { id: number; name: string; phone: string } | null;
  deliveryUserId?: number | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
