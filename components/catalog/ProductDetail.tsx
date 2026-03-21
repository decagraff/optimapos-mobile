import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { X, Minus, Plus, Check } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import type { Product, CartItem, CartAddon, AddonGroup } from '@/types';

interface Props {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
  baseUrl: string;
  locationAddonGroups?: AddonGroup[];
}

export default function ProductDetail({ product, visible, onClose, onAdd, baseUrl, locationAddonGroups }: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>();
  const [selectedAddons, setSelectedAddons] = useState<Map<number, number>>(new Map());
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const hasVariants = product.variants.length > 0;
  const variant = hasVariants ? product.variants.find(v => v.id === selectedVariantId) : undefined;
  const basePrice = variant ? Number(variant.price) || 0 : Number(product.promoPrice ?? product.price) || 0;

  // Use location-wide addon groups if provided
  const allGroups: AddonGroup[] = locationAddonGroups && locationAddonGroups.length > 0
    ? locationAddonGroups
    : product.addonGroups.map(pg => pg.addonGroup);

  // Calculate addons total considering courtesy
  const addonsTotal = (() => {
    let total = 0;
    for (const group of allGroups) {
      const isCourtesy = group.isCourtesy || false;
      const courtesyLimit = group.courtesyLimit || 0;
      const groupAddons = Array.from(selectedAddons.entries())
        .filter(([addonId]) => group.addons.some(a => a.id === addonId))
        .map(([addonId, qty]) => {
          const addon = group.addons.find(a => a.id === addonId);
          return { price: Number(addon?.price) || 0, qty };
        })
        .sort((a, b) => a.price - b.price);

      if (!isCourtesy) {
        total += groupAddons.reduce((sum, a) => sum + a.price * a.qty, 0);
      } else if (courtesyLimit === 0) {
        // Unlimited free
      } else {
        let freeLeft = courtesyLimit;
        for (const a of groupAddons) {
          const freeQty = Math.min(a.qty, freeLeft);
          total += (a.qty - freeQty) * a.price;
          freeLeft -= freeQty;
        }
      }
    }
    return total;
  })();

  const itemTotal = (basePrice + addonsTotal) * quantity;

  const changeAddonQty = (addonId: number, delta: number) => {
    const next = new Map(selectedAddons);
    const current = next.get(addonId) || 0;
    const newQty = current + delta;
    if (newQty <= 0) {
      next.delete(addonId);
    } else {
      next.set(addonId, newQty);
    }
    setSelectedAddons(next);
  };

  const handleAdd = () => {
    const addons: CartAddon[] = [];
    for (const [addonId, qty] of selectedAddons.entries()) {
      for (const group of allGroups) {
        const addon = group.addons.find(a => a.id === addonId);
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
    setSelectedVariantId(undefined);
    setSelectedAddons(new Map());
    setExpandedGroupId(null);
    setQuantity(1);
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setSelectedVariantId(undefined);
    setSelectedAddons(new Map());
    setExpandedGroupId(null);
    setQuantity(1);
    setNotes('');
    onClose();
  };

  const canAdd = !hasVariants || selectedVariantId != null;

  const expandedGroup = allGroups.find(g => g.id === expandedGroupId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <Pressable style={styles.closeBtn} onPress={handleClose}>
          <X size={24} color={Colors.text} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {product.image ? (
            <Image source={{ uri: `${baseUrl}${product.image}` }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}

          <View style={styles.body}>
            <Text style={styles.name}>{product.name}</Text>
            {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
            {product.ingredients ? <Text style={styles.ingredients}>Ingredientes: {product.ingredients}</Text> : null}

            {/* Variants */}
            {hasVariants && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>Tamaño / Variante</Text>
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

            {/* Addon Groups — Card-based */}
            {allGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>Adicionales</Text>

                {/* Category cards */}
                <View style={styles.cardRow}>
                  {allGroups.map(group => {
                    const activeAddons = group.addons.filter(a => a.isActive);
                    if (activeAddons.length === 0) return null;
                    const count = activeAddons.reduce((sum, a) => sum + (selectedAddons.get(a.id) || 0), 0);
                    const isExpanded = expandedGroupId === group.id;
                    return (
                      <Pressable
                        key={group.id}
                        onPress={() => setExpandedGroupId(isExpanded ? null : group.id)}
                        style={[
                          styles.card,
                          isExpanded && styles.cardExpanded,
                          !isExpanded && count > 0 && styles.cardWithCount,
                        ]}
                      >
                        <Text style={[
                          styles.cardText,
                          isExpanded && styles.cardTextExpanded,
                          !isExpanded && count > 0 && styles.cardTextWithCount,
                        ]}>
                          {group.name}
                        </Text>
                        {count > 0 && (
                          <View style={styles.cardBadge}>
                            <Text style={styles.cardBadgeText}>{count}</Text>
                          </View>
                        )}
                        {group.isCourtesy && !count && (
                          <Text style={styles.cardFreeLabel}>gratis</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Expanded group addons */}
                {expandedGroup && (() => {
                  const isCourtesy = expandedGroup.isCourtesy || false;
                  const courtesyLimit = expandedGroup.courtesyLimit || 0;
                  const activeAddons = expandedGroup.addons.filter(a => a.isActive);
                  const selectedInGroup = activeAddons.reduce((sum, a) => sum + (selectedAddons.get(a.id) || 0), 0);
                  const freeRemaining = isCourtesy && courtesyLimit > 0 ? Math.max(0, courtesyLimit - selectedInGroup) : 0;
                  const limitExceeded = isCourtesy && courtesyLimit > 0 && selectedInGroup > courtesyLimit;

                  return (
                    <View style={styles.expandedPanel}>
                      <View style={styles.expandedHeader}>
                        <Text style={styles.expandedTitle}>{expandedGroup.name}</Text>
                        {isCourtesy && courtesyLimit > 0 && (
                          <Text style={[styles.courtesyBadge, freeRemaining === 0 && styles.courtesyBadgeExhausted]}>
                            {freeRemaining > 0 ? `${freeRemaining} gratis restantes` : 'Límite alcanzado'}
                          </Text>
                        )}
                        {isCourtesy && courtesyLimit === 0 && (
                          <Text style={styles.courtesyBadgeFree}>Todo gratis</Text>
                        )}
                      </View>
                      {limitExceeded && (
                        <Text style={styles.courtesyWarning}>
                          Incluye {courtesyLimit} gratis · extras se cobran
                        </Text>
                      )}
                      {activeAddons.map(addon => {
                        const qty = selectedAddons.get(addon.id) || 0;
                        const priceLabel = isCourtesy && courtesyLimit === 0
                          ? 'Gratis'
                          : `+ S/ ${(Number(addon.price) || 0).toFixed(2)}`;

                        return (
                          <View key={addon.id} style={[styles.addonRow, qty > 0 && styles.addonRowSelected]}>
                            <View style={styles.addonInfo}>
                              <Text style={[styles.addonName, qty > 0 && styles.addonNameSelected]}>{addon.name}</Text>
                              <Text style={[styles.addonPrice, isCourtesy && courtesyLimit === 0 && styles.addonPriceFree]}>
                                {priceLabel}
                              </Text>
                            </View>
                            <View style={styles.qtyControls}>
                              <Pressable
                                style={[styles.qtySmBtn, qty === 0 && styles.qtySmBtnDisabled]}
                                onPress={() => changeAddonQty(addon.id, -1)}
                                disabled={qty === 0}
                              >
                                <Minus size={14} color={qty === 0 ? Colors.textTertiary : Colors.text} />
                              </Pressable>
                              <Text style={styles.qtySmText}>{qty}</Text>
                              <Pressable
                                style={styles.qtySmBtn}
                                onPress={() => changeAddonQty(addon.id, 1)}
                              >
                                <Plus size={14} color={Colors.text} />
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>Notas</Text>
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
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitleStandalone: { marginBottom: Spacing.md },

  // Variant options
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
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  radioSelected: { borderColor: Colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  optionName: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  optionPrice: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.accent },

  // Card-based addon group tabs
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  card: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardExpanded: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  cardWithCount: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  cardText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cardTextExpanded: { color: '#1a1a1a' },
  cardTextWithCount: { color: Colors.accent },
  cardBadge: {
    backgroundColor: '#B45309',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  cardBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  cardFreeLabel: { fontSize: 10, color: '#059669' },

  // Expanded addon panel
  expandedPanel: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  expandedTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.text },
  courtesyBadge: { fontSize: FontSizes.xs, fontWeight: '600', color: '#D97706' },
  courtesyBadgeExhausted: { color: '#DC2626' },
  courtesyBadgeFree: { fontSize: FontSizes.xs, fontWeight: '600', color: '#059669' },
  courtesyWarning: { fontSize: FontSizes.xs, color: '#DC2626', marginBottom: Spacing.sm },

  // Addon rows inside expanded panel
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addonRowSelected: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  addonInfo: { flex: 1, marginRight: Spacing.sm },
  addonName: { fontSize: FontSizes.sm, color: Colors.text },
  addonNameSelected: { color: Colors.accent, fontWeight: '600' },
  addonPrice: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 1 },
  addonPriceFree: { color: '#059669' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtySmBtn: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  qtySmBtnDisabled: { opacity: 0.3 },
  qtySmText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.text, minWidth: 20, textAlign: 'center' },

  // Notes
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

  // Footer
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
    width: 36, height: 36, borderRadius: Radii.sm,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, minWidth: 28, textAlign: 'center' },
});
