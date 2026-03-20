import { View, Text, StyleSheet, FlatList, Modal, Pressable } from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { X, Users, Check } from 'lucide-react-native';
import type { Table } from '@/types';

interface Props {
  visible: boolean;
  tables: Table[];
  selectedId: number | null;
  onSelect: (table: Table) => void;
  onClose: () => void;
}

export default function TableSelector({ visible, tables, selectedId, onSelect, onClose }: Props) {
  const zones = [...new Set(tables.map(t => t.zone || 'Sin zona'))];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar mesa</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={Colors.text} />
          </Pressable>
        </View>

        <FlatList
          data={tables}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item: table }) => {
            const isFree = table.status === 'FREE' || table.status === 'AVAILABLE';
            const isSelected = selectedId === table.id;
            return (
              <Pressable
                style={[styles.tableCard, isSelected && styles.tableSelected, !isFree && styles.tableOccupied]}
                onPress={() => isFree && onSelect(table)}
                disabled={!isFree}
              >
                <View style={[styles.tableNumber, isFree ? styles.tableNumberFree : styles.tableNumberOccupied]}>
                  <Text style={styles.tableNumberText}>{table.number}</Text>
                </View>
                <View style={styles.tableInfo}>
                  <Text style={styles.tableName}>{table.name}</Text>
                  <View style={styles.tableMeta}>
                    <Users size={12} color={Colors.textTertiary} />
                    <Text style={styles.tableCapacity}>{table.capacity}</Text>
                    {table.zone && <Text style={styles.tableZone}>· {table.zone}</Text>}
                  </View>
                </View>
                <View style={styles.tableStatus}>
                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : (
                    <Text style={[styles.statusText, isFree ? styles.statusFree : styles.statusOccupied]}>
                      {isFree ? 'Libre' : table.status === 'RESERVED' ? 'Reservada' : 'Ocupada'}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
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
  list: { padding: Spacing.lg, gap: Spacing.sm },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tableSelected: { borderColor: Colors.accent },
  tableOccupied: { opacity: 0.5 },
  tableNumber: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tableNumberFree: { backgroundColor: Colors.successLight },
  tableNumberOccupied: { backgroundColor: Colors.dangerLight },
  tableNumberText: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
  tableInfo: { flex: 1, gap: 2 },
  tableName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  tableMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tableCapacity: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  tableZone: { fontSize: FontSizes.xs, color: Colors.textTertiary },
  tableStatus: {},
  statusText: { fontSize: FontSizes.xs, fontWeight: '600' },
  statusFree: { color: Colors.success },
  statusOccupied: { color: Colors.danger },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
