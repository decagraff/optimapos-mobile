import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useServer } from '@/hooks/useServer';
import { useAuth } from '@/hooks/useAuth';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { api } from '@/services/api';
import { DEFAULT_ROUTE } from '@/utils/roles';
import type { Role } from '@/types';

SplashScreen.preventAutoHideAsync();

export default function SplashRouter() {
  const { isLoading: serverLoading, isConfigured } = useServer();
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (serverLoading || authLoading) return;

    (async () => {
      await SplashScreen.hideAsync();

      if (!isConfigured) {
        router.replace('/setup');
        return;
      }

      // Validate server is reachable
      try {
        await api.health();
      } catch {
        router.replace('/setup');
        return;
      }

      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      // Check if location selection is needed
      try {
        const locations = await api.getLocations();
        const activeLocations = locations.filter((l: any) => l.isActive);
        if (activeLocations.length > 1) {
          const { storage } = await import('@/services/storage');
          const saved = await storage.getLocationId();
          if (!saved) {
            router.replace('/location-select');
            return;
          }
        }
      } catch {}

      const role = (user?.role as Role) || 'CLIENT';
      router.replace(DEFAULT_ROUTE[role] || '/(tabs)');
    })();
  }, [serverLoading, authLoading, isConfigured, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>OptimaPOS</Text>
      <Text style={styles.subtitle}>Punto de venta para restaurantes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
  },
});
