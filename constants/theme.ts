import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FFF7ED',
  success: '#22C55E',
  successLight: '#F0FDF4',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  tabActive: '#F97316',
  tabInactive: '#6B7280',
  inputBg: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputFocus: '#F97316',
  overlay: 'rgba(0,0,0,0.5)',
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
  PREPARING: Colors.primary,
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
