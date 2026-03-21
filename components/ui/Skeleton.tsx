import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';

// ─── Base shimmer block ──────────────────────────────────────────────
function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

// ─── Presets ─────────────────────────────────────────────────────────

/** 2-column product grid (menu screen) */
export function MenuSkeleton() {
  return (
    <View style={styles.container}>
      {/* Category chips */}
      <View style={styles.chipsRow}>
        {[80, 60, 70, 55, 65].map((w, i) => (
          <SkeletonBlock key={i} style={{ width: w, height: 32, borderRadius: Radii.pill }} />
        ))}
      </View>
      {/* Product grid */}
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.productCard}>
            <SkeletonBlock style={{ width: '100%', height: 110, borderRadius: Radii.md }} />
            <SkeletonBlock style={{ width: '70%', height: 14, marginTop: 10, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: '40%', height: 14, marginTop: 6, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Stat cards grid (dashboard) */
export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <View style={styles.container}>
      <SkeletonBlock style={{ width: 140, height: 18, borderRadius: 4, marginBottom: Spacing.md }} />
      <View style={styles.statsGrid}>
        {Array.from({ length: cards }).map((_, i) => (
          <View key={i} style={styles.statCard}>
            <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 10 }} />
            <SkeletonBlock style={{ width: 60, height: 22, marginTop: 8, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 50, height: 12, marginTop: 6, borderRadius: 4 }} />
          </View>
        ))}
      </View>
      {/* Order list placeholders */}
      <SkeletonBlock style={{ width: 120, height: 18, borderRadius: 4, marginTop: Spacing.xxl, marginBottom: Spacing.md }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.orderSkel}>
          <View style={styles.orderRowSkel}>
            <SkeletonBlock style={{ width: 70, height: 16, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 60, height: 20, borderRadius: Radii.pill }} />
          </View>
          <SkeletonBlock style={{ width: '55%', height: 12, marginTop: 6, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}

/** Order / kitchen card list */
export function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.orderSkel}>
          <View style={styles.orderRowSkel}>
            <SkeletonBlock style={{ width: 80, height: 16, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 65, height: 22, borderRadius: Radii.pill }} />
          </View>
          <SkeletonBlock style={{ width: '60%', height: 12, marginTop: 8, borderRadius: 4 }} />
          <SkeletonBlock style={{ width: '40%', height: 12, marginTop: 4, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}

/** Kitchen cards (wider, with timer + items) */
export function KitchenSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.kitchenCard}>
          <View style={styles.orderRowSkel}>
            <SkeletonBlock style={{ width: 90, height: 18, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 50, height: 20, borderRadius: Radii.pill }} />
          </View>
          {/* Items */}
          {[0, 1, 2].map(j => (
            <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <SkeletonBlock style={{ width: 22, height: 22, borderRadius: 4 }} />
              <SkeletonBlock style={{ width: '60%', height: 13, borderRadius: 4 }} />
            </View>
          ))}
          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
            <SkeletonBlock style={{ flex: 1, height: 38, borderRadius: Radii.sm }} />
            <SkeletonBlock style={{ flex: 1, height: 38, borderRadius: Radii.sm }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Table grid (tables screen) */
export function TablesSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.container}>
      <View style={styles.tablesGrid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.tableCard}>
            <SkeletonBlock style={{ width: 40, height: 16, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 55, height: 20, borderRadius: Radii.pill, marginTop: 8 }} />
            <SkeletonBlock style={{ width: 30, height: 12, marginTop: 6, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Reports screen (stats + chart placeholder) */
export function ReportsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Period chips */}
      <View style={styles.chipsRow}>
        {[60, 60, 60, 60].map((w, i) => (
          <SkeletonBlock key={i} style={{ width: w, height: 32, borderRadius: Radii.pill }} />
        ))}
      </View>
      {/* Stats */}
      <View style={[styles.statsGrid, { marginTop: Spacing.lg }]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.statCard}>
            <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 10 }} />
            <SkeletonBlock style={{ width: 60, height: 22, marginTop: 8, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 50, height: 12, marginTop: 6, borderRadius: 4 }} />
          </View>
        ))}
      </View>
      {/* Chart placeholder */}
      <SkeletonBlock style={{ width: '100%', height: 160, borderRadius: Radii.md, marginTop: Spacing.xxl }} />
    </View>
  );
}

/** Cash screen */
export function CashSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock style={{ width: 100, height: 18, borderRadius: 4, marginBottom: Spacing.md }} />
      <View style={styles.orderSkel}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <SkeletonBlock style={{ width: 10, height: 10, borderRadius: 5 }} />
          <SkeletonBlock style={{ width: 100, height: 16, borderRadius: 4 }} />
        </View>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
            <SkeletonBlock style={{ width: 120, height: 14, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 70, height: 14, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: Spacing.lg },
  block: { backgroundColor: Colors.border },
  chipsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md },
  productCard: { width: '48.5%', marginBottom: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  orderSkel: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  orderRowSkel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kitchenCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tableCard: {
    width: '30%',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
});

export default SkeletonBlock;
