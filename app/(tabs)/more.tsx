import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useServer } from '@/hooks/useServer';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { User, LogOut, Building2, MapPin, Wifi, WifiOff, Package, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { Product } from '@/types';

export default function MoreScreen() {
  const { user, logout, selectedLocationId, selectedLocationName } = useAuth();
  const { config, disconnect } = useServer();
  const { isConnected } = useSocket();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [products, setProducts] = useState<Product[]>([]);
  const [showProducts, setShowProducts] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await api.get<Product[]>(`/api/products/all?locationId=${selectedLocationId || ''}`);
      setProducts(Array.isArray(data) ? data : []);
    } catch {}
  }, [isAdmin, selectedLocationId]);

  useEffect(() => { if (showProducts) fetchProducts(); }, [showProducts, fetchProducts]);

  const handleToggleProduct = async (product: Product) => {
    try {
      await api.toggleProduct(product.id, !product.isActive);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

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
          <MapPin size={18} color={selectedLocationName ? Colors.accent : Colors.textTertiary} />
          <Text style={styles.infoLabel}>Local</Text>
          <Text style={[styles.infoValue, selectedLocationName ? { color: Colors.accent } : {}]}>
            {selectedLocationName || 'No seleccionado'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          {isConnected ? <Wifi size={18} color={Colors.success} /> : <WifiOff size={18} color={Colors.danger} />}
          <Text style={styles.infoLabel}>Conexión</Text>
          <Text style={[styles.infoValue, { color: isConnected ? Colors.success : Colors.danger }]}>
            {isConnected ? 'En línea' : 'Sin conexión'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versión</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </Card>

      {/* Quick Product Toggle (Admin/Manager only) */}
      {isAdmin && (
        <View>
          <Pressable style={styles.toggleSection} onPress={() => setShowProducts(!showProducts)}>
            <Package size={18} color={Colors.accent} />
            <Text style={styles.toggleSectionTitle}>Productos</Text>
            {showProducts ? <ChevronUp size={18} color={Colors.textTertiary} /> : <ChevronDown size={18} color={Colors.textTertiary} />}
          </Pressable>
          {showProducts && (
            <Card style={styles.productList}>
              {products.length === 0 && (
                <Text style={styles.emptyProducts}>Sin productos</Text>
              )}
              {products.map(product => (
                <View key={product.id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, !product.isActive && styles.productInactive]}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>S/ {Number(product.price).toFixed(2)}</Text>
                  </View>
                  <Switch
                    value={product.isActive}
                    onValueChange={() => handleToggleProduct(product)}
                    trackColor={{ false: Colors.border, true: Colors.success + '60' }}
                    thumbColor={product.isActive ? Colors.success : Colors.textTertiary}
                  />
                </View>
              ))}
            </Card>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {user?.role !== 'CLIENT' && (
          <Button title="Cambiar local" onPress={handleChangeLocation} variant="outline" fullWidth icon={MapPin} />
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
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  toggleSectionTitle: { flex: 1, fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  productList: { gap: 0, padding: 0 },
  emptyProducts: { padding: Spacing.lg, fontSize: FontSizes.sm, color: Colors.textTertiary, textAlign: 'center' },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  productName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  productInactive: { color: Colors.textTertiary, textDecorationLine: 'line-through' },
  productPrice: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  actions: { gap: Spacing.md },
});
