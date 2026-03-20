import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useServer } from '@/hooks/useServer';
import { api } from '@/services/api';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Store } from 'lucide-react-native';

export default function SetupScreen() {
  const { configure } = useServer();
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    const clean = slug.toLowerCase().trim().replace(/\s+/g, '');
    if (!clean) return;

    setLoading(true);
    setError('');

    try {
      // Configure API with the slug temporarily to test
      const tenantHost = `${clean}.decatron.net`;
      const baseUrl = `https://${tenantHost}`;

      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { 'X-Tenant-Id': tenantHost },
      });

      if (!res.ok) throw new Error('Servidor no disponible');

      // Server is valid, save config
      await configure(clean);
      router.replace('/login');
    } catch (e: any) {
      setError('No se pudo conectar. Verifica el código e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Store size={32} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Conectar restaurante</Text>
          <Text style={styles.subtitle}>
            Ingresa el código que te proporcionó tu administrador
          </Text>

          <Input
            label="Código del restaurante"
            placeholder="ej. doncarlyn"
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleConnect}
            error={error || undefined}
          />

          <Button
            title="Conectar"
            onPress={handleConnect}
            loading={loading}
            disabled={!slug.trim()}
            fullWidth
            size="lg"
          />

          <Text style={styles.hint}>
            El código es el nombre de tu restaurante en el sistema.{'\n'}
            Ejemplo: doncarlyn, misushi, labuena
          </Text>
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
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
});
