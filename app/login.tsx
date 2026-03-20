import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useServer } from '@/hooks/useServer';
import { api } from '@/services/api';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { LogIn } from 'lucide-react-native';

export default function LoginScreen() {
  const { login, selectLocation } = useAuth();
  const { config, disconnect } = useServer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    try {
      const user = await login(email.trim(), password);

      // Fetch actual locations to decide if selector is needed
      try {
        const locations = await api.getLocations();
        const activeLocations = locations.filter(l => l.isActive);
        if (activeLocations.length > 1) {
          router.replace('/location-select');
          return;
        }
        // Only 1 location — auto-select it
        if (activeLocations.length === 1) {
          await selectLocation(activeLocations[0].id);
        }
      } catch {}

      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeServer = async () => {
    await disconnect();
    router.replace('/setup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>OptimaPOS</Text>
          {config && (
            <View style={styles.serverBadge}>
              <Text style={styles.serverText}>{config.slug}</Text>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <LogIn size={28} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>
            Ingresa tus credenciales para acceder
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            disabled={!email.trim() || !password}
            fullWidth
            size="lg"
            icon={LogIn}
          />

          <Pressable onPress={handleChangeServer} style={styles.changeServer}>
            <Text style={styles.changeServerText}>Cambiar restaurante</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },
  container: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  serverBadge: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  serverText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    alignSelf: 'center',
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  changeServer: {
    alignSelf: 'center',
    marginTop: Spacing.xxl,
    padding: Spacing.sm,
  },
  changeServerText: {
    color: Colors.textTertiary,
    fontSize: FontSizes.sm,
    textDecorationLine: 'underline',
  },
});
