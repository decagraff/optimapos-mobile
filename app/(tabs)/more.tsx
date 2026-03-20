import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useServer } from '@/hooks/useServer';
import { useSocket } from '@/hooks/useSocket';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { User, LogOut, Building2, Wifi, WifiOff, RefreshCw } from 'lucide-react-native';

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const { config, disconnect } = useServer();
  const { isConnected } = useSocket();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleChangeServer = () => {
    Alert.alert('Cambiar restaurante', 'Se cerrará tu sesión actual.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        onPress: async () => {
          await disconnect();
          router.replace('/setup');
        },
      },
    ]);
  };

  const handleChangeLocation = () => {
    router.push('/location-select');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* User info */}
      <Card style={styles.userCard}>
        <View style={styles.avatar}>
          <User size={24} color={Colors.accent} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Badge label={user?.role || 'N/A'} color={Colors.accent} />
        </View>
      </Card>

      {/* Server info */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Building2 size={18} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Restaurante</Text>
          <Text style={styles.infoValue}>{config?.slug}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          {isConnected ? <Wifi size={18} color={Colors.success} /> : <WifiOff size={18} color={Colors.danger} />}
          <Text style={styles.infoLabel}>Socket.io</Text>
          <Text style={[styles.infoValue, { color: isConnected ? Colors.success : Colors.danger }]}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versión</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {(user?.locationIds?.length ?? 0) > 1 && (
          <Button title="Cambiar local" onPress={handleChangeLocation} variant="outline" fullWidth icon={RefreshCw} />
        )}
        <Button title="Cambiar restaurante" onPress={handleChangeServer} variant="secondary" fullWidth icon={Building2} />
        <Button title="Cerrar sesión" onPress={handleLogout} variant="danger" fullWidth icon={LogOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxxl },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, gap: Spacing.xs },
  userName: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  infoCard: { gap: 0, padding: 0 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  infoLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.textSecondary },
  infoValue: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  actions: { gap: Spacing.md },
});
