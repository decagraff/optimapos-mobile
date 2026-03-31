import { Colors } from '../constants/theme';
import type { Order } from '../types';

/** Minutes elapsed since a given date string */
export function minutesSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

/** Human-readable time ago label */
export function timeAgo(dateStr: string): string {
  const mins = minutesSince(dateStr);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

/** Short timer label (for kitchen/delivery) */
export function timerLabel(mins: number): string {
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

/** Timer color based on elapsed minutes (green < 5, yellow < 10, red >= 10) */
export function timerColor(mins: number): string {
  if (mins < 5) return Colors.success;
  if (mins < 10) return Colors.warning;
  return Colors.danger;
}

/** Format number as currency (S/ 0.00) */
export function fmt(n: number): string {
  return `S/ ${(Number(n) || 0).toFixed(2)}`;
}

/** Format date string to time only (HH:MM) */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

/** Format date string to short date (DD Mon) */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

/** Today's date as YYYY-MM-DD in Lima timezone */
export function todayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

/** Date N days ago as YYYY-MM-DD in Lima timezone */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

/** Percentage change calculator */
export function pctChange(current: number, prev: number): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (!prev) return { value: 0, direction: 'flat' };
  const pct = ((current - prev) / prev) * 100;
  return { value: Math.abs(Math.round(pct)), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

/** Get customer display name from order */
export function getCustomerName(order: Order): string {
  return order.guestName || order.user?.name || 'Cliente';
}

/** Get customer phone from order */
export function getCustomerPhone(order: Order): string | null {
  return order.guestPhone || order.user?.phone || null;
}

/** Get customer address from order */
export function getCustomerAddress(order: Order): string | null {
  return order.guestAddress || order.user?.address || null;
}
