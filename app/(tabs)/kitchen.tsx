import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { ChefHat } from 'lucide-react-native';

export default function CocinaScreen() {
  return (
    <View style={styles.container}>
      <ChefHat size={48} color={Colors.textTertiary} />
      <Text style={styles.title}>Cocina</Text>
      <Text style={styles.subtitle}>Pedidos en cocina — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
