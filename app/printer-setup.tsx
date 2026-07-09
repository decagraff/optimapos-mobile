import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { usePrinter } from '@/context/PrinterContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Printer, Wifi, WifiOff, CheckCircle, XCircle, ChevronLeft, Zap } from 'lucide-react-native';

const EVENT_OPTIONS = [
  { key: 'ORDER_CREATED',   label: 'Comanda nueva',          desc: 'Se crea una nueva orden' },
  { key: 'ITEMS_ADDED',     label: 'Ítems añadidos',         desc: 'Se agregan productos a una orden' },
  { key: 'ITEM_CANCELLED',  label: 'Ítem cancelado',         desc: 'Se cancela un producto' },
  { key: 'ORDER_MODIFIED',  label: 'Orden modificada',       desc: 'Cambios generales en la orden' },
  { key: 'TABLE_CHANGED',   label: 'Cambio de mesa',         desc: 'Se mueve la orden a otra mesa' },
  { key: 'PRE_BILL',        label: 'Pre-cuenta',             desc: 'Se solicita la cuenta' },
  { key: 'ORDER_CLOSED',    label: 'Ticket de venta',        desc: 'Orden cerrada / cobrada' },
  { key: 'DELIVERY_TICKET', label: 'Ticket delivery',        desc: 'Orden de delivery' },
  { key: 'CASH_OPEN',       label: 'Apertura de caja',       desc: 'Se abre la caja' },
  { key: 'CASH_CLOSE',      label: 'Cierre de caja',         desc: 'Se cierra la caja' },
  { key: 'REPRINT',         label: 'Reimpresión',            desc: 'Reimpresión manual' },
];

const ORDER_TYPE_OPTIONS = [
  { key: 'DINE_IN',   label: 'Mesa / Local' },
  { key: 'DELIVERY',  label: 'Delivery' },
  { key: 'TAKEAWAY',  label: 'Para llevar' },
];

export default function PrinterSetupScreen() {
  const { config, isActive, lastJobStatus, lastError, updateConfig, testConnection, printTestTicket } = usePrinter();
  const [testingConn, setTestingConn] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);

  const handleToggleEvent = async (key: string) => {
    const current = config.events || [];
    const next = current.includes(key) ? current.filter(e => e !== key) : [...current, key];
    await updateConfig({ events: next });
  };

  const handleToggleOrderType = async (key: string) => {
    const current = config.orderTypes || [];
    const next = current.includes(key) ? current.filter(t => t !== key) : [...current, key];
    await updateConfig({ orderTypes: next });
  };

  const handleSelectAllEvents = async () => {
    await updateConfig({ events: EVENT_OPTIONS.map(e => e.key) });
  };

  const handleClearAllEvents = async () => {
    await updateConfig({ events: [] });
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
                ? `Escuchando en ${config.ip}:${config.port}`
                : config.enabled && !config.ip ? 'Falta configurar la IP'
                : config.enabled ? 'Sin conexión al servidor'
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
          {/* Connection */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Conexión TCP</Text>
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
            <View style={styles.actions}>
              <Button title={testingConn ? 'Probando...' : 'Probar conexión'} onPress={handleTestConnection}
                variant="outline" fullWidth icon={testingConn ? undefined : Wifi} disabled={testingConn || testingPrint} />
              <Button title={testingPrint ? 'Imprimiendo...' : 'Ticket de prueba'} onPress={handlePrintTest}
                variant="secondary" fullWidth icon={testingPrint ? undefined : Zap} disabled={testingConn || testingPrint} />
            </View>
          </Card>

          {/* Copies */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Copias por job</Text>
            <Text style={styles.sectionSub}>Impresiones por cada evento recibido</Text>
            <View style={styles.copiesRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <Pressable key={n}
                  style={[styles.copyBtn, config.copies === n && styles.copyBtnActive]}
                  onPress={() => updateConfig({ copies: n })}>
                  <Text style={[styles.copyBtnText, config.copies === n && styles.copyBtnTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Events */}
          <Card style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Eventos a imprimir</Text>
                <Text style={styles.sectionSub}>Selecciona qué acciones disparan la impresión</Text>
              </View>
              <View style={styles.selectBtns}>
                <Pressable onPress={handleSelectAllEvents} style={styles.selectBtn}>
                  <Text style={styles.selectBtnText}>Todos</Text>
                </Pressable>
                <Pressable onPress={handleClearAllEvents} style={styles.selectBtn}>
                  <Text style={styles.selectBtnText}>Ninguno</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.eventList}>
              {EVENT_OPTIONS.map(opt => (
                <Pressable key={opt.key} style={styles.eventRow} onPress={() => handleToggleEvent(opt.key)}>
                  <View style={[styles.checkbox, config.events?.includes(opt.key) && styles.checkboxChecked]}>
                    {config.events?.includes(opt.key) && <CheckCircle size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventLabel}>{opt.label}</Text>
                    <Text style={styles.eventDesc}>{opt.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Order types */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Tipos de orden</Text>
            <Text style={styles.sectionSub}>Vacío = todos los tipos. Marca solo los que quieres imprimir.</Text>
            <View style={styles.eventList}>
              {ORDER_TYPE_OPTIONS.map(opt => (
                <Pressable key={opt.key} style={styles.eventRow} onPress={() => handleToggleOrderType(opt.key)}>
                  <View style={[styles.checkbox, (config.orderTypes || []).includes(opt.key) && styles.checkboxChecked]}>
                    {(config.orderTypes || []).includes(opt.key) && <CheckCircle size={14} color="#fff" />}
                  </View>
                  <Text style={styles.eventLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
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
  selectBtns: { flexDirection: 'row', gap: Spacing.xs, marginTop: 2 },
  selectBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radii.sm, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  selectBtnText: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },

  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  input: { borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSizes.md, color: Colors.text, backgroundColor: Colors.inputBg },

  copiesRow: { flexDirection: 'row', gap: Spacing.md },
  copyBtn: { width: 48, height: 48, borderRadius: Radii.sm, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  copyBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  copyBtnText: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.textSecondary },
  copyBtnTextActive: { color: Colors.accentDark },

  eventList: { gap: Spacing.xs },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  eventLabel: { fontSize: FontSizes.md, color: Colors.text, fontWeight: '600' },
  eventDesc: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },

  actions: { gap: Spacing.md, marginTop: Spacing.sm },
});
