import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii, OrderStatusColors } from '@/constants/theme';
import { ClipboardList, Clock, ChevronDown, ChevronUp, ArrowRight, Search, X, Calendar } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { OrderListSkeleton } from '@/components/ui/Skeleton';
import type { Order, OrderStatus, Role } from '@/types';
import { ALLOWED_TRANSITIONS } from '@/utils/roles';
import { useResponsive } from '@/hooks/useResponsive';
import { ORDER_STATUS_LABELS, TYPE_LABELS } from '@/constants/labels';
import { timeAgo, todayStr, daysAgo, fmt } from '@/utils/helpers';

const STATUS_LABELS = ORDER_STATUS_LABELS;

const STATUS_ACTION_COLORS: Record<string, string> = {
  CONFIRMED: Colors.info,
  PREPARING: Colors.accent,
  READY_PICKUP: Colors.success,
  DELIVERED: Colors.success,
};

type DatePreset = 'today' | 'yesterday' | 'week';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'week', label: '7 días' },
];

function getPresetDates(preset: DatePreset): { from: string; to: string } {
  const today = todayStr();
  switch (preset) {
    case 'today': return { from: today, to: today };
    case 'yesterday': return { from: daysAgo(1), to: daysAgo(1) };
    case 'week': return { from: daysAgo(6), to: today };
  }
}

const STATUS_FILTERS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_PICKUP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];
const TYPE_FILTERS = ['DINE_IN', 'PICKUP', 'DELIVERY'];

