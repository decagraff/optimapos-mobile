import type { Role } from '@/types';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, BarChart3, Menu,
  Wallet, UtensilsCrossed, Grid3X3, ChefHat, Truck, History, User,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export interface TabDef {
  name: string;
  title: string;
  icon: LucideIcon;
}

export const TAB_CONFIG: Record<Role, TabDef[]> = {
  ADMIN: [
    { name: 'index', title: 'Dashboard', icon: LayoutDashboard },
    { name: 'pos', title: 'POS', icon: ShoppingCart },
    { name: 'orders', title: 'Pedidos', icon: ClipboardList },
    { name: 'reports', title: 'Reportes', icon: BarChart3 },
    { name: 'more', title: 'Más', icon: Menu },
  ],
  MANAGER: [
    { name: 'index', title: 'Dashboard', icon: LayoutDashboard },
    { name: 'pos', title: 'POS', icon: ShoppingCart },
    { name: 'orders', title: 'Pedidos', icon: ClipboardList },
    { name: 'reports', title: 'Reportes', icon: BarChart3 },
    { name: 'more', title: 'Más', icon: Menu },
  ],
  VENDOR: [
    { name: 'pos', title: 'POS', icon: ShoppingCart },
    { name: 'orders', title: 'Pedidos', icon: ClipboardList },
    { name: 'tables', title: 'Mesas', icon: Grid3X3 },
    { name: 'cash', title: 'Caja', icon: Wallet },
    { name: 'more', title: 'Más', icon: Menu },
  ],
  KITCHEN: [
    { name: 'kitchen', title: 'Cocina', icon: ChefHat },
    { name: 'more', title: 'Más', icon: Menu },
  ],
  DELIVERY: [
    { name: 'deliveries', title: 'Entregas', icon: Truck },
    { name: 'history', title: 'Historial', icon: History },
    { name: 'more', title: 'Más', icon: Menu },
  ],
  CLIENT: [
    { name: 'menu', title: 'Carta', icon: UtensilsCrossed },
    { name: 'orders', title: 'Pedidos', icon: ClipboardList },
    { name: 'profile', title: 'Perfil', icon: User },
  ],
};

// All possible tab screen names (must match file names in app/(tabs)/)
export const ALL_TAB_NAMES = [
  'index', 'pos', 'orders', 'reports', 'more',
  'cash', 'menu', 'tables', 'kitchen',
  'deliveries', 'history', 'profile',
];

// Default route per role (first tab the user should see)
export const DEFAULT_ROUTE: Record<Role, string> = {
  ADMIN: '/(tabs)',
  MANAGER: '/(tabs)',
  VENDOR: '/(tabs)/pos',
  KITCHEN: '/(tabs)/kitchen',
  DELIVERY: '/(tabs)/deliveries',
  CLIENT: '/(tabs)/menu',
};

// Allowed order status transitions per role (frontend enforcement)
export const ALLOWED_TRANSITIONS: Record<Role, Record<string, { status: string; label: string } | null>> = {
  ADMIN: {
    PENDING: { status: 'CONFIRMED', label: 'Confirmar' },
    CONFIRMED: { status: 'PREPARING', label: 'Preparando' },
    PREPARING: { status: 'READY_PICKUP', label: 'Listo' },
    READY_PICKUP: { status: 'DELIVERED', label: 'Entregado' },
  },
  MANAGER: {
    PENDING: { status: 'CONFIRMED', label: 'Confirmar' },
    CONFIRMED: { status: 'PREPARING', label: 'Preparando' },
    PREPARING: { status: 'READY_PICKUP', label: 'Listo' },
    READY_PICKUP: { status: 'DELIVERED', label: 'Entregado' },
  },
  VENDOR: {
    PENDING: { status: 'CONFIRMED', label: 'Confirmar' },
    READY_PICKUP: { status: 'DELIVERED', label: 'Entregado' },
  },
  KITCHEN: {},
  DELIVERY: {},
  CLIENT: {},
};
