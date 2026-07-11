import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { usePrinter } from '@/context/PrinterContext';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { usbListDevices } from '@/services/printer.service';
import type { UsbDevice } from '@/services/printer.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Printer, Wifi, WifiOff, CheckCircle, XCircle,
  ChevronLeft, Zap, RefreshCw, ChevronDown, Usb,
} from 'lucide-react-native';

const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED:   'Comanda nueva',
  ITEMS_ADDED:     'Ítems añadidos',
  ITEM_CANCELLED:  'Ítem cancelado',
  ORDER_MODIFIED:  'Orden modificada',
  TABLE_CHANGED:   'Cambio de mesa',
  PRE_BILL:        'Pre-cuenta',
  ORDER_CLOSED:    'Ticket de venta',
  DELIVERY_TICKET: 'Ticket delivery',
  CASH_OPEN:       'Apertura de caja',
  CASH_CLOSE:      'Cierre de caja',
  REPRINT:         'Reimpresión',
};

const ALL_EVENTS = Object.keys(EVENT_LABELS);

interface BackendPrinter {
  id: number;
  name: string;
  address: string;
  port: number;
  type: string;
  isActive: boolean;
  events: string[];
  orderTypes: string[];
  copies: number;
  locationName?: string;
}

export default function PrinterSetupScreen() {
  const { config, isActive, lastJobStatus, lastError, updateConfig, testConnection, printTestTicket } = usePrinter();
  const { user } = useAuth();
  const [testingConn, setTestingConn] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);
  const [printers, setPrinters] = useState<BackendPrinter[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(null);
  const [showPrinterPicker, setShowPrinterPicker] = useState(false);
  const [usbDevices, setUsbDevices] = useState<UsbDevice[]>([]);
  const [scanningUsb, setScanningUsb] = useState(false);

  const canReadPrinters = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    if (canReadPrinters) fetchPrinters();
  }, [canReadPrinters]);

  // Auto-select printer matching saved config.ip when printers load
  useEffect(() => {
    if (printers.length > 0 && config.ip && selectedPrinterId === null) {
      const match = printers.find(p => p.address === config.ip);
      if (match) setSelectedPrinterId(match.id);
    }
  }, [printers, config.ip]);

  const fetchPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const data = await api.getPrinters();
      setPrinters(Array.isArray(data) ? data.filter((p: BackendPrinter) => p.isActive) : []);
    } catch {
      // No permission or network error — manual mode only
    } finally {
      setLoadingPrinters(false);
    }
  };

  const scanUsbDevices = async () => {
    setScanningUsb(true);
    try {
      const devices = await usbListDevices();
      setUsbDevices(devices);
      if (devices.length === 0) Alert.alert('Sin dispositivos', 'No se detectó ningún dispositivo USB. Verifica que el cable esté conectado.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo escanear USB');
    } finally {
      setScanningUsb(false);
    }
  };

  const handleSelectUsbDevice = async (device: UsbDevice) => {
    await updateConfig({
      connectionType: 'usb',
      usbVendorId: device.vendorId,
      usbProductId: device.productId,
      usbProductName: device.productName || device.deviceName,
    });
  };

  const handleSelectPrinter = async (printer: BackendPrinter) => {
    setSelectedPrinterId(printer.id);
    setShowPrinterPicker(false);
    await updateConfig({
      ip: printer.address,
      port: printer.port || 9100,
      events: printer.events.length > 0 ? printer.events : ALL_EVENTS,
      orderTypes: printer.orderTypes || [],
      copies: printer.copies || 1,
    });
  };

  const handleTestConnection = async () => {
    if (!config.ip) { Alert.alert('Sin IP', 'Ingresa la IP de la impresora primero.'); return; }
    setTestingConn(true);
    try {
      const result = await testConnection();
      if (result.success) {
        Alert.alert('Conexión exitosa', `Impresora en ${config.ip}:${config.port} responde OK.`);
      } else {
        Alert.alert('Sin conexión', result.error || 'No se pudo conectar.');
      }
    } finally { setTestingConn(false); }
  };

  const handlePrintTest = async () => {
    if (!config.ip) { Alert.alert('Sin IP', 'Ingresa la IP de la impresora primero.'); return; }
    setTestingPrint(true);
    try {
      const result = await printTestTicket();
      if (result.success) {
        Alert.alert('Impresión OK', 'Ticket de prueba enviado correctamente.');
      } else {
        Alert.alert('Error de impresión', result.error || 'No se pudo imprimir.');
      }
    } finally { setTestingPrint(false); }
  };

  const statusColor =
    lastJobStatus === 'success' ? Colors.success :
    lastJobStatus === 'error'   ? Colors.danger  :
    lastJobStatus === 'printing'? Colors.accent  : Colors.textTertiary;

  const statusLabel =
    lastJobStatus === 'success' ? 'Impreso'        :
    lastJobStatus === 'error'   ? 'Error'           :
    lastJobStatus === 'printing'? 'Imprimiendo...' : 'En espera';

  const selectedPrinter = printers.find(p => p.id === selectedPrinterId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.text} />
        </Pressable>
        <Printer size={22} color={Colors.accent} />
        <Text style={styles.title}>Configurar impresora</Text>
      </View>

      {/* Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot}>
            {isActive ? <Wifi size={18} color={Colors.success} /> : <WifiOff size={18} color={Colors.textTertiary} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{isActive ? 'Bridge activo' : 'Bridge inactivo'}</Text>
            <Text style={styles.statusSub}>
              {isActive
                ? config.connectionType === 'usb'
                  ? `USB: ${config.usbProductName || 'Impresora conectada'}`
                  : `Escuchando en ${config.ip}:${config.port}`
                : config.enabled && config.connectionType === 'usb' && !config.usbVendorId
                  ? 'Falta seleccionar dispositivo USB'
                  : config.enabled && config.connectionType !== 'usb' && !config.ip
                    ? 'Falta configurar la IP'
                    : config.enabled
                      ? 'Sin conexión al servidor'
                      : 'Activa el toggle para habilitar'}
            </Text>
          </View>
          <Badge label={statusLabel} color={statusColor} />
        </View>
        {lastJobStatus === 'error' && lastError && (
          <View style={styles.errorBox}>
            <XCircle size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        )}
        {lastJobStatus === 'success' && (
          <View style={styles.successBox}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.successText}>Último job impreso correctamente</Text>
          </View>
        )}
      </Card>

      {/* Main toggle */}
      <Card style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Este dispositivo imprime</Text>
            <Text style={styles.sectionSub}>Recibe jobs vía socket y los envía por TCP a la impresora</Text>
          </View>
          <Switch
            value={config.enabled}
            onValueChange={val => updateConfig({ enabled: val })}
            trackColor={{ false: Colors.border, true: Colors.success + '60' }}
            thumbColor={config.enabled ? Colors.success : Colors.textTertiary}
          />
        </View>
      </Card>

      {config.enabled && (
        <>
          {/* Tipo de conexión */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de conexión</Text>
            <View style={styles.connTypeRow}>
              <Pressable
                style={[styles.connTypeBtn, config.connectionType !== 'usb' && styles.connTypeBtnActive]}
                onPress={() => updateConfig({ connectionType: 'tcp' })}
              >
                <Wifi size={16} color={config.connectionType !== 'usb' ? Colors.accent : Colors.textTertiary} />
                <Text style={[styles.connTypeLabel, config.connectionType !== 'usb' && styles.connTypeLabelActive]}>
                  WiFi / TCP
                </Text>
              </Pressable>
              <Pressable
                style={[styles.connTypeBtn, config.connectionType === 'usb' && styles.connTypeBtnActive]}
                onPress={() => updateConfig({ connectionType: 'usb' })}
              >
                <Usb size={16} color={config.connectionType === 'usb' ? Colors.accent : Colors.textTertiary} />
                <Text style={[styles.connTypeLabel, config.connectionType === 'usb' && styles.connTypeLabelActive]}>
                  USB OTG
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Sección USB */}
          {config.connectionType === 'usb' && (
            <Card style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Dispositivo USB</Text>
                  <Text style={styles.sectionSub}>Conecta la impresora por cable USB-C a USB-B</Text>
                </View>
                <Pressable onPress={scanUsbDevices} style={styles.refreshBtn}>
                  {scanningUsb
                    ? <ActivityIndicator size="small" color={Colors.accent} />
                    : <RefreshCw size={16} color={Colors.accent} />}
                </Pressable>
              </View>

              {config.usbVendorId ? (
                <View style={styles.usbSelected}>
                  <Usb size={16} color={Colors.success} />
                  <Text style={styles.usbSelectedText}>
                    {config.usbProductName || `VID:${config.usbVendorId} PID:${config.usbProductId}`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.sectionSub}>Sin impresora USB configurada. Presiona el botón para escanear.</Text>
              )}

              {usbDevices.length > 0 && (
                <View style={styles.printerList}>
                  {usbDevices.map((d, idx) => (
                    <Pressable
                      key={`${d.vendorId}-${d.productId}-${idx}`}
                      style={styles.printerItem}
                      onPress={() => handleSelectUsbDevice(d)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.printerName}>{d.productName || 'Dispositivo USB'}</Text>
                        <Text style={styles.printerAddr}>VID: 0x{d.vendorId.toString(16).toUpperCase().padStart(4, '0')} · PID: 0x{d.productId.toString(16).toUpperCase().padStart(4, '0')}</Text>
                        <Text style={styles.printerAddr}>{d.deviceName}</Text>
                      </View>
                      {config.usbVendorId === d.vendorId && config.usbProductId === d.productId && (
                        <CheckCircle size={16} color={Colors.success} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  title={scanningUsb ? 'Escaneando...' : 'Escanear dispositivos USB'}
                  onPress={scanUsbDevices}
                  variant="outline"
                  fullWidth
                  icon={scanningUsb ? undefined : Usb}
                  disabled={scanningUsb}
                />
                <Button
                  title={testingPrint ? 'Imprimiendo...' : 'Ticket de prueba (USB)'}
                  onPress={handlePrintTest}
                  variant="secondary"
                  fullWidth
                  icon={testingPrint ? undefined : Zap}
                  disabled={testingPrint || !config.usbVendorId}
                />
              </View>
            </Card>
          )}

          {/* Printer selector (TCP) — Admin/Manager only */}
          {config.connectionType !== 'usb' && canReadPrinters && (
            <Card style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Impresora del sistema</Text>
                  <Text style={styles.sectionSub}>Selecciona para autocompletar IP y eventos</Text>
                </View>
                <Pressable onPress={fetchPrinters} style={styles.refreshBtn}>
                  {loadingPrinters
                    ? <ActivityIndicator size="small" color={Colors.accent} />
                    : <RefreshCw size={16} color={Colors.accent} />}
                </Pressable>
              </View>

              <Pressable style={styles.pickerBtn} onPress={() => setShowPrinterPicker(!showPrinterPicker)}>
                <Printer size={16} color={selectedPrinter ? Colors.accent : Colors.textTertiary} />
                <Text style={[styles.pickerText, !selectedPrinter && styles.pickerPlaceholder]}>
                  {selectedPrinter ? `${selectedPrinter.name} — ${selectedPrinter.address}` : 'Seleccionar impresora...'}
                </Text>
                <ChevronDown size={16} color={Colors.textTertiary} />
              </Pressable>

              {showPrinterPicker && (
                <View style={styles.printerList}>
                  {printers.length === 0 && (
                    <Text style={styles.emptyText}>
                      {loadingPrinters ? 'Cargando...' : 'Sin impresoras activas en el sistema. Configúralas en la web.'}
                    </Text>
                  )}
                  {printers.map(p => (
                    <Pressable key={p.id} style={styles.printerItem} onPress={() => handleSelectPrinter(p)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.printerName}>{p.name}</Text>
                        <Text style={styles.printerAddr}>{p.address}:{p.port} · {p.copies} cop. · {p.events.length} eventos</Text>
                        {p.locationName && <Text style={styles.printerLocation}>{p.locationName}</Text>}
                      </View>
                      {selectedPrinterId === p.id && <CheckCircle size={16} color={Colors.success} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Connection TCP — solo en modo WiFi */}
          {config.connectionType !== 'usb' && <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Conexión TCP</Text>
            {!canReadPrinters && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>IP de la impresora</Text>
                  <TextInput
                    style={styles.input}
                    value={config.ip}
                    onChangeText={ip => updateConfig({ ip: ip.trim() })}
                    placeholder="192.168.1.100"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Puerto</Text>
                  <TextInput
                    style={styles.input}
                    value={String(config.port)}
                    onChangeText={p => { const n = parseInt(p, 10); if (!isNaN(n) && n > 0) updateConfig({ port: n }); }}
                    placeholder="9100"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}
            {canReadPrinters && config.ip ? (
              <Text style={styles.sectionSub}>{config.ip}:{config.port}</Text>
            ) : canReadPrinters ? (
              <Text style={styles.sectionSub}>Selecciona una impresora arriba para configurar la IP automáticamente.</Text>
            ) : null}
            <View style={styles.actions}>
              <Button title={testingConn ? 'Probando...' : 'Probar conexión'} onPress={handleTestConnection}
                variant="outline" fullWidth icon={testingConn ? undefined : Wifi} disabled={testingConn || testingPrint} />
              <Button title={testingPrint ? 'Imprimiendo...' : 'Ticket de prueba'} onPress={handlePrintTest}
                variant="secondary" fullWidth icon={testingPrint ? undefined : Zap} disabled={testingConn || testingPrint} />
            </View>
          </Card>}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxxl, maxWidth: 700, alignSelf: 'center' as const, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl, marginBottom: Spacing.sm },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.xs },
  title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, flex: 1 },

  statusCard: { gap: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  statusSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.dangerLight, padding: Spacing.sm, borderRadius: Radii.sm },
  errorText: { fontSize: FontSizes.sm, color: Colors.danger, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.successLight, padding: Spacing.sm, borderRadius: Radii.sm },
  successText: { fontSize: FontSizes.sm, color: Colors.success, flex: 1 },

  section: { gap: Spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  sectionSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  refreshBtn: { padding: Spacing.xs },

  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.sm, padding: Spacing.md, backgroundColor: Colors.inputBg },
  pickerText: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  pickerPlaceholder: { color: Colors.textTertiary },
  printerList: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.sm, overflow: 'hidden' },
  printerItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, backgroundColor: Colors.card },
  printerName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  printerAddr: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  printerLocation: { fontSize: FontSizes.xs, color: Colors.accent, marginTop: 1 },
  emptyText: { padding: Spacing.md, fontSize: FontSizes.sm, color: Colors.textTertiary, textAlign: 'center' },

  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  input: { borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSizes.md, color: Colors.text, backgroundColor: Colors.inputBg },

  actions: { gap: Spacing.md, marginTop: Spacing.sm },

  connTypeRow: { flexDirection: 'row', gap: Spacing.sm },
  connTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radii.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.inputBg },
  connTypeBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  connTypeLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textTertiary },
  connTypeLabelActive: { color: Colors.accent },

  usbSelected: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.successLight, padding: Spacing.sm, borderRadius: Radii.sm },
  usbSelectedText: { fontSize: FontSizes.sm, color: Colors.success, fontWeight: '600', flex: 1 },
});
