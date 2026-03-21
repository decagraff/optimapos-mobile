import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl,
  Vibration, Linking, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii, OrderStatusColors } from '@/constants/theme';
import {
  Truck, Clock, MapPin, Phone, ArrowRight, Package, Navigation,
  CheckCircle2, User, Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { OrderListSkeleton } from '@/components/ui/Skeleton';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import type { Order, OrderStatus } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────
function minutesSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function timerLabel(mins: number): string {
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY_PICKUP: 'Listo para recoger',
  ON_THE_WAY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const NEXT_ACTION: Record<string, { status: string; label: string; color: string; icon: any } | null> = {
  READY_PICKUP: { status: 'ON_THE_WAY', label: 'Recogido · En camino', color: '#8B5CF6', icon: Navigation },
  ON_THE_WAY:   { status: 'DELIVERED',  label: 'Entregado',            color: Colors.success, icon: CheckCircle2 },
};

function getCustomerName(order: Order): string {
  return order.guestName || order.user?.name || 'Cliente';
}

function getCustomerPhone(order: Order): string | null {
  return order.guestPhone || order.user?.phone || null;
}

function getCustomerAddress(order: Order): string | null {
  return order.guestAddress || order.user?.address || null;
}

// ─── Delivery Card ────────────────────────────────────────────────────
function DeliveryCard({ order, onAction, onPhoto }: { order: Order; onAction: (id: number, status: string) => void; onPhoto: (id: number) => void }) {
  const [updating, setUpdating] = useState(false);
  const mins = minutesSince(order.createdAt);
  const statusColor = OrderStatusColors[order.status as OrderStatus] || Colors.textSecondary;
  const nextAction = NEXT_ACTION[order.status] || null;
  const customerPhone = getCustomerPhone(order);
  const customerAddress = getCustomerAddress(order);
  const isActionable = order.status === 'READY_PICKUP' || order.status === 'ON_THE_WAY';

  const handleAction = async () => {
    if (!nextAction) return;
    setUpdating(true);
    await onAction(order.id, nextAction.status);
    setUpdating(false);
  };

  const openMaps = () => {
    if (!customerAddress) return;
    const encoded = encodeURIComponent(customerAddress);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  const callCustomer = () => {
    if (!customerPhone) return;
    Linking.openURL(`tel:${customerPhone}`);
  };

  return (
    <Card style={[styles.card, isActionable && styles.cardActive]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.orderCode}>#{order.code?.split('-').pop() || order.id}</Text>
          <Badge label={STATUS_LABELS[order.status] || order.status} color={statusColor} />
        </View>
        <View style={styles.timer}>
          <Clock size={12} color={Colors.textTertiary} />
          <Text style={styles.timerText}>{timerLabel(mins)}</Text>
        </View>
      </View>

      {/* Customer info */}
      <View style={styles.customerSection}>
        <View style={styles.customerRow}>
          <User size={14} color={Colors.textSecondary} />
          <Text style={styles.customerName}>{getCustomerName(order)}</Text>
        </View>
        {customerAddress && (
          <Pressable style={styles.addressRow} onPress={openMaps}>
            <MapPin size={14} color={Colors.accent} />
            <Text style={styles.addressText} numberOfLines={2}>{customerAddress}</Text>
          </Pressable>
        )}
        {customerPhone && (
          <Pressable style={styles.phoneRow} onPress={callCustomer}>
            <Phone size={14} color={Colors.info} />
            <Text style={styles.phoneText}>{customerPhone}</Text>
          </Pressable>
        )}
      </View>

      {/* Items summary */}
      <View style={styles.itemsSummary}>
        <Package size={14} color={Colors.textTertiary} />
        <Text style={styles.itemsText}>
          {order.items?.length || 0} items · S/ {(Number(order.total) || 0).toFixed(2)}
        </Text>
      </View>

      {/* Items detail */}
      <View style={styles.itemsList}>
        {order.items?.map((item, idx) => (
          <View key={item.id || idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.product?.name || 'Producto'}
            </Text>
          </View>
        ))}
      </View>

      {/* Order notes */}
      {order.notes && (
        <View style={styles.orderNotes}>
          <Text style={styles.orderNotesText}>Nota: {order.notes}</Text>
        </View>
      )}

      {/* Quick actions: Maps + Call */}
      {(customerAddress || customerPhone) && (
        <View style={styles.quickActions}>
          {customerAddress && (
            <Pressable style={[styles.quickBtn, styles.quickBtnMaps]} onPress={openMaps}>
              <Navigation size={16} color="#FFFFFF" />
              <Text style={styles.quickBtnText}>Abrir Maps</Text>
            </Pressable>
          )}
          {customerPhone && (
            <Pressable style={[styles.quickBtn, styles.quickBtnCall]} onPress={callCustomer}>
              <Phone size={16} color="#FFFFFF" />
              <Text style={styles.quickBtnText}>Llamar</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Delivery photo */}
      {order.status === 'ON_THE_WAY' && (
        <View style={styles.photoSection}>
          {(order as any).deliveryPhoto ? (
            <Image source={{ uri: (order as any).deliveryPhoto }} style={styles.photoThumb} />
          ) : (
            <Pressable style={styles.photoBtn} onPress={() => onPhoto(order.id)}>
              <Camera size={18} color={Colors.accent} />
              <Text style={styles.photoBtnText}>Foto de entrega</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Main action button */}
      {nextAction && (
        <Pressable
          style={[styles.actionBtn, { backgroundColor: nextAction.color }]}
          onPress={handleAction}
          disabled={updating}
        >
          <nextAction.icon size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>
            {updating ? 'Actualizando...' : nextAction.label}
          </Text>
          {!updating && <ArrowRight size={18} color="#FFFFFF" />}
        </Pressable>
      )}
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────
export default function DeliveriesScreen() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const prevCountRef = useRef(0);
  const listRef = useRef<FlatList>(null);
  const [, setTick] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getDeliveryOrders();
      const list = Array.isArray(data) ? data : [];

      if (list.length > prevCountRef.current && prevCountRef.current > 0) {
        Vibration.vibrate([0, 300, 100, 300]);
        setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 300);
      }
      prevCountRef.current = list.length;
      setOrders(list);
    } catch {}
  }, []);

  useEffect(() => { fetchOrders().finally(() => setLoading(false)); }, [fetchOrders]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchOrders();
    socket.on('order:created', refresh);
    socket.on('order:updated', refresh);
    socket.on('order:statusChanged', refresh);
    return () => {
      socket.off('order:created', refresh);
      socket.off('order:updated', refresh);
      socket.off('order:statusChanged', refresh);
    };
  }, [socket, fetchOrders]);

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  const handleAction = async (orderId: number, status: string) => {
    try {
      await api.updateDeliveryStatus(orderId, status);
      await fetchOrders();
    } catch {}
  };

  const handlePhoto = async (orderId: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar foto de entrega');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      await api.uploadDeliveryPhoto(orderId, result.assets[0].uri);
      await fetchOrders();
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <OrderListSkeleton />
      </SafeAreaView>
    );
  }

  // Priority: READY_PICKUP first, then ON_THE_WAY, then preparing/confirmed/pending
  const readyOrders = orders.filter(o => o.status === 'READY_PICKUP');
  const onWayOrders = orders.filter(o => o.status === 'ON_THE_WAY');
  const otherOrders = orders.filter(o => !['READY_PICKUP', 'ON_THE_WAY'].includes(o.status));
  const sortedOrders = [...readyOrders, ...onWayOrders, ...otherOrders];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Truck size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>Entregas</Text>
        <View style={styles.headerBadges}>
          {readyOrders.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: Colors.success }]}>
              <Text style={styles.countText}>{readyOrders.length} listos</Text>
            </View>
          )}
          {onWayOrders.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.countText}>{onWayOrders.length} en camino</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={sortedOrders}
        keyExtractor={o => String(o.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
        ListEmptyComponent={
          <EmptyState icon={Truck} title="Sin entregas" subtitle="No hay pedidos delivery pendientes" />
        }
        renderItem={({ item }) => <DeliveryCard order={item} onAction={handleAction} onPhoto={handlePhoto} />}
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
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxxl },

  card: { padding: Spacing.lg },
  cardActive: { borderLeftWidth: 4, borderLeftColor: Colors.accent },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  orderCode: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: FontSizes.sm, color: Colors.textTertiary },

  customerSection: { marginTop: Spacing.md, gap: Spacing.xs },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  customerName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, paddingLeft: 2 },
  addressText: { fontSize: FontSizes.sm, color: Colors.accent, fontWeight: '500', flex: 1 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingLeft: 2 },
  phoneText: { fontSize: FontSizes.sm, color: Colors.info, fontWeight: '500' },

  itemsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  itemsText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },

  itemsList: { marginTop: Spacing.xs, gap: 2 },
  itemRow: { flexDirection: 'row', gap: Spacing.xs, paddingLeft: Spacing.lg },
  itemQty: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.accent, width: 24 },
  itemName: { fontSize: FontSizes.sm, color: Colors.textSecondary, flex: 1 },

  orderNotes: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.sm,
  },
  orderNotesText: { fontSize: FontSizes.sm, color: Colors.accent, fontWeight: '500' },

  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
  },
  quickBtnMaps: { backgroundColor: '#3B82F6' },
  quickBtnCall: { backgroundColor: Colors.success },
  quickBtnText: { fontSize: FontSizes.sm, fontWeight: '700', color: '#FFFFFF' },

  photoSection: { marginTop: Spacing.md },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    borderRadius: Radii.sm,
  },
  photoBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.accent },
  photoThumb: { width: '100%', height: 120, borderRadius: Radii.sm },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.sm,
  },
  actionText: { fontSize: FontSizes.lg, fontWeight: '700', color: '#FFFFFF' },
});
