import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  TrendingUp, ShoppingCart, DollarSign, XCircle,
  ClipboardList, Clock, ChefHat, Truck, CheckCircle2,
  UtensilsCrossed, Grid3X3, Wallet,
} from 'lucide-react-native';

// ─── Types ───────────────────────────────────────────────────────────
interface Summary {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  cancelledOrders: number;
}

interface KitchenOrder {
  id: number;
  orderNumber: string;
  type: string;
  status: string;
  items: any[];
  createdAt: string;
}

interface DeliveryOrder {
  id: number;
  orderNumber: string;
  status: string;
  customerName: string;
  address?: string;
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

// ─── Admin / Manager Dashboard ───────────────────────────────────────
function AdminDashboard({ locationId }: { locationId: number | null }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const locParam = locationId ? `&locationId=${locationId}` : '';
      const data = await api.get<Summary>(`/api/reports/summary?${locParam}`);
      setSummary(data);
    } catch {}
  }, [locationId]);

  useEffect(() => { fetch().finally(() => setLoading(false)); }, [fetch]);
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  const fmt = (n: number) => `S/ ${(Number(n) || 0).toFixed(2)}`;

  if (loading) return <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
    >
      <Text style={styles.sectionTitle}>Resumen del día</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<DollarSign size={18} color={Colors.success} />} value={summary ? fmt(summary.totalSales) : 'S/ 0.00'} label="Ventas" color={Colors.success} />
        <StatCard icon={<ShoppingCart size={18} color={Colors.accent} />} value={summary?.totalOrders ?? 0} label="Pedidos" color={Colors.accent} />
        <StatCard icon={<TrendingUp size={18} color={Colors.info} />} value={summary ? fmt(summary.avgTicket) : 'S/ 0.00'} label="Ticket prom." color={Colors.info} />
        <StatCard icon={<XCircle size={18} color={Colors.danger} />} value={summary?.cancelledOrders ?? 0} label="Cancelados" color={Colors.danger} />
      </View>
    </ScrollView>
  );
}

// ─── Waiter Dashboard ────────────────────────────────────────────────
function WaiterDashboard({ locationId }: { locationId: number | null }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const locParam = locationId ? `?locationId=${locationId}` : '';
      const [ordRes, tabRes] = await Promise.all([
        api.get<{ orders: any[] }>('/api/orders/my'),
        api.get<any[]>(`/api/tables/all${locParam}`),
      ]);
      setOrders(ordRes.orders || []);
      setTables(Array.isArray(tabRes) ? tabRes : []);
    } catch {}
  }, [locationId]);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (loading) return <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />;

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const freeTables = tables.filter(t => t.status === 'FREE' || t.status === 'AVAILABLE');
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED');

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
    >
      <Text style={styles.sectionTitle}>Tu turno</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<ClipboardList size={18} color={Colors.accent} />} value={activeOrders.length} label="Pedidos activos" color={Colors.accent} />
        <StatCard icon={<CheckCircle2 size={18} color={Colors.success} />} value={orders.length} label="Total del día" color={Colors.success} />
        <StatCard icon={<Grid3X3 size={18} color={Colors.success} />} value={freeTables.length} label="Mesas libres" color={Colors.success} />
        <StatCard icon={<UtensilsCrossed size={18} color={Colors.danger} />} value={occupiedTables.length} label="Mesas ocupadas" color={Colors.danger} />
      </View>

      {activeOrders.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>Pedidos activos</Text>
          {activeOrders.slice(0, 5).map(order => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <Badge label={order.status} color={orderStatusColor(order.status)} />
              </View>
              <Text style={styles.orderMeta}>{order.type} — {order.items?.length || 0} items</Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Kitchen Dashboard ───────────────────────────────────────────────
function KitchenDashboard({ locationId }: { locationId: number | null }) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const locParam = locationId ? `?locationId=${locationId}` : '';
      const data = await api.get<KitchenOrder[]>(`/api/orders/kitchen/active${locParam}`);
      setOrders(data);
    } catch {}
  }, [locationId]);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (loading) return <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />;

  const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const preparing = orders.filter(o => o.status === 'PREPARING');

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
    >
      <Text style={styles.sectionTitle}>Cocina</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<Clock size={18} color={Colors.warning} />} value={pending.length} label="En espera" color={Colors.warning} />
        <StatCard icon={<ChefHat size={18} color={Colors.accent} />} value={preparing.length} label="Preparando" color={Colors.accent} />
        <StatCard icon={<CheckCircle2 size={18} color={Colors.success} />} value={orders.length} label="Total activos" color={Colors.success} />
      </View>

      {pending.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>Pendientes</Text>
          {pending.map(order => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <Badge label={minutesAgo(order.createdAt)} color={Colors.warning} />
              </View>
              <Text style={styles.orderMeta}>{order.items?.length || 0} items — {order.type}</Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Cashier Dashboard ───────────────────────────────────────────────
function CashierDashboard() {
  const [cashSession, setCashSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.get<any>('/api/cash/current');
      setCashSession(data);
    } catch {}
  }, []);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (loading) return <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />;

  const isOpen = cashSession && !cashSession.closedAt;
  const fmt = (n: number) => `S/ ${(n || 0).toFixed(2)}`;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
    >
      <Text style={styles.sectionTitle}>Caja</Text>
      <Card style={styles.cashCard}>
        <View style={styles.cashStatus}>
          <View style={[styles.cashDot, { backgroundColor: isOpen ? Colors.success : Colors.danger }]} />
          <Text style={styles.cashStatusText}>{isOpen ? 'Caja abierta' : 'Caja cerrada'}</Text>
        </View>
        {isOpen && (
          <View style={styles.cashDetails}>
            <View style={styles.cashRow}>
              <Text style={styles.cashLabel}>Apertura</Text>
              <Text style={styles.cashValue}>{fmt(cashSession.openingAmount)}</Text>
            </View>
            <View style={styles.cashRow}>
              <Text style={styles.cashLabel}>Ventas en efectivo</Text>
              <Text style={styles.cashValue}>{fmt(cashSession.cashSales)}</Text>
            </View>
            <View style={[styles.cashRow, styles.cashRowTotal]}>
              <Text style={styles.cashTotalLabel}>Esperado en caja</Text>
              <Text style={styles.cashTotalValue}>{fmt(cashSession.expectedAmount)}</Text>
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

// ─── Delivery Dashboard ──────────────────────────────────────────────
function DeliveryDashboard() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.get<DeliveryOrder[]>('/api/orders/delivery/active');
      setOrders(data);
    } catch {}
  }, []);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (loading) return <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />;

  const pending = orders.filter(o => o.status !== 'DELIVERED');
  const delivered = orders.filter(o => o.status === 'DELIVERED');

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
    >
      <Text style={styles.sectionTitle}>Tus entregas</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<Truck size={18} color={Colors.accent} />} value={pending.length} label="Pendientes" color={Colors.accent} />
        <StatCard icon={<CheckCircle2 size={18} color={Colors.success} />} value={delivered.length} label="Entregados hoy" color={Colors.success} />
      </View>

      {pending.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>Activos</Text>
          {pending.map(order => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <Badge label={order.status} color={orderStatusColor(order.status)} />
              </View>
              <Text style={styles.orderMeta}>{order.customerName}</Text>
              {order.address && <Text style={styles.orderAddress}>{order.address}</Text>}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Client Home ─────────────────────────────────────────────────────
function ClientHome() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.get<{ orders: any[] }>('/api/orders/my');
      setOrders(data.orders || []);
    } catch {}
  }, []);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (loading) return <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />;

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const recentOrders = orders.slice(0, 5);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
    >
      {activeOrders.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Pedidos en curso</Text>
          {activeOrders.map(order => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <Badge label={statusLabel(order.status)} color={orderStatusColor(order.status)} />
              </View>
              <Text style={styles.orderMeta}>{order.type} — S/ {(Number(order.total) || 0).toFixed(2)}</Text>
            </Card>
          ))}
        </>
      )}

      <Text style={[styles.sectionTitle, activeOrders.length > 0 && { marginTop: Spacing.xxl }]}>
        {recentOrders.length > 0 ? 'Pedidos recientes' : 'Sin pedidos aún'}
      </Text>
      {recentOrders.length === 0 && (
        <Card style={styles.emptyCard}>
          <UtensilsCrossed size={32} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Haz tu primer pedido desde el menú</Text>
        </Card>
      )}
      {recentOrders.map(order => (
        <Card key={order.id} style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Badge label={statusLabel(order.status)} color={orderStatusColor(order.status)} />
          </View>
          <Text style={styles.orderMeta}>S/ {(Number(order.total) || 0).toFixed(2)}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────
function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: Colors.warning, CONFIRMED: Colors.info, PREPARING: Colors.accent,
    READY: Colors.success, DELIVERED: Colors.success, CANCELLED: Colors.danger,
  };
  return map[status] || Colors.textSecondary;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PREPARING: 'Preparando',
    READY: 'Listo', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
  };
  return map[status] || status;
}

function minutesAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  return diff < 1 ? 'Ahora' : `${diff} min`;
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, selectedLocationId, selectedLocationName } = useAuth();
  const { isConnected } = useSocket();
  const role = user?.role || 'CLIENT';

  const renderContent = () => {
    switch (role) {
      case 'ADMIN':
      case 'MANAGER':
        return <AdminDashboard locationId={selectedLocationId} />;
      case 'VENDOR':
        return <WaiterDashboard locationId={selectedLocationId} />;
      case 'KITCHEN':
        return <KitchenDashboard locationId={selectedLocationId} />;
      case 'DELIVERY':
        return <DeliveryDashboard />;
      case 'CLIENT':
        return <ClientHome />;
      default:
        return <AdminDashboard locationId={selectedLocationId} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>Hola, {user?.name?.split(' ')[0] || 'Usuario'}</Text>
          <View style={styles.subHeaderRow}>
            <Text style={styles.roleBadge}>{role}</Text>
            {selectedLocationName && (
              <>
                <View style={styles.headerDot} />
                <Text style={styles.locationBadge} numberOfLines={1}>{selectedLocationName}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.dot, isConnected ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusText}>{isConnected ? 'En línea' : 'Sin conexión'}</Text>
        </View>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  greetingText: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 },
  roleBadge: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  headerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textTertiary },
  locationBadge: { fontSize: FontSizes.xs, fontWeight: '500', color: Colors.textSecondary, flexShrink: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: Colors.success },
  dotOffline: { backgroundColor: Colors.textTertiary },
  statusText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxxl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%' as any,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  orderCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  orderMeta: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  orderAddress: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },
  cashCard: { padding: Spacing.xl },
  cashStatus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  cashDot: { width: 10, height: 10, borderRadius: 5 },
  cashStatusText: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  cashDetails: { gap: Spacing.md },
  cashRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cashRowTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.sm },
  cashLabel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  cashValue: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cashTotalLabel: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  cashTotalValue: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.accent },
  emptyCard: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.md },
  emptyText: { fontSize: FontSizes.md, color: Colors.textTertiary, textAlign: 'center' },
});
