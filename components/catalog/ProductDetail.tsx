import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { X, Minus, Plus, Check } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import type { Product, CartItem, CartAddon } from '@/types';

interface Props {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
  baseUrl: string;
}

export default function ProductDetail({ product, visible, onClose, onAdd, baseUrl }: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>();
  const [selectedAddons, setSelectedAddons] = useState<Map<number, number>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const hasVariants = product.variants.length > 0;
  const variant = hasVariants ? product.variants.find(v => v.id === selectedVariantId) : undefined;
  const basePrice = variant ? Number(variant.price) || 0 : Number(product.promoPrice ?? product.price) || 0;

  const addonsTotal = Array.from(selectedAddons.entries()).reduce((sum, [addonId, qty]) => {
    for (const ag of product.addonGroups) {
      const addon = ag.addonGroup.addons.find(a => a.id === addonId);
      if (addon) return sum + (Number(addon.price) || 0) * qty;
    }
    return sum;
  }, 0);

  const itemTotal = (basePrice + addonsTotal) * quantity;

  const toggleAddon = (addonId: number) => {
    const next = new Map(selectedAddons);
    if (next.has(addonId)) {
      next.delete(addonId);
    } else {
      next.set(addonId, 1);
    }
    setSelectedAddons(next);
  };

  const handleAdd = () => {
    const addons: CartAddon[] = [];
    for (const [addonId, qty] of selectedAddons.entries()) {
      for (const ag of product.addonGroups) {
        const addon = ag.addonGroup.addons.find(a => a.id === addonId);
        if (addon) {
          addons.push({ addonId: addon.id, name: addon.name, price: addon.price, quantity: qty });
        }
      }
    }

    const item: CartItem = {
      id: `${product.id}-${selectedVariantId || 0}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image || undefined,
      variantId: selectedVariantId,
      variantName: variant?.name,
      unitPrice: basePrice,
      quantity,
      notes: notes.trim() || undefined,
      addons,
    };

    onAdd(item);
    // Reset state
    setSelectedVariantId(undefined);
    setSelectedAddons(new Map());
    setQuantity(1);
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setSelectedVariantId(undefined);
    setSelectedAddons(new Map());
    setQuantity(1);
    setNotes('');
    onClose();
  };

  const canAdd = !hasVariants || selectedVariantId != null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={handleClose}>
          <X size={24} color={Colors.text} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Image */}
          {product.image ? (
            <Image source={{ uri: `${baseUrl}${product.image}` }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}

          {/* Info */}
          <View style={styles.body}>
            <Text style={styles.name}>{product.name}</Text>
            {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
            {product.ingredients ? <Text style={styles.ingredients}>Ingredientes: {product.ingredients}</Text> : null}

            {/* Variants */}
            {hasVariants && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tamaño / Variante</Text>
                {product.variants.filter(v => v.isActive).map(v => (
                  <Pressable
                    key={v.id}
                    style={[styles.option, selectedVariantId === v.id && styles.optionSelected]}
                    onPress={() => setSelectedVariantId(v.id)}
                  >
                    <View style={[styles.radio, selectedVariantId === v.id && styles.radioSelected]}>
                      {selectedVariantId === v.id && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.optionName}>{v.name}</Text>
                    <Text style={styles.optionPrice}>S/ {(Number(v.price) || 0).toFixed(2)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Addon Groups */}
            {product.addonGroups.map(({ addonGroup }) => (
              <View key={addonGroup.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{addonGroup.name}</Text>
                {addonGroup.addons.filter(a => a.isActive).map(addon => {
                  const isSelected = selectedAddons.has(addon.id);
                  return (
                    <Pressable
                      key={addon.id}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => toggleAddon(addon.id)}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={styles.optionName}>{addon.name}</Text>
                      {Number(addon.price) > 0 && <Text style={styles.optionPrice}>+ S/ {(Number(addon.price) || 0).toFixed(2)}</Text>}
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: sin cebolla, extra limón..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                maxLength={200}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.qtyRow}>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus size={18} color={Colors.text} />
            </Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
              <Plus size={18} color={Colors.text} />
            </Pressable>
          </View>
          <Button
            title={`Agregar · S/ ${itemTotal.toFixed(2)}`}
            onPress={handleAdd}
            disabled={!canAdd}
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: Spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  scroll: { paddingBottom: 100 },
  image: { width: '100%', height: 250, backgroundColor: Colors.borderLight },
  imagePlaceholder: { width: '100%', height: 100, backgroundColor: Colors.borderLight },
  body: { padding: Spacing.xl },
  name: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  description: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  ingredients: { fontSize: FontSizes.sm, color: Colors.textTertiary, fontStyle: 'italic', marginBottom: Spacing.md },
  section: { marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radii.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioSelected: { borderColor: Colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  optionName: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  optionPrice: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.accent },
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, minWidth: 28, textAlign: 'center' },
});
