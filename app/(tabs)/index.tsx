import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.greeting}>
        ¡Hola Mundo! 🚀
      </ThemedText>

      <ThemedText style={styles.text}>
        Bienvenido a tu primera aplicación Android.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Pe fuegossssfdfsdf sdfds fds (Hot Relg) 🔥
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Ve a tu código en VS Code (archivo app/(tabs)/index.tsx).
          Cambia este texto, guarda el archivo con (Ctrl + S) y mira
          cómo se actualiza la app al instante sin recompilar.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#2196F3',
  },
  text: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 18,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    marginBottom: 8,
    color: '#FF9800',
  },
  cardText: {
    lineHeight: 24,
  },
});
