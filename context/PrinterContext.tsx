import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { SocketContext } from './SocketContext';
import { printViaTCP, printViaUSB, testTCPConnection } from '@/services/printer.service';
import { renderPrintJobBinary } from '@/services/escpos-binary';

const STORAGE_KEY = 'printer_config';
const DEVICE_ID_KEY = 'printer_device_id';
const CURRENCY_SYMBOL = 'S/';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;
const DEDUP_TTL = 60_000; // ignore duplicate jobIds within 60s
const CLAIM_TIMEOUT = 3000; // ms to wait for claim response

function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'mob_';
  for (let i = 0; i < 20; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export interface PrinterBridgeConfig {
  enabled: boolean;
  connectionType: 'tcp' | 'usb';
  // TCP
  ip: string;
  port: number;
  // USB
  usbVendorId?: number;
  usbProductId?: number;
  usbProductName?: string;
  copies: number;
  events: string[];
  orderTypes: string[]; // empty = all types
}

const DEFAULT_CONFIG: PrinterBridgeConfig = {
  enabled: false,
  connectionType: 'tcp',
  ip: '',
  port: 9100,
  copies: 1,
  events: ['ORDER_CREATED', 'ORDER_CLOSED', 'PRE_BILL'],
  orderTypes: [],
};

interface PrinterContextType {
  config: PrinterBridgeConfig;
  isActive: boolean;
  printerReady: boolean;
  lastJobStatus: 'idle' | 'printing' | 'success' | 'error';
  lastError: string | null;
  updateConfig: (patch: Partial<PrinterBridgeConfig>) => Promise<void>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  printTestTicket: () => Promise<{ success: boolean; error?: string }>;
}

export const PrinterContext = createContext<PrinterContextType>({
  config: DEFAULT_CONFIG,
  isActive: false,
  printerReady: false,
  lastJobStatus: 'idle',
  lastError: null,
  updateConfig: async () => {},
  testConnection: async () => ({ success: false }),
  printTestTicket: async () => ({ success: false }),
});

export function PrinterProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useContext(SocketContext);
  const [config, setConfig] = useState<PrinterBridgeConfig>(DEFAULT_CONFIG);
  const [lastJobStatus, setLastJobStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [printerReady, setPrinterReady] = useState(false);
  const configRef = useRef(config);
  const recentJobs = useRef<Map<string, number>>(new Map()); // jobId -> timestamp
  const deviceIdRef = useRef<string>('');

  useEffect(() => { configRef.current = config; }, [config]);

  // Load config + deviceId on mount, then auto-test printer
  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          const loaded = { ...DEFAULT_CONFIG, ...saved };
          setConfig(loaded);
          // Auto-test in background — don't block startup
          if (loaded.enabled) {
            if (loaded.connectionType === 'usb' && loaded.usbVendorId) {
              // USB: we can't test without prompting — just mark ready optimistically
              setPrinterReady(true);
            } else if (loaded.ip) {
              testTCPConnection(loaded.ip, loaded.port)
                .then(r => setPrinterReady(r.success))
                .catch(() => setPrinterReady(false));
            }
          }
        } catch {}
      }
      let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = generateDeviceId();
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      }
      deviceIdRef.current = deviceId;
    })();
  }, []);

  const updateConfig = useCallback(async (patch: Partial<PrinterBridgeConfig>) => {
    const next = { ...configRef.current, ...patch };
    setConfig(next);
    configRef.current = next;
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    // Re-test when config changes
    if (next.enabled) {
      if (next.connectionType === 'usb' && next.usbVendorId) {
        setPrinterReady(true);
      } else if (next.connectionType === 'tcp' && next.ip) {
        testTCPConnection(next.ip, next.port)
          .then(r => setPrinterReady(r.success))
          .catch(() => setPrinterReady(false));
      } else {
        setPrinterReady(false);
      }
    } else {
      setPrinterReady(false);
    }
  }, []);

  const executePrintJob = useCallback(async (job: any) => {
    const cfg = configRef.current;
    const isTCP = cfg.connectionType !== 'usb';
    if (!cfg.enabled) return;
    if (isTCP && !cfg.ip) return;
    if (!isTCP && !cfg.usbVendorId) return;

    // Filter by printer IP (TCP only) — skip if job targets a different printer
    if (isTCP && cfg.ip && job.printer?.address && job.printer.address !== cfg.ip) return;

    // Deduplicate — skip if we processed this jobId recently
    const now = Date.now();
    const seen = recentJobs.current;
    if (seen.has(job.jobId)) return;
    seen.set(job.jobId, now);
    // Clean old entries
    for (const [id, ts] of seen) {
      if (now - ts > DEDUP_TTL) seen.delete(id);
    }

    // Claim the job — only one device should print per job
    if (socket && deviceIdRef.current) {
      const granted = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), CLAIM_TIMEOUT);
        socket.emit('claim_print_job', { jobId: job.jobId, deviceId: deviceIdRef.current }, (resp: { granted: boolean }) => {
          clearTimeout(timer);
          resolve(resp?.granted ?? false);
        });
      });
      if (!granted) return;
    }

    setLastJobStatus('printing');
    setLastError(null);

    try {
      const data = await renderPrintJobBinary(job, CURRENCY_SYMBOL, '');
      // Prefer copies from backend printer config, fallback to local
      const copies = Math.max(1, Math.min(job.rule?.copies || cfg.copies || 1, 5));

      let lastErr = '';
      for (let copy = 0; copy < copies; copy++) {
        let success = false;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const result = isTCP
              ? await printViaTCP({ ip: cfg.ip, port: cfg.port }, data)
              : await printViaUSB(cfg.usbVendorId!, cfg.usbProductId!, data);
          if (result.success) { success = true; break; }
          lastErr = result.error || 'Error desconocido';
          if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAY));
        }
        if (!success) {
          setLastJobStatus('error');
          setLastError(lastErr);
          socket?.emit('mobile_print_ack', { jobId: job.jobId, status: 'error', error: lastErr });
          return;
        }
      }

      setLastJobStatus('success');
      socket?.emit('mobile_print_ack', { jobId: job.jobId, status: 'printed' });
      setTimeout(() => setLastJobStatus('idle'), 3000);
    } catch (err: any) {
      setLastJobStatus('error');
      setLastError(err.message);
      socket?.emit('mobile_print_ack', { jobId: job.jobId, status: 'error', error: err.message });
    }
  }, [socket]);

  // Socket listener
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = (job: any) => { executePrintJob(job); };
    socket.on('print_job', handler);
    return () => { socket.off('print_job', handler); };
  }, [socket, isConnected, executePrintJob]);

  const testConnection = useCallback(async () => {
    if (config.connectionType === 'usb') {
      if (!config.usbVendorId) return { success: false, error: 'Sin dispositivo USB configurado' };
      // Intentar conectar (sin enviar bytes) — verifica que el dispositivo responde
      const { usbConnect: connectUsb } = await import('@/services/printer.service');
      const result = await connectUsb(config.usbVendorId, config.usbProductId!);
      setPrinterReady(result.success);
      return result;
    }
    const result = await testTCPConnection(config.ip, config.port);
    setPrinterReady(result.success);
    return result;
  }, [config]);

  const printTestTicket = useCallback(async () => {
    const ESC = 0x1B; const GS = 0x1D; const LF = 0x0A;
    const tb = (s: string) => Array.from(s).map(c => c.charCodeAt(0) & 0xFF);
    const bytes: number[] = [
      ESC, 0x40,
      ESC, 0x61, 0x01,
      ESC, 0x45, 0x01,
      ...tb('OptimaPOS'), LF,
      ESC, 0x45, 0x00,
      ...tb('--- Ticket de prueba ---'), LF,
      ...tb(new Date().toLocaleString('es-PE')), LF,
      ...tb('Impresora conectada OK'), LF,
      LF, LF, LF,
      GS, 0x56, 0x01,
    ];
    if (config.connectionType === 'usb') {
      if (!config.usbVendorId) return { success: false, error: 'Sin dispositivo USB configurado' };
      return printViaUSB(config.usbVendorId, config.usbProductId!, bytes);
    }
    return printViaTCP({ ip: config.ip, port: config.port }, bytes);
  }, [config]);

  const isActive =
    config.enabled &&
    isConnected &&
    (config.connectionType === 'usb'
      ? !!config.usbVendorId
      : config.ip.length > 0);

  return (
    <PrinterContext.Provider value={{ config, isActive, printerReady, lastJobStatus, lastError, updateConfig, testConnection, printTestTicket }}>
      {children}
    </PrinterContext.Provider>
  );
}

export const usePrinter = () => useContext(PrinterContext);
