import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Alert } from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { X, UtensilsCrossed, ShoppingBag, MapPin } from 'lucide-react-native';
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
  const { selectedLocationId } = useAuth();
  const cart = useCart();
  const [tables, setTables] = useState<Table[]>([]);
  const [showTables, setShowTables] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && selectedLocationId) {
      api.getTables(selectedLocationId).then(t => setTables(Array.isArray(t) ? t : [])).catch(() => {});
    }
  }, [visible, selectedLocationId]);

  const handleSubmit = async () => {
    if (cart.orderType === 'DINE_IN' && !cart.tableId) {
      setError('Selecciona una mesa');
      return;
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirmar pedido</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Order Type */}
          <Text style={styles.sectionTitle}>Tipo de pedido</Text>
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeOption, cart.orderType === 'DINE_IN' && styles.typeSelected]}
              onPress={() => cart.setOrderType('DINE_IN')}
            >
              <UtensilsCrossed size={20} color={cart.orderType === 'DINE_IN' ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.typeText, cart.orderType === 'DINE_IN' && styles.typeTextSelected]}>En mesa</Text>
            </Pressable>
            <Pressable
              style={[styles.typeOption, cart.orderType === 'TAKEAWAY' && styles.typeSelected]}
              onPress={() => { cart.setOrderType('TAKEAWAY'); cart.setTable(null, null); }}
            >
              <ShoppingBag size={20} color={cart.orderType === 'TAKEAWAY' ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.typeText, cart.orderType === 'TAKEAWAY' && styles.typeTextSelected]}>Para llevar</Text>
            </Pressable>
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
        </View>

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
  body: { flex: 1, padding: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.xl, marginBottom: Spacing.md },
  typeRow: { flexDirection: 'row', gap: Spacing.md },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  typeSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  typeText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textSecondary },
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
