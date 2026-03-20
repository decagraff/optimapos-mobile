import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  // Slate + Amber palette — professional, serious
  primary: '#1E293B',       // slate-800 — headers, buttons, tabs
  primaryDark: '#0F172A',   // slate-900
  primaryLight: '#F1F5F9',  // slate-100
  accent: '#F59E0B',        // amber-500 — highlights, badges, CTAs
  accentDark: '#D97706',    // amber-600
  accentLight: '#FFFBEB',   // amber-50
  success: '#059669',       // emerald-600
  successLight: '#ECFDF5',
  danger: '#DC2626',        // red-600
  dangerLight: '#FEF2F2',
  warning: '#D97706',       // amber-600
  warningLight: '#FFFBEB',
  info: '#2563EB',          // blue-600
  infoLight: '#EFF6FF',
  background: '#F8FAFC',    // slate-50
  card: '#FFFFFF',
  text: '#0F172A',          // slate-900
  textSecondary: '#475569', // slate-600
  textTertiary: '#94A3B8',  // slate-400
  border: '#E2E8F0',        // slate-200
  borderLight: '#F1F5F9',   // slate-100
  tabActive: '#1E293B',     // slate-800
  tabInactive: '#94A3B8',   // slate-400
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',   // slate-300
  inputFocus: '#1E293B',    // slate-800
  overlay: 'rgba(15,23,42,0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const Shadows = StyleSheet.create({
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as any,
  cardLg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as any,
});

export const OrderStatusColors: Record<string, string> = {
  PENDING: Colors.warning,
  CONFIRMED: Colors.info,
  PREPARING: Colors.accent,
  READY: Colors.success,
  DELIVERED: Colors.success,
  CANCELLED: Colors.danger,
};

export const TableStatusColors: Record<string, string> = {
  FREE: Colors.success,
  AVAILABLE: Colors.success,
  OCCUPIED: Colors.danger,
  RESERVED: Colors.info,
};
