import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import {
  BarChart3, DollarSign, ShoppingCart, TrendingUp, XCircle,
  ArrowUp, ArrowDown, Minus, Calendar,
} from 'lucide-react-native';
import { ReportsSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';

// ─── Types ────────────────────────────────────────────────────────────
interface Summary {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  cancelledOrders: number;
  prevTotalSales: number;
  prevTotalOrders: number;
  prevAvgTicket: number;
}

interface TopProduct {
  productId: number;
  name: string;
  qty: number;
  revenue: number;
}

interface ByType {
  type: string;
  count: number;
  total: number;
}

interface ByPayment {
  paymentMethod: string;
  count: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function fmt(n: number): string {
  return `S/ ${(Number(n) || 0).toFixed(2)}`;
}

function pctChange(current: number, prev: number): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (!prev) return { value: 0, direction: 'flat' };
  const pct = ((current - prev) / prev) * 100;
  return { value: Math.abs(Math.round(pct)), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const TYPE_LABELS: Record<string, string> = {
  DINE_IN: 'En mesa',
  PICKUP: 'Para llevar',
  DELIVERY: 'Delivery',
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  YAPE: 'Yape',
  TRANSFER: 'Transferencia',
  IZIPAY: 'Izipay',
};

const PERIOD_OPTIONS = [
  { label: 'Hoy', from: todayStr(), to: todayStr() },
  { label: '7 días', from: daysAgo(7), to: todayStr() },
  { label: '30 días', from: daysAgo(30), to: todayStr() },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color, change }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  change?: { value: number; direction: 'up' | 'down' | 'flat' };
}) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {change && change.value > 0 && (
        <View style={styles.changeRow}>
          {change.direction === 'up' ? (
            <ArrowUp size={10} color={Colors.success} />
          ) : (
            <ArrowDown size={10} color={Colors.danger} />
          )}
          <Text style={[styles.changeText, { color: change.direction === 'up' ? Colors.success : Colors.danger }]}>
            {change.value}%
          </Text>
        </View>
      )}
    </Card>
  );
}

// ─── Bar Chart (simple) ──────────────────────────────────────────────
function SimpleBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${width}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{fmt(value)}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { selectedLocationId } = useAuth();
  const [periodIdx, setPeriodIdx] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [byType, setByType] = useState<ByType[]>([]);
  const [byPayment, setByPayment] = useState<ByPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const period = PERIOD_OPTIONS[periodIdx];

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('from', period.from);
    params.set('to', period.to);
    if (selectedLocationId) params.set('locationId', String(selectedLocationId));
    const q = `?${params}`;

    try {
      const [sumData, topData, typeData, payData] = await Promise.all([
        api.get<Summary>(`/api/reports/summary${q}`),
        api.get<TopProduct[]>(`/api/reports/top-products${q}&limit=5`),
        api.get<ByType[]>(`/api/reports/by-type${q}`),
        api.get<ByPayment[]>(`/api/reports/by-payment${q}`),
      ]);
      setSummary(sumData);
      setTopProducts(Array.isArray(topData) ? topData : []);
      setByType(Array.isArray(typeData) ? typeData : []);
      setByPayment(Array.isArray(payData) ? payData : []);
    } catch {}
  }, [period.from, period.to, selectedLocationId]);

  useEffect(() => { setLoading(true); fetchData().finally(() => setLoading(false)); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const salesChange = summary ? pctChange(Number(summary.totalSales), Number(summary.prevTotalSales)) : undefined;
  const ordersChange = summary ? pctChange(summary.totalOrders, summary.prevTotalOrders) : undefined;
  const ticketChange = summary ? pctChange(Number(summary.avgTicket), Number(summary.prevAvgTicket)) : undefined;
  const maxProductRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(p => Number(p.revenue))) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BarChart3 size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>Reportes</Text>
      </View>

      {/* Period selector */}
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

      {loading ? (
        <ReportsSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
        >
          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              icon={<DollarSign size={18} color={Colors.success} />}
              value={summary ? fmt(Number(summary.totalSales)) : 'S/ 0.00'}
              label="Ventas"
              color={Colors.success}
              change={salesChange}
            />
            <StatCard
              icon={<ShoppingCart size={18} color={Colors.accent} />}
              value={summary?.totalOrders ?? 0}
              label="Pedidos"
              color={Colors.accent}
              change={ordersChange}
            />
            <StatCard
              icon={<TrendingUp size={18} color={Colors.info} />}
              value={summary ? fmt(Number(summary.avgTicket)) : 'S/ 0.00'}
              label="Ticket prom."
              color={Colors.info}
              change={ticketChange}
            />
            <StatCard
              icon={<XCircle size={18} color={Colors.danger} />}
              value={summary?.cancelledOrders ?? 0}
              label="Cancelados"
              color={Colors.danger}
            />
          </View>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top productos</Text>
              <View style={styles.barsContainer}>
                {topProducts.map((p, idx) => (
                  <SimpleBar
                    key={p.productId}
                    label={`${idx + 1}. ${p.name}`}
                    value={Number(p.revenue)}
                    maxValue={maxProductRevenue}
                    color={Colors.accent}
                  />
                ))}
              </View>
            </Card>
          )}

          {/* By Type */}
          {byType.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Por tipo</Text>
              {byType.map(t => (
                <View key={t.type} style={styles.typeRow}>
                  <Text style={styles.typeLabel}>{TYPE_LABELS[t.type] || t.type}</Text>
                  <Text style={styles.typeCount}>{t.count} pedidos</Text>
                  <Text style={styles.typeTotal}>{fmt(Number(t.total))}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* By Payment */}
          {byPayment.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Por método de pago</Text>
              {byPayment.map(p => (
                <View key={p.paymentMethod} style={styles.typeRow}>
                  <Text style={styles.typeLabel}>{PAYMENT_LABELS[p.paymentMethod] || p.paymentMethod}</Text>
                  <Text style={styles.typeCount}>{p.count} pedidos</Text>
                  <Text style={styles.typeTotal}>{fmt(Number(p.total))}</Text>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: '#FFFFFF' },

  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxxl, gap: Spacing.lg },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%' as any,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeText: { fontSize: FontSizes.xs, fontWeight: '700' },

  sectionCard: { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },

  barsContainer: { gap: Spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barLabel: { width: 100, fontSize: FontSizes.xs, color: Colors.textSecondary, numberOfLines: 1 } as any,
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 70, fontSize: FontSizes.xs, fontWeight: '600', color: Colors.text, textAlign: 'right' },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  typeLabel: { flex: 1, fontSize: FontSizes.sm, color: Colors.text },
  typeCount: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginRight: Spacing.md },
  typeTotal: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.accent },
});
