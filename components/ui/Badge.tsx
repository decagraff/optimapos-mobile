import { View, Text, StyleSheet } from 'react-native';
import { Radii, Spacing, FontSizes } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color: string;
  textColor?: string;
}

export default function Badge({ label, color, textColor }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color: textColor || color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
