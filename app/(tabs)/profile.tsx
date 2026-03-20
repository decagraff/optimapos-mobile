import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, Radii, OrderStatusColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useServer } from '@/hooks/useServer';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  User, LogOut, Mail, Phone, MapPin, Building2,
  ClipboardList, ShoppingCart, Clock,
} from 'lucide-react-native';
import type { Order } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY_PICKUP: 'Listo',
  ON_THE_WAY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export default function ProfileScreen() {
  const { user, logout, selectedLocationName } = useAuth();
  const { config, disconnect } = useServer();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      setRecentOrders(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch {}
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleChangeServer = () => {
    Alert.alert('Cambiar restaurante', 'Se cerrará tu sesión actual.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        onPress: async () => {
          await disconnect();
          router.replace('/setup');
        },
      },
    ]);
  };

  const handleChangeLocation = () => {
    router.push('/location-select');
  };

  const totalSpent = recentOrders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
    >
      {/* User Card */}
      <Card style={styles.userCard}>
        <View style={styles.avatar}>
          <User size={32} color={Colors.accent} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>

        <View style={styles.infoRows}>
          <View style={styles.infoRow}>
            <Mail size={16} color={Colors.textTertiary} />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
          {user?.phone && (
            <View style={styles.infoRow}>
              <Phone size={16} color={Colors.textTertiary} />
              <Text style={styles.infoText}>{user.phone}</Text>
            </View>
          )}
          {selectedLocationName && (
            <View style={styles.infoRow}>
              <MapPin size={16} color={Colors.accent} />
              <Text style={[styles.infoText, { color: Colors.accent }]}>{selectedLocationName}</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Últimos pedidos</Text>
          {recentOrders.map(order => {
            const statusColor = OrderStatusColors[order.status] || Colors.textSecondary;
            return (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCode}>#{order.code?.split('-').pop() || order.id}</Text>
                  <Badge label={STATUS_LABELS[order.status] || order.status} color={statusColor} />
                </View>
                <View style={styles.orderMeta}>
                  <View style={styles.orderMetaRow}>
                    <ShoppingCart size={12} color={Colors.textTertiary} />
                    <Text style={styles.orderMetaText}>{order.items?.length || 0} items</Text>
                  </View>
                  <Text style={styles.orderTotal}>S/ {(Number(order.total) || 0).toFixed(2)}</Text>
                  <View style={styles.orderMetaRow}>
                    <Clock size={12} color={Colors.textTertiary} />
                    <Text style={styles.orderMetaText}>
                      {new Date(order.createdAt).toLocaleDateString('es-PE', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Cambiar local" onPress={handleChangeLocation} variant="outline" fullWidth icon={MapPin} />
        <Button title="Cambiar restaurante" onPress={handleChangeServer} variant="secondary" fullWidth icon={Building2} />
        <Button title="Cerrar sesión" onPress={handleLogout} variant="danger" fullWidth icon={LogOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxxl },

  userCard: { alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  infoRows: { gap: Spacing.xs, alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: FontSizes.md, color: Colors.textSecondary },

  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  orderCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCode: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  orderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderMetaText: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  orderTotal: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.accent },

  actions: { gap: Spacing.md },
});
