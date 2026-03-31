import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { ShoppingCart } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useServer } from '@/hooks/useServer';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { api } from '@/services/api';
import CategoryChips from '@/components/catalog/CategoryChips';
import ProductCard from '@/components/catalog/ProductCard';
import ProductDetail from '@/components/catalog/ProductDetail';
import CartSheet from '@/components/order/CartSheet';
import CheckoutModal from '@/components/order/CheckoutModal';
import { MenuSkeleton } from '@/components/ui/Skeleton';
import { useResponsive } from '@/hooks/useResponsive';
import type { Product, Category, CartItem, AddonGroup } from '@/types';

export default function MenuScreen() {
  const { selectedLocationId, selectedLocationName } = useAuth();
  const { config } = useServer();
  const cart = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const cartRef = useRef<BottomSheet>(null);
  const { productColumns, isTablet, contentPadding } = useResponsive();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const baseUrl = config?.baseUrl || '';

  const fetchData = useCallback(async () => {
    try {
      const [cats, prods, addGrps] = await Promise.all([
        api.getCategories(selectedLocationId || undefined),
        api.getProducts(selectedLocationId || undefined),
        api.getAddonGroups(selectedLocationId || undefined),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setAddonGroups(Array.isArray(addGrps) ? addGrps : []);
    } catch (err) { console.warn("[Menu] Failed:", err); }
  }, [selectedLocationId]);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products;

  const handleAddToCart = (item: CartItem) => {
    cart.addItem(item);
  };

  const handleOpenCart = () => {
    cartRef.current?.snapToIndex(0);
  };

  const handleCheckout = () => {
    cartRef.current?.close();
    setShowCheckout(true);
  };

  const handleOrderSuccess = () => {
    setShowCheckout(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <MenuSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Carta</Text>
          {selectedLocationName && <Text style={styles.headerSub}>{selectedLocationName}</Text>}
        </View>
      </View>

      {/* Categories */}
      <CategoryChips
        categories={categories}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={p => String(p.id)}
        key={`products-${productColumns}`}
        numColumns={productColumns}
        columnWrapperStyle={{ gap: Spacing.md }}
        contentContainerStyle={[styles.grid, { paddingHorizontal: contentPadding }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: `${100 / productColumns}%` }}>
            <ProductCard
              product={item}
              onPress={setSelectedProduct}
              baseUrl={baseUrl}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay productos disponibles</Text>
          </View>
        }
      />

      {/* FAB Cart */}
      {cart.itemCount > 0 && (
        <Pressable style={styles.fab} onPress={handleOpenCart}>
          <ShoppingCart size={22} color="#FFFFFF" />
          <Text style={styles.fabText}>Ver pedido · S/ {cart.total.toFixed(2)}</Text>
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{cart.itemCount}</Text>
          </View>
        </Pressable>
      )}

      {/* Product Detail Modal */}
      <ProductDetail
        product={selectedProduct}
        visible={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={handleAddToCart}
        baseUrl={baseUrl}
        locationAddonGroups={addonGroups}
      />

      {/* Cart Bottom Sheet */}
      <CartSheet
        ref={cartRef}
        items={cart.items}
        total={cart.total}
        onUpdateQty={cart.updateQty}
        onRemove={cart.removeItem}
        onCheckout={handleCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleOrderSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 2 },
  row: { gap: Spacing.md },
  grid: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FontSizes.md, color: Colors.textTertiary },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radii.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { fontSize: FontSizes.md, fontWeight: '700', color: '#FFFFFF' },
  fabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  fabBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
});
