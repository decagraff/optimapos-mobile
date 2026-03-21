import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii, OrderStatusColors } from '@/constants/theme';
import { History, Clock, MapPin, Package, CheckCircle2, XCircle } from 'lucide-react-native';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import { OrderListSkeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import type { Order, OrderStatus } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

const STATUS_LABELS: Record<string, string> = {
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

function getCustomerName(order: Order): string {
  return order.guestName || order.user?.name || 'Cliente';
}

function getAddress(order: Order): string | null {
  return order.guestAddress || order.user?.address || null;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const PERIOD_OPTIONS = [
  { label: 'Hoy', days: 0 },
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '3 meses', days: 90 },
];

// ─── History Card ─────────────────────────────────────────────────────
function HistoryCard({ order }: { order: Order }) {
  const isDelivered = order.status === 'DELIVERED';
  const statusColor = OrderStatusColors[order.status as OrderStatus] || Colors.textSecondary;
  const address = getAddress(order);

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {isDelivered ? (
            <CheckCircle2 size={18} color={Colors.success} />
          ) : (
            <XCircle size={18} color={Colors.danger} />
          )}
          <Text style={styles.orderCode}>#{order.code?.split('-').pop() || order.id}</Text>
        </View>
        <Badge label={STATUS_LABELS[order.status] || order.status} color={statusColor} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.customerName}>{getCustomerName(order)}</Text>
        {address && (
          <View style={styles.addressRow}>
            <MapPin size={12} color={Colors.textTertiary} />
            <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.itemsInfo}>
          <Package size={12} color={Colors.textTertiary} />
          <Text style={styles.footerText}>{order.items?.length || 0} items</Text>
        </View>
        <Text style={styles.total}>S/ {(Number(order.total) || 0).toFixed(2)}</Text>
        <View style={styles.timeInfo}>
          <Clock size={12} color={Colors.textTertiary} />
          <Text style={styles.footerText}>
            {formatDate(order.updatedAt || order.createdAt)} {formatTime(order.updatedAt || order.createdAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodIdx, setPeriodIdx] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      const completed = (Array.isArray(data) ? data : [])
        .filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

      // Filter by period
      const period = PERIOD_OPTIONS[periodIdx];
      const cutoff = period.days === 0
        ? new Date(todayStr()).getTime()
        : new Date(daysAgo(period.days)).getTime();

      const filtered = completed.filter(o => new Date(o.updatedAt || o.createdAt).getTime() >= cutoff);
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setOrders(filtered);
    } catch {}
  }, [periodIdx]);

  useEffect(() => { setLoading(true); fetchOrders().finally(() => setLoading(false)); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchOrders();
    socket.on('order:updated', refresh);
    socket.on('order:statusChanged', refresh);
    return () => {
      socket.off('order:updated', refresh);
      socket.off('order:statusChanged', refresh);
    };
  }, [socket, fetchOrders]);

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  const delivered = orders.filter(o => o.status === 'DELIVERED');
  const totalAmount = delivered.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <History size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      {/* Period filter */}
      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((opt, idx) => (
          <Pressable
            key={opt.label}
            style={[styles.periodChip, idx === periodIdx && styles.periodChipActive]}
            onPress={() => setPeriodIdx(idx)}
          >
            <Text style={[styles.periodText, idx === periodIdx && styles.periodTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Stats row */}
      {delivered.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{delivered.length}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>S/ {totalAmount.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {loading ? (
        <OrderListSkeleton />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
          ListEmptyComponent={
            <EmptyState icon={History} title="Sin historial" subtitle="Las entregas completadas aparecerán aquí" />
          }
          renderItem={({ item }) => <HistoryCard order={item} />}
        />
      )}
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
    paddingBottom: Spacing.xs,
  },
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },

  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  periodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: '#FFFFFF' },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.accent },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },

  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxxxl },

  card: { padding: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  orderCode: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },

  meta: { marginTop: Spacing.xs, gap: 2 },
  customerName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: FontSizes.xs, color: Colors.textTertiary, flex: 1 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  itemsInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  total: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.accent },
});
