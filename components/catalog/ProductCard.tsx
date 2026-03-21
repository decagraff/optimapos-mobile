import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, FontSizes, Radii, Shadows } from '@/constants/theme';
import { ShoppingCart, AlertCircle, Heart } from 'lucide-react-native';
import type { Product } from '@/types';

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  baseUrl: string;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: number) => void;
}

export default function ProductCard({ product, onPress, baseUrl, isFavorite, onToggleFavorite }: Props) {
  const price = Number(product.price) || 0;
  const promo = product.promoPrice != null ? Number(product.promoPrice) : null;
  const outOfStock = product.stockEnabled && (product.stockCurrent ?? 0) <= 0;
  const hasPromo = promo != null && promo < price;
  const displayPrice = hasPromo ? promo! : price;
  const hasVariants = product.variants.length > 0;
  const imageUri = product.image ? `${baseUrl}${product.image}` : null;

  return (
    <Pressable
      style={[styles.card, outOfStock && styles.cardDisabled]}
      onPress={() => !outOfStock && onPress(product)}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <ShoppingCart size={24} color={Colors.textTertiary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        {product.description ? (
          <Text style={styles.description} numberOfLines={1}>{product.description}</Text>
        ) : null}
        <View style={styles.priceRow}>
          {hasVariants ? (
            <Text style={styles.priceFrom}>Desde S/ {Math.min(displayPrice, ...product.variants.map(v => Number(v.price) || 0)).toFixed(2)}</Text>
          ) : (
            <>
              <Text style={styles.price}>S/ {displayPrice.toFixed(2)}</Text>
              {hasPromo && <Text style={styles.oldPrice}>S/ {price.toFixed(2)}</Text>}
            </>
          )}
        </View>
      </View>

      {outOfStock && (
        <View style={styles.stockBadge}>
          <AlertCircle size={10} color={Colors.danger} />
          <Text style={styles.stockText}>Agotado</Text>
        </View>
      )}

      {onToggleFavorite && (
        <Pressable
          style={styles.favBtn}
          onPress={(e) => { e.stopPropagation?.(); onToggleFavorite(product.id); }}
          hitSlop={8}
        >
          <Heart
            size={18}
            color={isFavorite ? Colors.danger : Colors.textTertiary}
            fill={isFavorite ? Colors.danger : 'none'}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.borderLight,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.md,
    gap: 4,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  price: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.accent,
  },
  priceFrom: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.accent,
  },
  oldPrice: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  stockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  stockText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.danger,
  },
  favBtn: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
