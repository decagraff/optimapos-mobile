import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Colors, Spacing, FontSizes, Radii, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { TrendingUp, ShoppingCart, DollarSign, Users } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hola, {user?.name?.split(' ')[0] || 'Usuario'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, isConnected ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{isConnected ? 'Conectado' : 'Sin conexión'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <DollarSign size={20} color={Colors.success} />
            <Text style={styles.statValue}>S/ --</Text>
            <Text style={styles.statLabel}>Ventas hoy</Text>
          </Card>
          <Card style={styles.statCard}>
            <ShoppingCart size={20} color={Colors.primary} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </Card>
          <Card style={styles.statCard}>
            <TrendingUp size={20} color={Colors.info} />
            <Text style={styles.statValue}>S/ --</Text>
            <Text style={styles.statLabel}>Ticket prom.</Text>
          </Card>
          <Card style={styles.statCard}>
            <Users size={20} color={Colors.warning} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </Card>
        </View>

        {/* Placeholder */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Dashboard</Text>
          <Text style={styles.infoText}>
            Las estadísticas en tiempo real se mostrarán aquí en la próxima fase.
          </Text>
        </Card>
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
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  greetingText: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: Colors.success },
  dotOffline: { backgroundColor: Colors.textTertiary },
  statusText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    width: '47%' as any,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  statValue: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  infoCard: { padding: Spacing.xl },
  infoTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  infoText: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 20 },
});
