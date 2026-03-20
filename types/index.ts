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
