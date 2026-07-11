import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface UsbDevice {
  vendorId: number;
  productId: number;
  deviceName: string;
  productName: string;
}

export interface UsbResult {
  success: boolean;
  error?: string;
  bytesWritten?: number;
}

const UNSUPPORTED: UsbResult = {
  success: false,
  error: 'USB solo disponible en Android',
};

const Native = (() => {
  if (Platform.OS !== 'android') return null;
  try {
    return requireNativeModule('UsbPrinter');
  } catch {
    return null;
  }
})();

/**
 * Lista todos los dispositivos USB conectados al tablet.
 * Devuelve arreglo vacío en iOS o si no hay dispositivos.
 */
export async function usbListDevices(): Promise<UsbDevice[]> {
  if (!Native) return [];
  return Native.listDevices();
}

/**
 * Conecta a la impresora USB con vendorId + productId.
 * Si el permiso aún no fue otorgado, lanza el diálogo del sistema y espera.
 * La conexión queda abierta hasta llamar usbDisconnect().
 */
export async function usbConnect(vendorId: number, productId: number): Promise<UsbResult> {
  if (!Native) return UNSUPPORTED;
  return Native.connect(vendorId, productId);
}

/**
 * Envía bytes ESC/POS a la impresora ya conectada.
 * Los bytes se pasan como array de números (0-255).
 * Internamente se convierte a Base64 para el bridge nativo.
 */
export async function usbSendBytes(data: number[]): Promise<UsbResult> {
  if (!Native) return UNSUPPORTED;
  // Convertir number[] → base64 string para el bridge nativo
  let binary = '';
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i] & 0xff);
  return Native.sendBytes(btoa(binary));
}

/**
 * Cierra la conexión USB activa y libera la interfaz.
 */
export async function usbDisconnect(): Promise<void> {
  if (!Native) return;
  return Native.disconnect();
}

/**
 * Devuelve true si hay una conexión USB activa con una impresora.
 */
export async function usbIsConnected(): Promise<boolean> {
  if (!Native) return false;
  return Native.isConnected();
}
