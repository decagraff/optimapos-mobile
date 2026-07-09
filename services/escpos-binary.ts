/**
 * ESC/POS Binary Renderer — Mobile port
 *
 * Converts a TicketTemplate + data directly into raw ESC/POS bytes.
 * No intermediate text — outputs number[] ready for the printer.
 *
 * Differences from desktop version:
 *  - No image/logo rendering (Canvas not available in React Native)
 *  - No external type imports — uses inline interfaces
 *  - formatMoney and getItemName defined inline
 */

import { resolveVariables as resolveVars, buildVarsFromOrder, buildVarsFromData, formatDate, formatTime } from '../utils/ticket-variables';

// ─── Inline helpers ──────────────────────────────────────────────────────────

function formatMoney(value: number | string | null | undefined): string {
  if (value == null) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

function getItemName(item: any): string {
  return item.product?.name || item.combo?.name || item.productName || item.name || 'Producto';
}

// ─── ESC/POS Constants ──────────────────────────────────────────────────────

const ESC = 0x1B;
const GS  = 0x1D;
const LF  = 0x0A;

// ─── Command Builders ───────────────────────────────────────────────────────

const cmd = {
  init:         [ESC, 0x40],
  cutPartial:   [GS, 0x56, 0x01],
  cutFull:      [GS, 0x56, 0x00],
  alignLeft:    [ESC, 0x61, 0x00],
  alignCenter:  [ESC, 0x61, 0x01],
  alignRight:   [ESC, 0x61, 0x02],
  boldOn:       [ESC, 0x45, 0x01],
  boldOff:      [ESC, 0x45, 0x00],
  underlineOn:  [ESC, 0x2D, 0x01],
  underlineOff: [ESC, 0x2D, 0x00],
  invertOn:     [GS, 0x42, 0x01],
  invertOff:    [GS, 0x42, 0x00],
  fontA:        [ESC, 0x4D, 0x00],
  fontB:        [ESC, 0x4D, 0x01],
  normalSize:   [GS, 0x21, 0x00],
  feedLines:    (n: number) => [ESC, 0x64, n],
  size:         (w: number, h: number) => [GS, 0x21, ((Math.min(w, 4) - 1) << 4) | (Math.min(h, 4) - 1)],
};

// ─── Text Encoding ──────────────────────────────────────────────────────────

function textBytes(text: string): number[] {
  const buf: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) {
      buf.push(code);
    } else {
      const map: Record<number, number> = {
        0xE1: 0xA0, // á
        0xE9: 0x82, // é
        0xED: 0xA1, // í
        0xF3: 0xA2, // ó
        0xFA: 0xA3, // ú
        0xF1: 0xA4, // ñ
        0xC1: 0x41, // Á → A
        0xC9: 0x45, // É → E
        0xCD: 0x49, // Í → I
        0xD3: 0x4F, // Ó → O
        0xDA: 0x55, // Ú → U
        0xD1: 0xA5, // Ñ
        0xBF: 0xA8, // ¿
        0xA1: 0xAD, // ¡
        0xFC: 0x81, // ü
        0xDC: 0x9A, // Ü
      };
      buf.push(map[code] || 0x3F); // ? for unknown
    }
  }
  return buf;
}

function line(text: string): number[] {
  return [...textBytes(text), LF];
}

// ─── Layout Helpers ─────────────────────────────────────────────────────────

function getLineWidth(templateWidth: number): number {
  return templateWidth === 80 ? 48 : 32;
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text.substring(0, width) : text + ' '.repeat(width - text.length);
}

function padCenter(text: string, width: number): string {
  if (text.length >= width) return text.substring(0, width);
  const pad = Math.floor((width - text.length) / 2);
  return ' '.repeat(pad) + text;
}

function rowText(left: string, right: string, width: number): string {
  const gap = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(gap) + right;
}

function separatorLine(style: string | undefined, width: number): string {
  switch (style) {
    case 'solid': return '_'.repeat(width);
    case 'double': return '='.repeat(width);
    case 'stars': return '*'.repeat(width);
    default: return '-'.repeat(width);
  }
}

// ─── Style Application ──────────────────────────────────────────────────────

