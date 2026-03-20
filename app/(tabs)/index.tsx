import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { TrendingUp, ShoppingCart, DollarSign, XCircle } from 'lucide-react-native';

interface Summary {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  cancelledOrders: number;
}

export default function DashboardScreen() {
  const { user, selectedLocationId } = useAuth();
  const { isConnected } = useSocket();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const locParam = selectedLocationId ? `&locationId=${selectedLocationId}` : '';
      const data = await api.get<Summary>(`/api/reports/summary?${locParam}`);
      setSummary(data);
    } catch {}
  }, [selectedLocationId]);

  useEffect(() => {
    fetchSummary().finally(() => setLoading(false));
  }, [fetchSummary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  const formatMoney = (n: number) => `S/ ${n.toFixed(2)}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>Hola, {user?.name?.split(' ')[0] || 'Usuario'}</Text>
            <Text style={styles.greetingSub}>Resumen de hoy</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.dot, isConnected ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{isConnected ? 'En línea' : 'Sin conexión'}</Text>
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <DollarSign size={20} color={Colors.success} />
              <Text style={styles.statValue}>{summary ? formatMoney(summary.totalSales) : 'S/ 0.00'}</Text>
              <Text style={styles.statLabel}>Ventas hoy</Text>
            </Card>
            <Card style={styles.statCard}>
              <ShoppingCart size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{summary?.totalOrders ?? 0}</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </Card>
            <Card style={styles.statCard}>
              <TrendingUp size={20} color={Colors.info} />
              <Text style={styles.statValue}>{summary ? formatMoney(summary.avgTicket) : 'S/ 0.00'}</Text>
              <Text style={styles.statLabel}>Ticket prom.</Text>
            </Card>
            <Card style={styles.statCard}>
              <XCircle size={20} color={Colors.danger} />
              <Text style={styles.statValue}>{summary?.cancelledOrders ?? 0}</Text>
              <Text style={styles.statLabel}>Cancelados</Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xxl,
  },
  greetingText: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  greetingSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: Colors.success },
  dotOffline: { backgroundColor: Colors.textTertiary },
  statusText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  loadingWrap: { paddingVertical: Spacing.xxxxl, alignItems: 'center' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%' as any,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  statValue: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
});
