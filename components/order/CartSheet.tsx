import { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import type { CartItem } from '@/types';

interface Props {
  items: CartItem[];
  total: number;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const CartSheet = forwardRef<BottomSheet, Props>(({ items, total, onUpdateQty, onRemove, onCheckout }, ref) => {
  const snapPoints = useMemo(() => ['50%', '85%'], []);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const renderItem = useCallback(({ item }: { item: CartItem }) => {
    const addonsText = item.addons.length > 0
      ? item.addons.map(a => a.name).join(', ')
      : null;
    const addonsTotal = item.addons.reduce((s, a) => s + a.price * a.quantity, 0);
    const lineTotal = (item.unitPrice + addonsTotal) * item.quantity;

    return (
      <View style={styles.item}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
          {item.variantName && <Text style={styles.itemMeta}>{item.variantName}</Text>}
          {addonsText && <Text style={styles.itemMeta}>{addonsText}</Text>}
          {item.notes && <Text style={styles.itemNotes}>"{item.notes}"</Text>}
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemPrice}>S/ {lineTotal.toFixed(2)}</Text>
          <View style={styles.qtyRow}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => item.quantity <= 1 ? onRemove(item.id) : onUpdateQty(item.id, item.quantity - 1)}
            >
              {item.quantity <= 1 ? <Trash2 size={14} color={Colors.danger} /> : <Minus size={14} color={Colors.text} />}
            </Pressable>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => onUpdateQty(item.id, item.quantity + 1)}>
              <Plus size={14} color={Colors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }, [onUpdateQty, onRemove]);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <ShoppingCart size={20} color={Colors.accent} />
          <Text style={styles.title}>Tu pedido</Text>
          <Text style={styles.count}>{items.reduce((s, i) => s + i.quantity, 0)} items</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>S/ {total.toFixed(2)}</Text>
          </View>
          <Button title="Continuar" onPress={onCheckout} size="lg" fullWidth />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

CartSheet.displayName = 'CartSheet';
export default CartSheet;

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: Colors.background },
  handle: { backgroundColor: Colors.textTertiary, width: 40 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, flex: 1 },
  count: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  list: { paddingHorizontal: Spacing.xl },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },
  item: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  itemMeta: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  itemNotes: { fontSize: FontSizes.xs, color: Colors.accent, fontStyle: 'italic' },
  itemRight: { alignItems: 'flex-end', gap: Spacing.sm },
  itemPrice: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, minWidth: 20, textAlign: 'center' },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.lg,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  totalValue: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.accent },
});
