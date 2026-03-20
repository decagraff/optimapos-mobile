import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
  Alert, TextInput, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import {
  Wallet, DollarSign, ArrowDownCircle, ArrowUpCircle,
  Lock, Unlock, Clock, Plus, Minus, X,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

// ─── Types ────────────────────────────────────────────────────────────
interface CashSummary {
  totalSales: number;
  cashSales: number;
  digitalSales: number;
  totalOrders: number;
  byPaymentMethod: { method: string; total: number; count: number }[];
  totalMovementsIn: number;
  totalMovementsOut: number;
  expectedAmount: number;
}

interface CashMovement {
  id: number;
  type: 'IN' | 'OUT';
  reason: string;
  amount: number;
  createdAt: string;
  user: { id: number; name: string };
}

interface CashRegister {
  id: number;
  status: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount: number;
  discrepancy?: number;
  openedAt: string;
  closedAt?: string;
  notes?: string;
  openedBy: { id: number; name: string };
  closedBy?: { id: number; name: string };
  movements: CashMovement[];
  summary?: CashSummary;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function fmt(n: number): string {
  return `S/ ${(Number(n) || 0).toFixed(2)}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  YAPE: 'Yape',
  TRANSFER: 'Transferencia',
  IZIPAY: 'Izipay',
};

// ─── Main Screen ──────────────────────────────────────────────────────
export default function CashScreen() {
  const { selectedLocationId } = useAuth();
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState<'open' | 'close' | 'movement' | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [submitting, setSubmitting] = useState(false);

  const isOpen = register && register.status === 'OPEN';

  const fetchData = useCallback(async () => {
    try {
      const q = selectedLocationId ? `?locationId=${selectedLocationId}` : '';
      const data = await api.get<CashRegister | null>(`/api/cash/current${q}`);
      setRegister(data);
    } catch {
      setRegister(null);
    }
  }, [selectedLocationId]);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const handleOpen = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/cash/open', {
        openingAmount: val,
        ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
      });
      await fetchData();
      setShowModal(null);
      setAmount('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo abrir la caja');
    }
    setSubmitting(false);
  };

  const handleClose = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) {
      Alert.alert('Error', 'Ingresa el monto de cierre');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/cash/close', { closingAmount: val });
      await fetchData();
      setShowModal(null);
      setAmount('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cerrar la caja');
    }
    setSubmitting(false);
  };

  const handleMovement = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Ingresa un motivo');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/cash/movements', {
        type: movementType,
        reason: reason.trim(),
        amount: val,
      });
      await fetchData();
      setShowModal(null);
      setAmount('');
      setReason('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar el movimiento');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Wallet size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>Caja</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Badge
            label={isOpen ? 'Abierta' : 'Cerrada'}
            color={isOpen ? Colors.success : Colors.danger}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
      >
        {!isOpen ? (
          /* Closed state */
          <Card style={styles.closedCard}>
            <Lock size={40} color={Colors.textTertiary} />
            <Text style={styles.closedTitle}>Caja cerrada</Text>
            <Text style={styles.closedSubtitle}>Abre la caja para iniciar el turno</Text>
            <Button
              title="Abrir caja"
              onPress={() => { setAmount(''); setShowModal('open'); }}
              fullWidth
              icon={Unlock}
            />
          </Card>
        ) : (
          <>
            {/* Summary */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Resumen</Text>
                <View style={styles.timeRow}>
                  <Clock size={12} color={Colors.textTertiary} />
                  <Text style={styles.timeText}>Desde {formatTime(register!.openedAt)}</Text>
                </View>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Apertura</Text>
                  <Text style={styles.summaryValue}>{fmt(Number(register!.openingAmount))}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Ventas efectivo</Text>
                  <Text style={styles.summaryValue}>{fmt(Number(register!.summary?.cashSales || 0))}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Entradas</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    +{fmt(Number(register!.summary?.totalMovementsIn || 0))}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Salidas</Text>
                  <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                    -{fmt(Number(register!.summary?.totalMovementsOut || 0))}
                  </Text>
                </View>
              </View>

              <View style={styles.expectedRow}>
                <Text style={styles.expectedLabel}>Esperado en caja</Text>
                <Text style={styles.expectedValue}>
                  {fmt(Number(register!.summary?.expectedAmount || register!.expectedAmount || 0))}
                </Text>
              </View>
            </Card>

            {/* Payment breakdown */}
            {register!.summary?.byPaymentMethod && register!.summary.byPaymentMethod.length > 0 && (
              <Card style={styles.paymentCard}>
                <Text style={styles.sectionTitle}>Ventas por método</Text>
                {register!.summary.byPaymentMethod.map(pm => (
                  <View key={pm.method} style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>{PAYMENT_LABELS[pm.method] || pm.method}</Text>
                    <Text style={styles.paymentCount}>{pm.count} pedidos</Text>
                    <Text style={styles.paymentTotal}>{fmt(Number(pm.total))}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Recent movements */}
            {register!.movements && register!.movements.length > 0 && (
              <Card style={styles.movementsCard}>
                <Text style={styles.sectionTitle}>Movimientos</Text>
                {register!.movements.map(m => (
                  <View key={m.id} style={styles.movementRow}>
                    {m.type === 'IN' ? (
                      <ArrowDownCircle size={18} color={Colors.success} />
                    ) : (
                      <ArrowUpCircle size={18} color={Colors.danger} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.movementReason}>{m.reason}</Text>
                      <Text style={styles.movementMeta}>{m.user.name} · {formatTime(m.createdAt)}</Text>
                    </View>
                    <Text style={[styles.movementAmount, { color: m.type === 'IN' ? Colors.success : Colors.danger }]}>
                      {m.type === 'IN' ? '+' : '-'}{fmt(Number(m.amount))}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Movimiento"
                onPress={() => { setAmount(''); setReason(''); setMovementType('IN'); setShowModal('movement'); }}
                variant="outline"
                fullWidth
                icon={Plus}
              />
              <Button
                title="Cerrar caja"
                onPress={() => { setAmount(''); setShowModal('close'); }}
                variant="danger"
                fullWidth
                icon={Lock}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal for open/close/movement */}
      <Modal visible={showModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showModal === 'open' ? 'Abrir caja' :
                 showModal === 'close' ? 'Cerrar caja' : 'Registrar movimiento'}
              </Text>
              <Pressable onPress={() => setShowModal(null)}>
                <X size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {showModal === 'movement' && (
              <View style={styles.typeSelector}>
                <Pressable
                  style={[styles.typeBtn, movementType === 'IN' && styles.typeBtnActiveIn]}
                  onPress={() => setMovementType('IN')}
                >
                  <ArrowDownCircle size={16} color={movementType === 'IN' ? '#FFFFFF' : Colors.success} />
                  <Text style={[styles.typeBtnText, movementType === 'IN' && styles.typeBtnTextActive]}>
                    Entrada
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.typeBtn, movementType === 'OUT' && styles.typeBtnActiveOut]}
                  onPress={() => setMovementType('OUT')}
                >
                  <ArrowUpCircle size={16} color={movementType === 'OUT' ? '#FFFFFF' : Colors.danger} />
                  <Text style={[styles.typeBtnText, movementType === 'OUT' && styles.typeBtnTextActive]}>
                    Salida
                  </Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.inputLabel}>
              {showModal === 'open' ? 'Monto de apertura' :
               showModal === 'close' ? 'Monto de cierre' : 'Monto'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            {showModal === 'movement' && (
              <>
                <Text style={styles.inputLabel}>Motivo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Compra de insumos"
                  placeholderTextColor={Colors.textTertiary}
                  value={reason}
                  onChangeText={setReason}
                />
              </>
            )}

            {showModal === 'close' && register?.summary && (
              <View style={styles.closingInfo}>
                <Text style={styles.closingLabel}>Esperado en caja:</Text>
                <Text style={styles.closingValue}>
                  {fmt(Number(register.summary.expectedAmount || register.expectedAmount))}
                </Text>
              </View>
            )}

            <Button
              title={submitting ? 'Procesando...' :
                showModal === 'open' ? 'Abrir caja' :
                showModal === 'close' ? 'Cerrar caja' : 'Registrar'}
              onPress={showModal === 'open' ? handleOpen : showModal === 'close' ? handleClose : handleMovement}
              fullWidth
              variant={showModal === 'close' ? 'danger' : 'primary'}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxxl },

  closedCard: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xxxl },
  closedTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
  closedSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary },

  summaryCard: { padding: Spacing.lg },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  summaryTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  summaryItem: { width: '46%' as any, gap: 2 },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  expectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  expectedLabel: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  expectedValue: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.accent },

  paymentCard: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paymentLabel: { flex: 1, fontSize: FontSizes.sm, color: Colors.text },
  paymentCount: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginRight: Spacing.md },
  paymentTotal: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.accent },

  movementsCard: { padding: Spacing.lg },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  movementReason: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  movementMeta: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  movementAmount: { fontSize: FontSizes.md, fontWeight: '700' },

  actions: { gap: Spacing.md },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },

  typeSelector: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtnActiveIn: { backgroundColor: Colors.success, borderColor: Colors.success },
  typeBtnActiveOut: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  typeBtnText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  typeBtnTextActive: { color: '#FFFFFF' },

  inputLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.background,
  },

  closingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.sm,
  },
  closingLabel: { fontSize: FontSizes.sm, color: Colors.accent },
  closingValue: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.accent },
});
