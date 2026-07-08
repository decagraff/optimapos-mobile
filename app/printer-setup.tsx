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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { usePrinter } from '@/context/PrinterContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Printer, Wifi, WifiOff, CheckCircle, XCircle, ChevronLeft, Zap } from 'lucide-react-native';

const EVENT_OPTIONS = [
  { key: 'ORDER_CREATED', label: 'Comanda (nueva orden)' },
  { key: 'ORDER_CLOSED',  label: 'Ticket de venta' },
  { key: 'PRE_BILL',      label: 'Pre-cuenta' },
];

export default function PrinterSetupScreen() {
  const { config, isActive, lastJobStatus, lastError, updateConfig, testConnection, printTestTicket } = usePrinter();

  const [testingConn, setTestingConn] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);

  const handleToggleEnabled = async (val: boolean) => {
    await updateConfig({ enabled: val });
  };

  const handleToggleEvent = async (eventKey: string) => {
    const current = config.events || [];
    const next = current.includes(eventKey)
      ? current.filter(e => e !== eventKey)
      : [...current, eventKey];
    await updateConfig({ events: next });
  };

  const handleTestConnection = async () => {
    if (!config.ip) {
      Alert.alert('Sin IP', 'Ingresa la IP de la impresora primero.');
      return;
    }
    setTestingConn(true);
    try {
      const result = await testConnection();
      if (result.success) {
        Alert.alert('Conexion exitosa', `Impresora en ${config.ip}:${config.port} responde OK.`);
      } else {
        Alert.alert('Sin conexion', result.error || 'No se pudo conectar.');
      }
    } finally {
      setTestingConn(false);
    }
  };

  const handlePrintTest = async () => {
    if (!config.ip) {
      Alert.alert('Sin IP', 'Ingresa la IP de la impresora primero.');
      return;
    }
    setTestingPrint(true);
    try {
      const result = await printTestTicket();
      if (result.success) {
        Alert.alert('Impresion OK', 'Ticket de prueba enviado correctamente.');
      } else {
        Alert.alert('Error de impresion', result.error || 'No se pudo imprimir.');
      }
    } finally {
      setTestingPrint(false);
    }
  };

  const statusColor =
    lastJobStatus === 'success' ? Colors.success :
    lastJobStatus === 'error'   ? Colors.danger :
    lastJobStatus === 'printing'? Colors.accent :
    Colors.textTertiary;

  const statusLabel =
    lastJobStatus === 'success' ? 'Impreso' :
    lastJobStatus === 'error'   ? 'Error' :
    lastJobStatus === 'printing'? 'Imprimiendo...' :
    'En espera';

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

      {/* Bridge status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot}>
            {isActive
              ? <Wifi size={18} color={Colors.success} />
              : <WifiOff size={18} color={Colors.textTertiary} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {isActive ? 'Bridge activo' : 'Bridge inactivo'}
            </Text>
            <Text style={styles.statusSub}>
              {isActive
                ? `Escuchando jobs en ${config.ip}:${config.port}`
                : config.enabled && !config.ip
                  ? 'Falta configurar la IP'
                  : config.enabled
                    ? 'Sin conexion al servidor'
                    : 'Activar el toggle para habilitar'}
            </Text>
          </View>
          <Badge
            label={statusLabel}
            color={statusColor}
          />
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
            <Text style={styles.successText}>Ultimo job impreso correctamente</Text>
          </View>
        )}
      </Card>

      {/* Main toggle */}
      <Card style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Este dispositivo imprime</Text>
            <Text style={styles.sectionSub}>
              Activar para recibir jobs de impresion via socket y enviarlos por TCP a la impresora de red
            </Text>
          </View>
          <Switch
            value={config.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: Colors.border, true: Colors.success + '60' }}
            thumbColor={config.enabled ? Colors.success : Colors.textTertiary}
          />
        </View>
      </Card>

      {/* Printer connection */}
      {config.enabled && (
        <>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Conexion TCP</Text>
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
                onChangeText={p => {
                  const n = parseInt(p, 10);
                  if (!isNaN(n) && n > 0) updateConfig({ port: n });
                }}
                placeholder="9100"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>
          </Card>

          {/* Copies */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Copias</Text>
            <Text style={styles.sectionSub}>Numero de impresiones por job (1-3)</Text>
            <View style={styles.copiesRow}>
              {[1, 2, 3].map(n => (
                <Pressable
                  key={n}
                  style={[styles.copyBtn, config.copies === n && styles.copyBtnActive]}
                  onPress={() => updateConfig({ copies: n })}
                >
                  <Text style={[styles.copyBtnText, config.copies === n && styles.copyBtnTextActive]}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Events */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Eventos a imprimir</Text>
            <Text style={styles.sectionSub}>Que tipos de jobs activan la impresion</Text>
            <View style={styles.eventList}>
              {EVENT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.key}
                  style={styles.eventRow}
                  onPress={() => handleToggleEvent(opt.key)}
                >
                  <View style={[
                    styles.checkbox,
                    config.events?.includes(opt.key) && styles.checkboxChecked
                  ]}>
                    {config.events?.includes(opt.key) && (
                      <CheckCircle size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.eventLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={testingConn ? 'Probando...' : 'Probar conexion'}
              onPress={handleTestConnection}
              variant="outline"
              fullWidth
              icon={testingConn ? undefined : Wifi}
              disabled={testingConn || testingPrint}
            />
            <Button
              title={testingPrint ? 'Imprimiendo...' : 'Imprimir ticket de prueba'}
              onPress={handlePrintTest}
              variant="secondary"
              fullWidth
              icon={testingPrint ? undefined : Zap}
              disabled={testingConn || testingPrint}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    maxWidth: 700,
    alignSelf: 'center' as const,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
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

  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
  },

  copiesRow: { flexDirection: 'row', gap: Spacing.md },
  copyBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  copyBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  copyBtnText: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.textSecondary },
  copyBtnTextActive: { color: Colors.accentDark },

  eventList: { gap: Spacing.sm },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  eventLabel: { fontSize: FontSizes.md, color: Colors.text, flex: 1 },

  actions: { gap: Spacing.md },
});
