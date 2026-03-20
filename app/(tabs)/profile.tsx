import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { User, LogOut, Mail, Phone } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Card style={styles.userCard}>
        <View style={styles.avatar}>
          <User size={28} color={Colors.accent} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>

        <View style={styles.infoRow}>
          <Mail size={16} color={Colors.textTertiary} />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        {user?.phone && (
          <View style={styles.infoRow}>
            <Phone size={16} color={Colors.textTertiary} />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
        )}
      </Card>

      <Button title="Cerrar sesión" onPress={handleLogout} variant="danger" fullWidth icon={LogOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  userCard: { alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: FontSizes.md, color: Colors.textSecondary },
});
