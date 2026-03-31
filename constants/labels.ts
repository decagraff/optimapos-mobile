/** Centralized label dictionaries — single source of truth */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY_PICKUP: 'Listo',
  ON_THE_WAY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  READY_PICKUP: 'Listo para recoger',
  ON_THE_WAY: 'En camino',
  DELIVERED: 'Entregado',
};

export const TABLE_STATUS_LABELS: Record<string, string> = {
  FREE: 'Libre',
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
};

export const TYPE_LABELS: Record<string, string> = {
  DINE_IN: 'En mesa',
  PICKUP: 'Para llevar',
  TAKEAWAY: 'Para llevar',
  DELIVERY: 'Delivery',
};

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFER: 'Transferencia',
  IZIPAY: 'Izipay',
  CARD: 'Tarjeta',
};
