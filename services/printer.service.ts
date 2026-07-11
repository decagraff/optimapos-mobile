import TcpSocket from 'react-native-tcp-socket';
import { usbConnect, usbSendBytes, usbIsConnected, usbListDevices, usbDisconnect } from '../modules/usb-printer';
export { usbListDevices, usbConnect, usbDisconnect, usbIsConnected };
export type { UsbDevice } from '../modules/usb-printer';

export interface PrinterConfig {
  ip: string;
  port: number;
  name?: string;
}

export async function printViaTCP(
  config: PrinterConfig,
  data: number[],
  timeout = 8000
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: { success: boolean; error?: string }) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ success: false, error: `Timeout conectando a ${config.ip}:${config.port}` });
      client.destroy();
    }, timeout);

    const client = TcpSocket.createConnection(
      { host: config.ip, port: config.port },
      () => {
        clearTimeout(timer);
        const buffer = new Uint8Array(data);
        client.write(buffer as any, undefined, () => {
          setTimeout(() => {
            client.destroy();
            finish({ success: true });
          }, 500);
        });
      }
    );

    client.on('error', (err: Error) => {
      clearTimeout(timer);
      client.destroy();
      finish({ success: false, error: err.message });
    });
  });
}

export async function testTCPConnection(
  ip: string,
  port: number,
  timeout = 3000
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: { success: boolean; error?: string }) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };
    const timer = setTimeout(() => {
      finish({ success: false, error: 'Timeout' });
      client.destroy();
    }, timeout);
    const client = TcpSocket.createConnection({ host: ip, port }, () => {
      clearTimeout(timer);
      client.destroy();
      finish({ success: true });
    });
    client.on('error', (err: Error) => {
      clearTimeout(timer);
      client.destroy();
      finish({ success: false, error: err.message });
    });
  });
}

/**
 * Envía bytes ESC/POS a una impresora USB OTG.
 * Si la conexión previa sigue activa la reutiliza; si no, reconecta primero.
 */
export async function printViaUSB(
  vendorId: number,
  productId: number,
  data: number[]
): Promise<{ success: boolean; error?: string }> {
  const connected = await usbIsConnected();
  if (!connected) {
    const connectResult = await usbConnect(vendorId, productId);
    if (!connectResult.success) return connectResult;
  }
  return usbSendBytes(data);
}
