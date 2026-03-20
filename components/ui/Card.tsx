import { View, Pressable, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { Colors, Radii, Spacing, Shadows } from '@/constants/theme';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
}

export default function Card({ children, style, onPress, padding = Spacing.lg }: CardProps) {
  const inner = [styles.card, Shadows.card, { padding }, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...inner, pressed && styles.pressed] as ViewStyle[]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={inner}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pressed: {
    opacity: 0.95,
  },
});