function applyStyle(el: any): number[] {
  const bytes: number[] = [];

  const align = el.align || 'left';
  if (align === 'center') bytes.push(...cmd.alignCenter);
  else if (align === 'right') bytes.push(...cmd.alignRight);
  else bytes.push(...cmd.alignLeft);

  bytes.push(...(el.font === 'B' ? cmd.fontB : cmd.fontA));

  const w = el.scaleW || 1;
  const h = el.scaleH || 1;
  bytes.push(...cmd.size(w, h));

  bytes.push(...(el.bold ? cmd.boldOn : cmd.boldOff));
  bytes.push(...(el.underline ? cmd.underlineOn : cmd.underlineOff));
  bytes.push(...(el.invert ? cmd.invertOn : cmd.invertOff));

  return bytes;
}

function resetStyle(): number[] {
  return [
    ...cmd.alignLeft,
    ...cmd.fontA,
    ...cmd.normalSize,
    ...cmd.boldOff,
    ...cmd.underlineOff,
    ...cmd.invertOff,
  ];
}

// ─── Wrap Text ──────────────────────────────────────────────────────────────

function wrapText(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [text];
  if (text.length <= maxWidth) return [text];
  const result: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxWidth) {
      result.push(remaining);
      break;
    }
    let breakAt = remaining.lastIndexOf(' ', maxWidth);
    if (breakAt <= 0) {
      breakAt = maxWidth;
      result.push(remaining.substring(0, breakAt));
      remaining = remaining.substring(breakAt);
    } else {
      result.push(remaining.substring(0, breakAt));
      remaining = remaining.substring(breakAt + 1);
    }
  }
  return result;
}

function effectiveWidth(lw: number, scaleW: number): number {
  return Math.floor(lw / (scaleW || 1));
}

// ─── QR Code ────────────────────────────────────────────────────────────────

function qrCodeBytes(data: string, sizeLabel: string): number[] {
  const bytes: number[] = [];
  const dataBytes = textBytes(data);
  const len = dataBytes.length + 3;

  bytes.push(GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

  const sizeMap: Record<string, number> = { S: 3, M: 6, L: 10 };
  const moduleSize = sizeMap[sizeLabel] || 6;
  bytes.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize);

  bytes.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31);

  const pL = len & 0xFF;
  const pH = (len >> 8) & 0xFF;
  bytes.push(GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...dataBytes);

  bytes.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);

  return bytes;
}

// ─── Barcode ────────────────────────────────────────────────────────────────

function barcodeBytes(data: string, height?: number): number[] {
  const bytes: number[] = [];
  bytes.push(GS, 0x68, Math.min(height || 50, 255));
  bytes.push(GS, 0x77, 0x02);
  bytes.push(GS, 0x48, 0x02);
  const dataBytes = textBytes(data);
  bytes.push(GS, 0x6B, 0x49, dataBytes.length, ...dataBytes);
  return bytes;
}

// ─── Element Renderers ──────────────────────────────────────────────────────

function renderHeader(el: any, vars: Record<string, string>, lw: number): number[] {
  const content = resolveVars(el.content || '', vars);
  const ew = effectiveWidth(lw, el.scaleW || 1);
  const bytes: number[] = [...applyStyle(el)];
  const wrapped = wrapText(content, ew);
  for (const l of wrapped) {
    bytes.push(...line(l));
  }
  bytes.push(...resetStyle());
  return bytes;
}

function renderText(el: any, vars: Record<string, string>, lw: number): number[] {
  const content = resolveVars(el.content || '', vars);
  const ew = effectiveWidth(lw, el.scaleW || 1);
  const bytes: number[] = [...applyStyle(el)];
  const lines = content.split('\n');
  for (const l of lines) {
    const wrapped = wrapText(l, ew);
    for (const wl of wrapped) {
      bytes.push(...line(wl));
    }
  }
  bytes.push(...resetStyle());
  return bytes;
}

function renderSeparator(el: any, lw: number): number[] {
  const style = el.separatorStyle || 'dashed';
  return [...cmd.alignLeft, ...line(separatorLine(style, lw))];
}

function renderSpacer(el: any): number[] {
  const height = el.spacerHeight || 1;
  return cmd.feedLines(Math.min(height, 10));
}

function renderCut(el: any): number[] {
  const bytes: number[] = [...cmd.feedLines(3)];
  bytes.push(...(el.cutMode === 'full' ? cmd.cutFull : cmd.cutPartial));
  return bytes;
}

