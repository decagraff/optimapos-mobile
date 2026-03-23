import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TextInput, Modal, Pressable } from 'react-native';
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
  ShoppingCart, Clock, Repeat, Lock, Home, Plus, Trash2, X,
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

interface UserAddress {
  id: number;
  label: string;
  address: string;
  reference?: string;
  isDefault: boolean;
}

export default function ProfileScreen() {
  const { user, logout, selectedLocationName } = useAuth();
  const { config, disconnect } = useServer();
  const isClient = user?.role === 'CLIENT';
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);

  // Change password state
  const [showPassword, setShowPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Casa');
  const [newAddrAddress, setNewAddrAddress] = useState('');
  const [newAddrRef, setNewAddrRef] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      setRecentOrders(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {}
  }, []);

  const fetchAddresses = useCallback(async () => {
    if (!isClient) return;
    try {
      const data = await api.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch {}
  }, [isClient]);

  useEffect(() => { fetchOrders(); fetchAddresses(); }, [fetchOrders, fetchAddresses]);

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

  const handleRepeatOrder = async (orderId: number) => {
    try {
      await api.repeatOrder(orderId);
      Alert.alert('Pedido repetido', 'Tu pedido fue enviado a la cocina');
      fetchOrders();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo repetir el pedido');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      Alert.alert('Error', 'Completa ambos campos');
      return;
    }
    setPwdLoading(true);
    try {
      await api.changePassword(currentPwd, newPwd);
      Alert.alert('Listo', 'Contraseña actualizada');
      setShowPassword(false);
      setCurrentPwd('');
      setNewPwd('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cambiar la contraseña');
    }
    setPwdLoading(false);
  };

  const handleAddAddress = async () => {
    if (!newAddrAddress.trim()) {
      Alert.alert('Error', 'Ingresa una dirección');
      return;
    }
    try {
      await api.createAddress({
        label: newAddrLabel,
        address: newAddrAddress,
        reference: newAddrRef || undefined,
        isDefault: addresses.length === 0,
      });
      setShowAddAddress(false);
      setNewAddrAddress('');
      setNewAddrRef('');
      fetchAddresses();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar la dirección');
    }
  };

  const handleDeleteAddress = (id: number) => {
    Alert.alert('Eliminar dirección', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.deleteAddress(id);
          fetchAddresses();
        },
      },
    ]);
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
            const canRepeat = isClient && order.status === 'DELIVERED';
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
                {canRepeat && (
                  <Pressable
                    style={styles.repeatBtn}
                    onPress={() => handleRepeatOrder(order.id)}
                  >
                    <Repeat size={14} color={Colors.accent} />
                    <Text style={styles.repeatBtnText}>Repetir pedido</Text>
                  </Pressable>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* Saved Addresses (Client only) */}
      {isClient && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Direcciones guardadas</Text>
            <Pressable onPress={() => setShowAddAddress(true)}>
              <Plus size={20} color={Colors.accent} />
            </Pressable>
          </View>
          {addresses.length === 0 && (
            <Card style={styles.emptyAddr}>
              <Home size={24} color={Colors.textTertiary} />
              <Text style={styles.emptyAddrText}>Sin direcciones guardadas</Text>
            </Card>
          )}
          {addresses.map(addr => (
            <Card key={addr.id} style={styles.addrCard}>
              <View style={styles.addrRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.addrLabelRow}>
                    <Text style={styles.addrLabel}>{addr.label}</Text>
                    {addr.isDefault && <Badge label="Principal" color={Colors.accent} />}
                  </View>
                  <Text style={styles.addrText}>{addr.address}</Text>
                  {addr.reference && <Text style={styles.addrRef}>{addr.reference}</Text>}
                </View>
                <Pressable onPress={() => handleDeleteAddress(addr.id)}>
                  <Trash2 size={16} color={Colors.danger} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Add Address Modal */}
      <Modal visible={showAddAddress} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva dirección</Text>
              <Pressable onPress={() => setShowAddAddress(false)}>
                <X size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.labelPicker}>
                {['Casa', 'Trabajo', 'Otro'].map(l => (
                  <Pressable
                    key={l}
                    style={[styles.labelChip, newAddrLabel === l && styles.labelChipActive]}
                    onPress={() => setNewAddrLabel(l)}
                  >
                    <Text style={[styles.labelChipText, newAddrLabel === l && styles.labelChipTextActive]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Dirección completa"
                value={newAddrAddress}
                onChangeText={setNewAddrAddress}
                placeholderTextColor={Colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="Referencia (opcional)"
                value={newAddrRef}
                onChangeText={setNewAddrRef}
                placeholderTextColor={Colors.textTertiary}
              />
              <Button title="Guardar dirección" onPress={handleAddAddress} fullWidth />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password */}
      {!showPassword ? (
        <Button title="Cambiar contraseña" onPress={() => setShowPassword(true)} variant="outline" fullWidth icon={Lock} />
      ) : (
        <Card style={styles.pwdCard}>
          <Text style={styles.pwdTitle}>Cambiar contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña actual"
            secureTextEntry
            value={currentPwd}
            onChangeText={setCurrentPwd}
            placeholderTextColor={Colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            secureTextEntry
            value={newPwd}
            onChangeText={setNewPwd}
            placeholderTextColor={Colors.textTertiary}
          />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button title="Cancelar" onPress={() => { setShowPassword(false); setCurrentPwd(''); setNewPwd(''); }} variant="outline" fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Guardar" onPress={handleChangePassword} loading={pwdLoading} fullWidth />
            </View>
          </View>
        </Card>
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
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxxl, maxWidth: 700, alignSelf: 'center' as const, width: '100%' },

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

  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  repeatBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.accent },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  emptyAddr: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyAddrText: { fontSize: FontSizes.sm, color: Colors.textTertiary },
  addrCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  addrLabel: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  addrText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  addrRef: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: Radii.lg, borderTopRightRadius: Radii.lg, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
  modalForm: { gap: Spacing.md },
  labelPicker: { flexDirection: 'row', gap: Spacing.sm },
  labelChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  labelChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  labelChipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  labelChipTextActive: { color: '#FFFFFF' },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
  },

  pwdCard: { gap: Spacing.md },
  pwdTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },

  actions: { gap: Spacing.md },
});
