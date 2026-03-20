import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { X, UtensilsCrossed, ShoppingBag, Truck, MapPin, Phone, User as UserIcon } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { Table } from '@/types';
import TableSelector from './TableSelector';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ visible, onClose, onSuccess }: Props) {
  const { selectedLocationId, user } = useAuth();
  const cart = useCart();
  const [tables, setTables] = useState<Table[]>([]);
  const [showTables, setShowTables] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Delivery fields for clients
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryName, setDeliveryName] = useState(user?.name || '');

  const isClient = user?.role === 'CLIENT';
  const isStaff = !isClient;

  useEffect(() => {
    if (visible && selectedLocationId) {
      api.getTables(selectedLocationId).then(t => setTables(Array.isArray(t) ? t : [])).catch(() => {});
    }
  }, [visible, selectedLocationId]);

  // Reset delivery fields when modal opens
  useEffect(() => {
    if (visible) {
      setDeliveryAddress(user?.address || '');
      setDeliveryPhone(user?.phone || '');
      setDeliveryName(user?.name || '');
      setError('');
    }
  }, [visible, user]);

  const handleSubmit = async () => {
    if (cart.orderType === 'DINE_IN' && !cart.tableId) {
      setError('Selecciona una mesa');
      return;
    }
    if (cart.orderType === 'DELIVERY') {
      if (!deliveryAddress.trim()) {
        setError('Ingresa la dirección de entrega');
        return;
      }
      if (!deliveryPhone.trim()) {
        setError('Ingresa un teléfono de contacto');
        return;
      }
    }
    if (cart.items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      // Backend uses PICKUP not TAKEAWAY
      const type = cart.orderType === 'TAKEAWAY' ? 'PICKUP' : cart.orderType;

      const orderData: Record<string, any> = {
        type,
        items: cart.items.map(item => {
          const orderItem: Record<string, any> = {
            productId: item.productId,
            quantity: item.quantity,
          };
          if (item.variantId) orderItem.variantId = item.variantId;
          if (item.notes) orderItem.notes = item.notes;
          if (item.addons.length > 0) {
            orderItem.addons = item.addons.map(a => ({ addonId: a.addonId, quantity: a.quantity }));
          }
          return orderItem;
        }),
      };
      if (selectedLocationId) orderData.locationId = selectedLocationId;
      if (type === 'DINE_IN' && cart.tableId) orderData.tableId = cart.tableId;
      if (cart.notes) orderData.notes = cart.notes;

      // Delivery data
      if (type === 'DELIVERY') {
        orderData.guestAddress = deliveryAddress.trim();
        if (deliveryPhone.trim()) orderData.guestPhone = deliveryPhone.trim();
        if (deliveryName.trim()) orderData.guestName = deliveryName.trim();
      }

      await api.createOrder(orderData);
      cart.clear();
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Error al enviar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table: Table) => {
    cart.setTable(table.id, table.name);
    setShowTables(false);
    setError('');
  };

  // Order type options depending on role
  const orderTypes: { key: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'; label: string; icon: any }[] = isClient
    ? [
        { key: 'TAKEAWAY', label: 'Para recoger', icon: ShoppingBag },
        { key: 'DELIVERY', label: 'Delivery', icon: Truck },
        { key: 'DINE_IN', label: 'En mesa', icon: UtensilsCrossed },
      ]
    : [
        { key: 'DINE_IN', label: 'En mesa', icon: UtensilsCrossed },
        { key: 'TAKEAWAY', label: 'Para llevar', icon: ShoppingBag },
        { key: 'DELIVERY', label: 'Delivery', icon: Truck },
      ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirmar pedido</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.body}>
          {/* Order Type */}
          <Text style={styles.sectionTitle}>Tipo de pedido</Text>
          <View style={styles.typeRow}>
            {orderTypes.map(opt => (
              <Pressable
                key={opt.key}
                style={[styles.typeOption, cart.orderType === opt.key && styles.typeSelected]}
                onPress={() => {
                  cart.setOrderType(opt.key);
                  if (opt.key !== 'DINE_IN') cart.setTable(null, null);
                }}
              >
                <opt.icon size={18} color={cart.orderType === opt.key ? Colors.accent : Colors.textSecondary} />
                <Text style={[styles.typeText, cart.orderType === opt.key && styles.typeTextSelected]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Table selection */}
          {cart.orderType === 'DINE_IN' && (
            <>
              <Text style={styles.sectionTitle}>Mesa</Text>
              <Pressable style={styles.tableBtn} onPress={() => setShowTables(true)}>
                <MapPin size={18} color={cart.tableId ? Colors.accent : Colors.textTertiary} />
                <Text style={[styles.tableBtnText, cart.tableId != null && styles.tableBtnTextActive]}>
                  {cart.tableName || 'Seleccionar mesa'}
                </Text>
              </Pressable>
            </>
          )}

          {/* Delivery fields */}
          {cart.orderType === 'DELIVERY' && (
            <>
              <Text style={styles.sectionTitle}>Datos de entrega</Text>
              <View style={styles.inputRow}>
                <UserIcon size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.deliveryInput}
                  value={deliveryName}
                  onChangeText={setDeliveryName}
                  placeholder="Nombre"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={styles.inputRow}>
                <Phone size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.deliveryInput}
                  value={deliveryPhone}
                  onChangeText={setDeliveryPhone}
                  placeholder="Teléfono *"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputRow}>
                <MapPin size={18} color={Colors.textTertiary} />
                <TextInput
                  style={[styles.deliveryInput, { minHeight: 50 }]}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder="Dirección de entrega *"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                />
              </View>
            </>
          )}

          {/* Notes */}
          <Text style={styles.sectionTitle}>Notas del pedido</Text>
          <TextInput
            style={styles.notesInput}
            value={cart.notes}
            onChangeText={cart.setNotes}
            placeholder="Instrucciones adicionales..."
            placeholderTextColor={Colors.textTertiary}
            multiline
          />

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{cart.itemCount} items</Text>
              <Text style={styles.summaryValue}>S/ {cart.total.toFixed(2)}</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Enviar pedido"
            onPress={handleSubmit}
            loading={loading}
            disabled={cart.items.length === 0}
            size="lg"
            fullWidth
          />
        </View>
      </View>

      <TableSelector
        visible={showTables}
        tables={tables}
        selectedId={cart.tableId}
        onSelect={handleTableSelect}
        onClose={() => setShowTables(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
  closeBtn: { padding: Spacing.xs },
  scrollBody: { flex: 1 },
  body: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.xl, marginBottom: Spacing.md },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  typeSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  typeText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary },
  typeTextSelected: { color: Colors.accent },
  tableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tableBtnText: { fontSize: FontSizes.md, color: Colors.textTertiary },
  tableBtnTextActive: { color: Colors.text, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: Spacing.sm,
  },
  deliveryInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },

  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontSize: FontSizes.md,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summary: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: FontSizes.lg, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.accent },
  error: { color: Colors.danger, fontSize: FontSizes.sm, textAlign: 'center', marginTop: Spacing.lg },
  footer: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
});
