import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Colors, Radii, Spacing, FontSizes } from '@/constants/theme';
import type { LucideIcon } from 'lucide-react-native';

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<Variant, { bg: string; bgPressed: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary, bgPressed: Colors.primaryDark, text: '#FFFFFF' },
  accent: { bg: Colors.accent, bgPressed: Colors.accentDark, text: '#FFFFFF' },
  secondary: { bg: Colors.borderLight, bgPressed: Colors.border, text: Colors.text },
  outline: { bg: 'transparent', bgPressed: Colors.primaryLight, text: Colors.primary, border: Colors.border },
  danger: { bg: Colors.danger, bgPressed: '#B91C1C', text: '#FFFFFF' },
  ghost: { bg: 'transparent', bgPressed: Colors.borderLight, text: Colors.textSecondary },
};

const sizeStyles: Record<string, { py: number; px: number; fontSize: number; iconSize: number }> = {
  sm: { py: Spacing.sm, px: Spacing.lg, fontSize: FontSizes.sm, iconSize: 16 },
  md: { py: Spacing.md, px: Spacing.xl, fontSize: FontSizes.md, iconSize: 18 },
  lg: { py: Spacing.lg, px: Spacing.xxl, fontSize: FontSizes.lg, iconSize: 20 },
};

export default function Button({ title, onPress, variant = 'primary', loading, disabled, icon: Icon, fullWidth, size = 'md' }: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? v.bgPressed : v.bg,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
      ] as ViewStyle[]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.content}>
          {Icon && <Icon size={s.iconSize} color={v.text} style={{ marginRight: Spacing.sm }} />}
          <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
