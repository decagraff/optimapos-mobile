import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Vibration, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { ChefHat, Clock, AlertTriangle, CheckCircle2, Flame } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { KitchenSkeleton } from '@/components/ui/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────
interface KitchenItem {
  id: number;
  quantity: number;
  notes?: string;
  product?: { name: string; categoryId?: number; category?: { name: string } };
  combo?: { name: string; category?: { name: string } };
  variant?: { name: string };
  addons: { addon: { name: string } }[];
}

interface KitchenOrder {
  id: number;
  code: string;
  type: string;
  kitchenStatus: string;
  createdAt: string;
  notes?: string;
  table?: { number: number; name: string };
  items: KitchenItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────
function minutesSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function timerColor(mins: number): string {
  if (mins < 5) return Colors.success;
  if (mins < 10) return Colors.warning;
  return Colors.danger;
}

function timerLabel(mins: number): string {
  if (mins < 1) return 'Ahora';
  return `${mins} min`;
}

const TYPE_LABELS: Record<string, string> = {
  DINE_IN: 'Mesa',
  PICKUP: 'Para llevar',
  DELIVERY: 'Delivery',
};

// ─── Kitchen Card ─────────────────────────────────────────────────────
function KitchenCard({ order, onAction }: { order: KitchenOrder; onAction: (id: number, status: string) => void }) {
  const [updating, setUpdating] = useState(false);
  const mins = minutesSince(order.createdAt);
  const tColor = timerColor(mins);
  const isPending = order.kitchenStatus === 'PENDING';
  const isPreparing = order.kitchenStatus === 'PREPARING';
  const isUrgent = mins >= 10;

  const handleAction = async () => {
    const nextStatus = isPending ? 'PREPARING' : 'READY';
    setUpdating(true);
    await onAction(order.id, nextStatus);
    setUpdating(false);
  };

  return (
    <Card style={[styles.card, isUrgent && styles.cardUrgent]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.orderCode}>#{order.code?.split('-').pop() || order.id}</Text>
          <Badge
            label={isPending ? 'Pendiente' : 'Preparando'}
            color={isPending ? Colors.warning : Colors.accent}
          />
        </View>
        <View style={[styles.timer, { backgroundColor: tColor + '20' }]}>
          {isUrgent ? <AlertTriangle size={12} color={tColor} /> : <Clock size={12} color={tColor} />}
          <Text style={[styles.timerText, { color: tColor }]}>{timerLabel(mins)}</Text>
        </View>
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{TYPE_LABELS[order.type] || order.type}</Text>
        {order.table && <Text style={styles.metaText}> · {order.table.name}</Text>}
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {order.items.map((item, idx) => (
          <View key={item.id || idx} style={styles.itemRow}>
            <View style={styles.itemQtyBox}>
              <Text style={styles.itemQty}>{item.quantity}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product?.name || item.combo?.name || 'Item'}</Text>
              {item.variant && <Text style={styles.itemVariant}>{item.variant.name}</Text>}
              {item.addons?.length > 0 && (
                <Text style={styles.itemAddons}>+ {item.addons.map(a => a.addon.name).join(', ')}</Text>
              )}
              {item.notes && <Text style={styles.itemNotes}>"{item.notes}"</Text>}
            </View>
            {item.product?.category && (
              <Text style={styles.itemCategory}>{item.product.category.name}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Order notes */}
      {order.notes && (
        <View style={styles.orderNotes}>
          <Text style={styles.orderNotesText}>Nota: {order.notes}</Text>
        </View>
      )}

      {/* Action button */}
      <Pressable
        style={[styles.actionBtn, isPreparing ? styles.actionReady : styles.actionPreparing]}
        onPress={handleAction}
        disabled={updating}
      >
        {isPending ? (
          <Flame size={18} color="#FFFFFF" />
        ) : (
          <CheckCircle2 size={18} color="#FFFFFF" />
        )}
        <Text style={styles.actionText}>
          {updating ? 'Actualizando...' : isPending ? 'Preparando' : 'Listo'}
        </Text>
      </Pressable>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────
export default function KitchenScreen() {
  const { selectedLocationId } = useAuth();
  const { socket } = useSocket();
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 600; // tablet or landscape
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const prevCountRef = useRef(0);
  const listRef = useRef<FlatList>(null);
  // Force re-render every 30s for timer updates
  const [, setTick] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getKitchenOrders(selectedLocationId || undefined);
      const list = Array.isArray(data) ? data : [];

      // Vibrate if new orders arrived
      if (list.length > prevCountRef.current && prevCountRef.current > 0) {
        Vibration.vibrate([0, 300, 100, 300]);
        // Auto-scroll to top for new orders
        setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 300);
      }
      prevCountRef.current = list.length;
      setOrders(list);
    } catch {}
  }, [selectedLocationId]);

  useEffect(() => { fetchOrders().finally(() => setLoading(false)); }, [fetchOrders]);

  // Timer tick
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchOrders();
    socket.on('new_order', refresh);
    socket.on('order_updated', refresh);
    socket.on('kitchen_status_changed', refresh);
    return () => {
      socket.off('new_order', refresh);
      socket.off('order_updated', refresh);
      socket.off('kitchen_status_changed', refresh);
    };
  }, [socket, fetchOrders]);

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  const handleAction = async (orderId: number, status: string) => {
    try {
      await api.updateKitchenStatus(orderId, status);
      await fetchOrders();
    } catch {}
  };

  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KitchenSkeleton />
      </SafeAreaView>
    );
  }

  // Extract unique categories from order items
  const categorySet = new Map<string, string>();
  orders.forEach(o => o.items.forEach(item => {
    const cat = item.product?.category;
    if (cat?.name) categorySet.set(cat.name, cat.name);
  }));
  const categoryNames = Array.from(categorySet.values()).sort();

  // Filter orders: show only orders that have at least one item in the selected category
  const filteredOrders = filterCategory
    ? orders.filter(o => o.items.some(item => item.product?.category?.name === filterCategory))
    : orders;

  const pending = filteredOrders.filter(o => o.kitchenStatus === 'PENDING');
  const preparing = filteredOrders.filter(o => o.kitchenStatus === 'PREPARING');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <ChefHat size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>Cocina</Text>
        <View style={styles.headerBadges}>
          {pending.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: Colors.warning }]}>
              <Text style={styles.countText}>{pending.length} espera</Text>
            </View>
          )}
          {preparing.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: Colors.accent }]}>
              <Text style={styles.countText}>{preparing.length} preparando</Text>
            </View>
          )}
        </View>
      </View>

      {/* Category filter chips */}
      {categoryNames.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...categoryNames]}
          keyExtractor={(item) => item || 'all'}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item: cat }) => {
            const active = cat === filterCategory;
            return (
              <Pressable
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilterCategory(cat)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {cat || 'Todo'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <FlatList
        ref={listRef}
        data={filteredOrders}
        keyExtractor={o => String(o.id)}
        key={isWide ? 'wide' : 'narrow'}
        numColumns={isWide ? 2 : 1}
        columnWrapperStyle={isWide ? styles.wideRow : undefined}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
        ListEmptyComponent={
          <EmptyState icon={ChefHat} title="Sin pedidos" subtitle="No hay pedidos pendientes en cocina" />
        }
        renderItem={({ item }) => (
          <View style={isWide ? styles.wideCard : undefined}>
            <KitchenCard order={item} onAction={handleAction} />
          </View>
        )}
      />
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
  headerBadges: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  countBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.pill },
  countText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#FFFFFF' },
  filterRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'center' as const,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#FFFFFF' },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxxl },
  wideRow: { gap: Spacing.md },
  wideCard: { flex: 1 },

  card: { padding: Spacing.lg },
  cardUrgent: { borderLeftWidth: 4, borderLeftColor: Colors.danger },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  orderCode: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radii.pill },
  timerText: { fontSize: FontSizes.sm, fontWeight: '700' },

  metaRow: { flexDirection: 'row', marginTop: Spacing.xs },
  metaText: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  itemsList: { marginTop: Spacing.md, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  itemQtyBox: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQty: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary },
  itemInfo: { flex: 1, gap: 1 },
  itemName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  itemVariant: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  itemAddons: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  itemNotes: { fontSize: FontSizes.xs, color: Colors.danger, fontWeight: '600' },
  itemCategory: { fontSize: FontSizes.xs, color: Colors.textTertiary, fontStyle: 'italic' },

  orderNotes: { marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.accentLight, borderRadius: Radii.sm },
  orderNotesText: { fontSize: FontSizes.sm, color: Colors.accent, fontWeight: '500' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.sm,
  },
  actionPreparing: { backgroundColor: Colors.accent },
  actionReady: { backgroundColor: Colors.success },
  actionText: { fontSize: FontSizes.lg, fontWeight: '700', color: '#FFFFFF' },
});
