import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import type { Category } from '@/types';

interface Props {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategoryChips({ categories, selectedId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Pressable
        style={[styles.chip, selectedId === null && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, selectedId === null && styles.chipTextActive]}>Todo</Text>
      </Pressable>
      {categories.map(cat => (
        <Pressable
          key={cat.id}
          style={[styles.chip, selectedId === cat.id && styles.chipActive]}
          onPress={() => onSelect(cat.id)}
        >
          <Text style={[styles.chipText, selectedId === cat.id && styles.chipTextActive]}>
            {cat.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