// Image rendering is not supported on mobile (no Canvas API)
async function renderImage(
  _el: any,
  _serverUrl: string,
  _templateWidth: number
): Promise<number[]> {
  return Promise.resolve([]);
}

function renderOrderInfo(el: any, order: any, lw: number): number[] {
  if (!order) return [];
  const ew = effectiveWidth(lw, el.scaleW || 1);
  const bytes: number[] = [...applyStyle(el)];

  const customerName = order.user?.name || order.clientName || order.guestName || 'Cliente';

  if (el.showTable !== false && (order.tableNumber || order.table?.name)) {
    bytes.push(...line(rowText('Mesa:', (order.tableNumber || order.table?.name || ''), ew)));
  }

  bytes.push(...line(rowText('Pedido:', '#' + (order.code || ''), ew)));
  bytes.push(...line(rowText('Fecha:', (order.createdAt ? formatDate(order.createdAt) + ' ' + formatTime(order.createdAt) : ''), ew)));
  bytes.push(...line(rowText('Cliente:', customerName, ew)));

  if (order.user?.phone || order.clientPhone || order.guestPhone) {
    bytes.push(...line(rowText('Tel:', (order.user?.phone || order.clientPhone || order.guestPhone), ew)));
  }
  if (order.clientAddress || order.guestAddress) {
    bytes.push(...line(rowText('Dir:', (order.clientAddress || order.guestAddress), ew)));
  }
  const tipo = order.type === 'DELIVERY' ? 'Delivery' : order.type === 'DINE_IN' ? 'Mesa' : 'Recojo';
  bytes.push(...line(rowText('Tipo:', tipo, ew)));

  if (order.notes) {
    const wrapped = wrapText('Nota: ' + order.notes, ew);
    for (const wl of wrapped) bytes.push(...line(wl));
  }

  bytes.push(...resetStyle());
  return bytes;
}

function renderItemsList(el: any, order: any, currencySymbol: string, lw: number): number[] {
  if (!order?.items) return [];
  const ew = effectiveWidth(lw, el.scaleW || 1);
  const bytes: number[] = [...applyStyle(el)];
  const showPrices = el.showPrices !== false;
  const showAddons = el.showAddons !== false;
  const showNotes = el.showNotes !== false;

  for (const item of order.items) {
    const name = getItemName(item);
    const qtyStr = item.quantity + ' x ' + name;

    if (showPrices) {
      const price = currencySymbol + formatMoney(item.totalPrice || item.unitPrice);
      const maxNameLen = ew - price.length - 1;
      const truncated = qtyStr.length > maxNameLen ? qtyStr.substring(0, maxNameLen) : qtyStr;
      bytes.push(...line(rowText(truncated, price, ew)));
    } else {
      const wrapped = wrapText(qtyStr, ew);
      for (const wl of wrapped) bytes.push(...line(wl));
    }

    if (showAddons && item.addons?.length > 0) {
      for (const addon of item.addons) {
        const aName = addon.name || addon.addon?.name || '';
        let addonText = '  + ' + aName;
        if (addon.quantity > 1) addonText += ' x' + addon.quantity;
        if (showPrices) {
          const addonPrice = Number(addon.price) || 0;
          addonText += addonPrice === 0 ? ' cortesia' : ' ' + currencySymbol + formatMoney(addon.price);
        }
        bytes.push(...line(addonText));
      }
    }

    if (showNotes && item.notes) {
      const wrapped = wrapText('  >> ' + item.notes, ew);
      for (const wl of wrapped) bytes.push(...line(wl));
    }
  }

  bytes.push(...resetStyle());
  return bytes;
}

