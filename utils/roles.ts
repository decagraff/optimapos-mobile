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
  ],
  CASHIER: [
    { name: 'pos', title: 'POS', icon: ShoppingCart },
    { name: 'orders', title: 'Pedidos', icon: ClipboardList },
    { name: 'cash', title: 'Caja', icon: Wallet },
  ],
  WAITER: [
    { name: 'menu', title: 'Menú', icon: UtensilsCrossed },
    { name: 'orders', title: 'Pedidos', icon: ClipboardList },
    { name: 'tables', title: 'Mesas', icon: Grid3X3 },
  ],
  KITCHEN: [
    { name: 'kitchen', title: 'Cocina', icon: ChefHat },
  ],
  DELIVERY: [
    { name: 'deliveries', title: 'Entregas', icon: Truck },
    { name: 'history', title: 'Historial', icon: History },
  ],
  CLIENT: [
    { name: 'menu', title: 'Menú', icon: UtensilsCrossed },
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
