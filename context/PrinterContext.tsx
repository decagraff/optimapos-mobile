import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { SocketContext } from './SocketContext';
import { printViaTCP } from '@/services/printer.service';
import { renderPrintJobBinary } from '@/services/escpos-binary';

const STORAGE_KEY = 'printer_config';
const CURRENCY_SYMBOL = 'S/';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

export interface PrinterBridgeConfig {
  enabled: boolean;       // Este device actua como bridge de impresion
  ip: string;
  port: number;
  copies: number;
  events: string[];       // Que eventos imprimir
}

const DEFAULT_CONFIG: PrinterBridgeConfig = {
  enabled: false,
  ip: '',
  port: 9100,
  copies: 1,
  events: ['ORDER_CREATED', 'ORDER_CLOSED', 'PRE_BILL'],
};

interface PrinterContextType {
  config: PrinterBridgeConfig;
  isActive: boolean;           // enabled + socket conectado + ip configurada
  lastJobStatus: 'idle' | 'printing' | 'success' | 'error';
  lastError: string | null;
  updateConfig: (patch: Partial<PrinterBridgeConfig>) => Promise<void>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  printTestTicket: () => Promise<{ success: boolean; error?: string }>;
}

export const PrinterContext = createContext<PrinterContextType>({
  config: DEFAULT_CONFIG,
  isActive: false,
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
  const configRef = useRef(config);

  // Keep ref in sync so socket listener always has latest config
  useEffect(() => { configRef.current = config; }, [config]);

  // Load config on mount
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          setConfig({ ...DEFAULT_CONFIG, ...saved });
        } catch {}
      }
    });
  }, []);

  const updateConfig = useCallback(async (patch: Partial<PrinterBridgeConfig>) => {
    const next = { ...configRef.current, ...patch };
    setConfig(next);
    configRef.current = next;
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // Core print execution
  const executePrintJob = useCallback(async (job: any) => {
    const cfg = configRef.current;
    if (!cfg.enabled || !cfg.ip || !cfg.events.includes(job.event)) return;

    setLastJobStatus('printing');
    setLastError(null);

    try {
      const serverUrl = ''; // No images in mobile
      const data = await renderPrintJobBinary(job, CURRENCY_SYMBOL, serverUrl);
      const copies = Math.max(1, Math.min(cfg.copies || 1, 5));

      let lastErr = '';
      for (let copy = 0; copy < copies; copy++) {
        let success = false;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const result = await printViaTCP({ ip: cfg.ip, port: cfg.port }, data);
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
    const { testTCPConnection } = await import('@/services/printer.service');
    return testTCPConnection(config.ip, config.port);
  }, [config.ip, config.port]);

  const printTestTicket = useCallback(async () => {
    const ESC = 0x1B; const GS = 0x1D; const LF = 0x0A;
    const tb = (s: string) => Array.from(s).map(c => c.charCodeAt(0) & 0xFF);
    const bytes: number[] = [
      ESC, 0x40,           // Init
      ESC, 0x61, 0x01,     // Center
      ESC, 0x45, 0x01,     // Bold on
      ...tb('OptimaPOS'), LF,
      ESC, 0x45, 0x00,     // Bold off
      ...tb('--- Ticket de prueba ---'), LF,
      ...tb(new Date().toLocaleString('es-PE')), LF,
      ...tb('Impresora conectada OK'), LF,
      LF, LF, LF,
      GS, 0x56, 0x01,      // Partial cut
    ];
    return printViaTCP({ ip: config.ip, port: config.port }, bytes);
  }, [config.ip, config.port]);

  const isActive = config.enabled && isConnected && config.ip.length > 0;

  return (
    <PrinterContext.Provider value={{ config, isActive, lastJobStatus, lastError, updateConfig, testConnection, printTestTicket }}>
      {children}
    </PrinterContext.Provider>
  );
}

export const usePrinter = () => useContext(PrinterContext);
