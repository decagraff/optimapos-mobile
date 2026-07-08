// Ticket variable resolution — port from optimapos-desktop

function formatMoney(value: number | string | null | undefined): string {
  if (value == null) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' });
  } catch { return ''; }
}

export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' });
  } catch { return ''; }
}

export function resolveVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_m, key) => vars[key.trim()] ?? '');
}

function orderTypeLabel(type: string): string {
  if (type === 'DELIVERY') return 'Delivery';
  if (type === 'DINE_IN') return 'Mesa';
  return 'Recojo';
}

export function buildVarsFromOrder(order: any, storeName?: string): Record<string, string> {
  const v: Record<string, string> = {};
  v['tienda_nombre'] = storeName || '';
  v['tienda_ruc'] = '';
  v['tienda_direccion'] = '';
  v['tienda_telefono'] = '';
  v['local_nombre'] = '';
  if (order) {
    v['pedido_codigo'] = order.code || '';
    v['pedido_fecha'] = order.createdAt ? formatDate(order.createdAt) : '';
    v['pedido_hora'] = order.createdAt ? formatTime(order.createdAt) : '';
    v['pedido_tipo'] = orderTypeLabel(order.type || '');
    v['pedido_mesa'] = order.tableNumber || order.table?.name || '';
    v['pedido_notas'] = order.notes || '';
    v['pedido_notas_staff'] = order.staffNotes || '';
    v['cliente_nombre'] = order.user?.name || order.clientName || order.guestName || 'Cliente';
    v['cliente_telefono'] = order.user?.phone || order.clientPhone || order.guestPhone || '';
    v['cliente_direccion'] = order.clientAddress || order.guestAddress || '';
    v['pago_metodo'] = order.paymentMethod || '';
    v['pago_estado'] = order.paymentStatus || '';
    v['subtotal'] = formatMoney(order.subtotal);
    v['descuento'] = formatMoney(order.discount);
    v['delivery_fee'] = formatMoney(order.deliveryFee);
    v['total'] = formatMoney(order.total);
    v['cajero_nombre'] = order.vendorName || '';
    v['mozo_nombre'] = '';
  }
  if (order?.cashRegister) {
    const c = order.cashRegister;
    v['caja_apertura'] = formatMoney(c.openingAmount);
    v['caja_total'] = formatMoney(c.closingAmount);
    v['caja_total_ventas'] = formatMoney(c.totalSales);
    v['caja_num_ordenes'] = String(c.totalOrders || 0);
    v['cajero_nombre'] = c.userName || v['cajero_nombre'] || '';
    v['local_nombre'] = c.locationName || '';
  }
  v['fecha_actual'] = formatDate(new Date().toISOString());
  return v;
}

export function buildVarsFromData(data: Record<string, any>): Record<string, string> {
  const v = buildVarsFromOrder(data.order, '');
  if (data.cashRegister) {
    const c = data.cashRegister;
    v['caja_apertura'] = formatMoney(c.openingAmount);
    v['caja_total'] = formatMoney(c.closingAmount);
    v['caja_total_ventas'] = formatMoney(c.totalSales);
    v['caja_num_ordenes'] = String(c.totalOrders || 0);
    v['cajero_nombre'] = c.userName || v['cajero_nombre'] || '';
    v['local_nombre'] = c.locationName || '';
  }
  if (data.tableChange) {
    v['mesa_anterior'] = data.tableChange.from || '';
    v['mesa_nueva'] = data.tableChange.to || '';
  }
  return v;
}
