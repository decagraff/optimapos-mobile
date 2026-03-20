import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii, OrderStatusColors } from '@/constants/theme';
import { ClipboardList, Clock, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  ON_THE_WAY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const TYPE_LABELS: Record<string, string> = {
  DINE_IN: 'En mesa',
  TAKEAWAY: 'Para llevar',
  DELIVERY: 'Delivery',
};

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);
  const statusColor = OrderStatusColors[order.status as OrderStatus] || Colors.textSecondary;

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
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>S/ {order.total.toFixed(2)}</Text>
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
                <Text style={styles.itemPrice}>S/ {item.totalPrice.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </Card>
  );
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      setOrders(data);
    } catch {}
  }, []);

  useEffect(() => { fetchOrders().finally(() => setLoading(false)); }, [fetchOrders]);

  // Listen for real-time order updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => { fetchOrders(); };
    socket.on('order:updated', handleUpdate);
    socket.on('order:statusChanged', handleUpdate);
    return () => {
      socket.off('order:updated', handleUpdate);
      socket.off('order:statusChanged', handleUpdate);
    };
  }, [socket, fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const active = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const completed = orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));
  const sections = [
    ...(active.length > 0 ? [{ title: 'Activos', data: active }] : []),
    ...(completed.length > 0 ? [{ title: 'Completados', data: completed }] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <ClipboardList size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>Mis pedidos</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(s, i) => s.title + i}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
        ListEmptyComponent={
          <EmptyState icon={ClipboardList} title="Sin pedidos" subtitle="Los pedidos que hagas aparecerán aquí" />
        }
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
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
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
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
});
