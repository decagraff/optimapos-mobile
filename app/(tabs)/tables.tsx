import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, Radii, TableStatusColors } from '@/constants/theme';
import { Grid3X3, Users } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { TablesSkeleton } from '@/components/ui/Skeleton';
import { useResponsive } from '@/hooks/useResponsive';
import type { Table } from '@/types';

import { TABLE_STATUS_LABELS } from '@/constants/labels';
const STATUS_LABELS = TABLE_STATUS_LABELS;

export default function TablesScreen() {
  const { selectedLocationId } = useAuth();
  const { socket } = useSocket();
  const { tableColumns } = useResponsive();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      const data = await api.getTables(selectedLocationId || undefined);
      setTables(Array.isArray(data) ? data : []);
    } catch (err) { console.warn('[Tables] Failed:', err); }
  }, [selectedLocationId]);

  useEffect(() => { fetchTables().finally(() => setLoading(false)); }, [fetchTables]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchTables();
    socket.on('table:updated', refresh);
    socket.on('new_order', refresh);
    socket.on('order_updated', refresh);
    return () => {
      socket.off('table:updated', refresh);
      socket.off('new_order', refresh);
      socket.off('order_updated', refresh);
    };
  }, [socket, fetchTables]);

  const onRefresh = async () => { setRefreshing(true); await fetchTables(); setRefreshing(false); };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TablesSkeleton />
      </SafeAreaView>
    );
  }

  const free = tables.filter(t => t.status === 'FREE' || t.status === 'AVAILABLE').length;
  const occupied = tables.filter(t => t.status === 'OCCUPIED').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Grid3X3 size={22} color={Colors.accent} />
        <Text style={styles.headerTitle}>Mesas</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.summaryNum, { color: Colors.success }]}>{free}</Text>
          <Text style={styles.summaryLabel}>Libres</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: Colors.dangerLight }]}>
          <Text style={[styles.summaryNum, { color: Colors.danger }]}>{occupied}</Text>
          <Text style={styles.summaryLabel}>Ocupadas</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.summaryNum, { color: Colors.primary }]}>{tables.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={tables}
        keyExtractor={t => String(t.id)}
        key={`tables-${tableColumns}`}
        numColumns={tableColumns}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />}
        ListEmptyComponent={<EmptyState icon={Grid3X3} title="Sin mesas" subtitle="No hay mesas configuradas" />}
        renderItem={({ item: table }) => {
          const isFree = table.status === 'FREE' || table.status === 'AVAILABLE';
          const statusColor = TableStatusColors[table.status] || Colors.textSecondary;
          return (
            <View style={[styles.tableCell, { borderColor: statusColor }]}>
              <Text style={styles.tableNumber}>{table.number}</Text>
              <Text style={[styles.tableStatus, { color: statusColor }]}>
                {STATUS_LABELS[table.status] || table.status}
              </Text>
              <View style={styles.tableMeta}>
                <Users size={10} color={Colors.textTertiary} />
                <Text style={styles.tableCapacity}>{table.capacity}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.sm,
    gap: 2,
  },
  summaryNum: { fontSize: FontSizes.xxl, fontWeight: '700' },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  gridRow: { gap: Spacing.sm, justifyContent: 'flex-start' },
  grid: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxxxl },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    gap: 4,
  },
  tableNumber: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  tableStatus: { fontSize: FontSizes.xs, fontWeight: '600' },
  tableMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tableCapacity: { fontSize: FontSizes.xs, color: Colors.textTertiary },
});
