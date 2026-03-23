import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useServer } from '@/hooks/useServer';
import { Colors, Spacing, FontSizes, Radii } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { UserPlus } from 'lucide-react-native';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { config } = useServer();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): string | null => {
    if (name.trim().length < 2) return 'Nombre debe tener al menos 2 caracteres';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) return 'Ingresa un email válido';
    if (phone.trim().length < 6) return 'Teléfono debe tener al menos 6 dígitos';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos 1 mayúscula';
    if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos 1 minúscula';
    if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos 1 número';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password });
      router.replace('/(tabs)/menu');
    } catch (e: any) {
      setError(e.message || 'Error al crear cuenta');
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
          {config && (
            <View style={styles.serverBadge}>
              <Text style={styles.serverText}>{config.slug}</Text>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <UserPlus size={28} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Regístrate para hacer pedidos
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            textContentType="name"
          />

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
            label="Teléfono"
            placeholder="987 654 321"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
          />

          <Input
            label="Contraseña"
            placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleRegister}
          />

          <Button
            title="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
            disabled={!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword}
            fullWidth
            size="lg"
            icon={UserPlus}
          />

          <Pressable onPress={() => router.back()} style={styles.switchLink}>
            <Text style={styles.switchText}>¿Ya tienes cuenta? </Text>
            <Text style={styles.switchTextBold}>Inicia sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },
  container: { flexGrow: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
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
    paddingTop: Spacing.xxl,
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
  switchLink: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: Spacing.xxl,
    padding: Spacing.sm,
  },
  switchText: {
    color: Colors.textTertiary,
    fontSize: FontSizes.sm,
  },
  switchTextBold: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