function renderTotals(el: any, order: any, currencySymbol: string, lw: number): number[] {
  if (!order) return [];
  const ew = effectiveWidth(lw, el.scaleW || 1);
  const bytes: number[] = [...applyStyle(el)];
  const showSubtotal = el.showSubtotal !== false;
  const showDeliveryFee = el.showDeliveryFee !== false;
  const showDiscount = el.showDiscount !== false;

  if (showSubtotal) {
    bytes.push(...line(rowText('Subtotal:', currencySymbol + formatMoney(order.subtotal), ew)));
  }

  const deliveryFee = parseFloat(String(order.deliveryFee || 0));
  if (showDeliveryFee && deliveryFee > 0) {
    bytes.push(...line(rowText('Delivery:', currencySymbol + formatMoney(order.deliveryFee), ew)));
  }

  const discount = parseFloat(String(order.discount || 0));
  if (showDiscount && discount > 0) {
    bytes.push(...line(rowText('Descuento:', '-' + currencySymbol + formatMoney(order.discount), ew)));
  }

  bytes.push(...line(rowText('TOTAL:', currencySymbol + formatMoney(order.total), ew)));

  bytes.push(...resetStyle());
  return bytes;
}

function renderQrCode(el: any, vars: Record<string, string>): number[] {
  const data = resolveVars(el.content || '', vars);
  if (!data) return [];

  const align = el.align || 'center';
  const bytes: number[] = [];
  if (align === 'center') bytes.push(...cmd.alignCenter);
  else if (align === 'right') bytes.push(...cmd.alignRight);
  else bytes.push(...cmd.alignLeft);

  bytes.push(...qrCodeBytes(data, el.qrSize || 'M'));
  bytes.push(LF);
  bytes.push(...cmd.alignLeft);
  return bytes;
}

function renderBarcode(el: any, vars: Record<string, string>): number[] {
  const data = resolveVars(el.content || '', vars);
  if (!data) return [];

  const align = el.align || 'center';
  const bytes: number[] = [];
  if (align === 'center') bytes.push(...cmd.alignCenter);
  else if (align === 'right') bytes.push(...cmd.alignRight);
  else bytes.push(...cmd.alignLeft);

  bytes.push(...barcodeBytes(data, el.height));
  bytes.push(LF);
  bytes.push(...cmd.alignLeft);
  return bytes;
}

// ─── Main Renderer ──────────────────────────────────────────────────────────

export async function renderTemplateBinary(
  template: { width: number; content: any },
  order: any,
  vars: Record<string, string>,
  currencySymbol: string,
  serverUrl: string
): Promise<number[]> {
  const lw = getLineWidth(template.width);
  const elements: any[] = template.content?.elements || [];
  const bytes: number[] = [...cmd.init];

  for (const el of elements) {
    switch (el.type) {
      case 'header':
        bytes.push(...renderHeader(el, vars, lw));
        break;
      case 'text':
        bytes.push(...renderText(el, vars, lw));
        break;
      case 'separator':
        bytes.push(...renderSeparator(el, lw));
        break;
      case 'spacer':
        bytes.push(...renderSpacer(el));
        break;
      case 'cut':
        bytes.push(...renderCut(el));
        break;
      case 'image':
      case 'logo':
        bytes.push(...await renderImage(el, serverUrl, template.width));
        break;
      case 'order_info':
        bytes.push(...renderOrderInfo(el, order, lw));
        break;
      case 'items_list':
        bytes.push(...renderItemsList(el, order, currencySymbol, lw));
        break;
      case 'totals':
        bytes.push(...renderTotals(el, order, currencySymbol, lw));
        break;
      case 'qr_code':
        bytes.push(...renderQrCode(el, vars));
        break;
      case 'barcode':
        bytes.push(...renderBarcode(el, vars));
        break;
      default:
        break;
    }
  }

  const hasCut = elements.some((e: any) => e.type === 'cut');
  if (!hasCut) {
    bytes.push(...cmd.feedLines(4), ...cmd.cutPartial);
  }

  return bytes;
}

/**
 * Render a print job (from WebSocket) to raw ESC/POS bytes.
 */
export async function renderPrintJobBinary(
  job: { template: { width: number; content: any }; data: Record<string, any> },
  currencySymbol: string,
  serverUrl: string
): Promise<number[]> {
  const vars = buildVarsFromData(job.data);
  const order = job.data.order || null;
  return renderTemplateBinary(job.template, order, vars, currencySymbol, serverUrl);
}

/**
 * Render an order with a template to raw ESC/POS bytes.
 */
export async function renderOrderBinary(
  template: { width: number; content: any },
  order: any,
  currencySymbol: string,
  serverUrl: string,
  storeName?: string
): Promise<number[]> {
  const vars = buildVarsFromOrder(order, storeName);
  return renderTemplateBinary(template, order, vars, currencySymbol, serverUrl);
}
