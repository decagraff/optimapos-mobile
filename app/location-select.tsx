import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Colors, Spacing, FontSizes, Radii, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { MapPin, Building2, Check } from 'lucide-react-native';
import type { Location } from '@/types';

export default function LocationSelectScreen() {
  const { user, selectLocation } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    api.getLocations().then(locs => {
      // Filter to only locations the user has access to
      const allowed = user?.locationIds || [];
      const filtered = allowed.length > 0
        ? locs.filter(l => allowed.includes(l.id) && l.isActive)
        : locs.filter(l => l.isActive);
      setLocations(filtered);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleSelect = async (loc: Location) => {
    setSelected(loc.id);
    await selectLocation(loc.id);
    router.replace('/(tabs)');
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>OptimaPOS</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Seleccionar local</Text>
        <Text style={styles.subtitle}>¿En qué local vas a trabajar hoy?</Text>

        <FlatList
          data={locations}
          keyExtractor={l => String(l.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              onPress={() => handleSelect(item)}
              style={[
                styles.locCard,
                selected === item.id && styles.locCardSelected,
              ]}
            >
              <View style={styles.locRow}>
                <View style={[styles.locIcon, item.isMain && styles.locIconMain]}>
                  <Building2 size={20} color={item.isMain ? Colors.accent : Colors.textSecondary} />
                </View>
                <View style={styles.locInfo}>
                  <View style={styles.locNameRow}>
                    <Text style={styles.locName}>{item.name}</Text>
                    {item.isMain && (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>PRINCIPAL</Text>
                      </View>
                    )}
                  </View>
                  {item.address && (
                    <View style={styles.locAddress}>
                      <MapPin size={12} color={Colors.textTertiary} />
                      <Text style={styles.locAddressText}>{item.address}</Text>
                    </View>
                  )}
                </View>
                {selected === item.id && (
                  <View style={styles.checkCircle}>
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
            </Card>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingTop: 70,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  locCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locCardSelected: {
    borderColor: Colors.accent,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  locIconMain: {
    backgroundColor: Colors.accentLight,
  },
  locInfo: {
    flex: 1,
  },
  locNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  mainBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  mainBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accent,
  },
  locAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locAddressText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