// ─── Order Card ────────────────────────────────────────────────────────
function OrderCard({ order, onStatusChange, userRole }: { order: Order; onStatusChange: (id: number, status: string) => void; userRole: Role }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);
  const statusColor = OrderStatusColors[order.status as OrderStatus] || Colors.textSecondary;

  const roleTransitions = ALLOWED_TRANSITIONS[userRole] || {};
  const transition = isActive ? (roleTransitions[order.status] || null) : null;
  const nextAction = transition ? { ...transition, color: STATUS_ACTION_COLORS[transition.status] || Colors.info } : null;

  const handleStatusChange = async () => {
    if (!nextAction) return;
    setUpdating(true);
    await onStatusChange(order.id, nextAction.status);
    setUpdating(false);
  };

  return (
    <Card style={[styles.orderCard, isActive && styles.orderCardActive]}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCode}>#{order.code?.split('-').pop() || order.id}</Text>
            <Badge label={STATUS_LABELS[order.status] || order.status} color={statusColor} />
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.orderType}>{TYPE_LABELS[order.type] || order.type}</Text>
            {order.table && <Text style={styles.orderTable}> · {order.table.name}</Text>}
            <View style={styles.orderTime}>
              <Clock size={11} color={Colors.textTertiary} />
              <Text style={styles.orderTimeText}>{timeAgo(order.createdAt)}</Text>
            </View>
          </View>
          {order.guestName || order.user?.name ? (
            <Text style={styles.customerName}>{order.guestName || order.user?.name}</Text>
          ) : null}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>S/ {(Number(order.total) || 0).toFixed(2)}</Text>
          <View style={styles.orderItems}>
            <Text style={styles.orderItemsText}>{order.items?.length || 0} items</Text>
            {expanded ? <ChevronUp size={16} color={Colors.textTertiary} /> : <ChevronDown size={16} color={Colors.textTertiary} />}
          </View>
        </View>

        {expanded && order.items && (
          <View style={styles.itemsList}>
            {order.items.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <View style={styles.itemDetail}>
                  <Text style={styles.itemName}>{item.product?.name || 'Producto'}</Text>
                  {item.variant && <Text style={styles.itemVariant}>{item.variant.name}</Text>}
                  {item.addons?.length > 0 && (
                    <Text style={styles.itemAddons}>+ {item.addons.map(a => a.addon?.name).join(', ')}</Text>
                  )}
                  {item.notes && <Text style={styles.itemNotes}>"{item.notes}"</Text>}
                </View>
                <Text style={styles.itemPrice}>S/ {(Number(item.totalPrice) || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      {nextAction && (
        <Pressable
          style={[styles.statusBtn, { backgroundColor: nextAction.color }]}
          onPress={handleStatusChange}
          disabled={updating}
        >
          <Text style={styles.statusBtnText}>{updating ? 'Actualizando...' : nextAction.label}</Text>
          {!updating && <ArrowRight size={16} color="#FFFFFF" />}
        </Pressable>
      )}
    </Card>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function OrdersScreen() {
  const { user, selectedLocationId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();
  const { isTablet } = useResponsive();
  const userRole: Role = (user?.role as Role) || 'CLIENT';
  const isStaff = ['ADMIN', 'MANAGER', 'VENDOR'].includes(userRole);

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      if (isStaff) {
        const dates = getPresetDates(datePreset);
        const res = await api.getOrders({
          from: dates.from,
          to: dates.to,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          search: search || undefined,
          locationId: selectedLocationId || undefined,
          limit: 100,
        });
        setOrders(res.data || []);
        if (res.stats) {
          setTodayRevenue(res.stats.todayRevenue || 0);
          setTodayCount(res.stats.todayCount || 0);
        }
      } else {
        // CLIENT: only their own orders
        const data = await api.getMyOrders();
        setOrders(data);
      }
    } catch (err) { console.warn('[Orders] Fetch failed:', err); }
  }, [isStaff, datePreset, statusFilter, typeFilter, search, selectedLocationId]);

  useEffect(() => { fetchOrders().finally(() => setLoading(false)); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchOrders();
    socket.on('new_order', handleUpdate);
    socket.on('order_updated', handleUpdate);
    return () => {
      socket.off('new_order', handleUpdate);
      socket.off('order_updated', handleUpdate);
    };
  }, [socket, fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      await fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el estado');
    }
  };

  // Client-side grouping
  const active = useMemo(() => orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)), [orders]);
  const completed = useMemo(() => orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status)), [orders]);
  const sections = [
    ...(active.length > 0 ? [{ title: `Activos (${active.length})`, data: active }] : []),
    ...(completed.length > 0 ? [{ title: `Completados (${completed.length})`, data: completed }] : []),
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <OrderListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <ClipboardList size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>{isStaff ? 'Pedidos' : 'Mis pedidos'}</Text>
        {isStaff && (
          <Text style={styles.headerStats}>
            {fmt(todayRevenue)} ({todayCount})
          </Text>
        )}
      </View>

      {/* Filters — only for staff */}
      {isStaff && (
        <View style={styles.filtersContainer}>
          {/* Date presets */}
          <View style={styles.filterRow}>
            <Calendar size={14} color={Colors.textTertiary} />
            {DATE_PRESETS.map(p => (
              <Pressable
                key={p.key}
                style={[styles.filterChip, datePreset === p.key && styles.filterChipActive]}
                onPress={() => setDatePreset(p.key)}
              >
                <Text style={[styles.filterChipText, datePreset === p.key && styles.filterChipTextActive]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Search size={14} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar código, nombre, mesa..."
              placeholderTextColor={Colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => fetchOrders()}
              returnKeyType="search"
            />
            {search ? (
              <Pressable onPress={() => { setSearch(''); }}>
                <X size={14} color={Colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {/* Status chips */}
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, !statusFilter && styles.filterChipActive]}
              onPress={() => setStatusFilter('')}
            >
              <Text style={[styles.filterChipText, !statusFilter && styles.filterChipTextActive]}>Todos</Text>
            </Pressable>
            {STATUS_FILTERS.map(s => (
              <Pressable
                key={s}
                style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                onPress={() => setStatusFilter(statusFilter === s ? '' : s)}
              >
                <View style={[styles.filterDot, { backgroundColor: OrderStatusColors[s as OrderStatus] || Colors.textTertiary }]} />
                <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                  {STATUS_LABELS[s]?.substring(0, 6) || s}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Type chips */}
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, !typeFilter && styles.filterChipActive]}
              onPress={() => setTypeFilter('')}
            >
              <Text style={[styles.filterChipText, !typeFilter && styles.filterChipTextActive]}>Todos</Text>
            </Pressable>
            {TYPE_FILTERS.map(t => (
              <Pressable
                key={t}
                style={[styles.filterChip, typeFilter === t && styles.filterChipActive]}
                onPress={() => setTypeFilter(typeFilter === t ? '' : t)}
              >
                <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{TYPE_LABELS[t]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={sections}
        keyExtractor={(s, i) => s.title + i}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
        ListEmptyComponent={
          <EmptyState icon={ClipboardList} title="Sin pedidos" subtitle={isStaff ? 'No hay pedidos con estos filtros' : 'Los pedidos que hagas aparecerán aquí'} />
        }
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={isTablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : undefined}>
              {section.data.map(order => (
                <View key={order.id} style={isTablet ? { flexBasis: '48%', flexGrow: 0 } : undefined}>
                  <OrderCard order={order} onStatusChange={handleStatusChange} userRole={userRole} />
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

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
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text, flex: 1 },
  headerStats: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.accent },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text,
    paddingVertical: 0,
  },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxxxl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.lg, marginBottom: Spacing.md },
  orderCard: { marginBottom: Spacing.md, padding: Spacing.lg },
  orderCardActive: { borderLeftWidth: 3, borderLeftColor: Colors.accent },
  orderHeader: { gap: Spacing.xs },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCode: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  orderType: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  orderTable: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  orderTime: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: Spacing.sm },
  orderTimeText: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  customerName: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '500' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  orderTotal: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.accent },
  orderItems: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderItemsText: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  itemsList: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', gap: Spacing.sm },
  itemQty: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.accent, width: 28 },
  itemDetail: { flex: 1, gap: 1 },
  itemName: { fontSize: FontSizes.md, color: Colors.text },
  itemVariant: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  itemAddons: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  itemNotes: { fontSize: FontSizes.xs, color: Colors.accent, fontStyle: 'italic' },
  itemPrice: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radii.sm,
  },
  statusBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: '#FFFFFF' },
});
