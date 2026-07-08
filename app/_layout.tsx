import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ServerProvider } from '@/context/ServerContext';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { CartProvider } from '@/context/CartContext';
import { PrinterProvider } from '@/context/PrinterContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

async function checkForUpdates() {
  if (__DEV__) return; // Skip in development
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Actualización disponible',
        'Se descargó una nueva versión. La app se reiniciará.',
        [{ text: 'OK', onPress: () => Updates.reloadAsync() }],
      );
    }
  } catch {
    // Silently fail — will retry next launch
  }
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      checkForUpdates();
    }
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ServerProvider>
          <AuthProvider>
            <SocketProvider>
              <PrinterProvider>
              <CartProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="setup" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="register" />
                  <Stack.Screen name="location-select" />
                  <Stack.Screen name="printer-setup" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
                <StatusBar style="dark" />
              </CartProvider>
              </PrinterProvider>
            </SocketProvider>
          </AuthProvider>
        </ServerProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
