import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ServerProvider } from '@/context/ServerContext';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { CartProvider } from '@/context/CartContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ServerProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="setup" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="register" />
                  <Stack.Screen name="location-select" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
                <StatusBar style="dark" />
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </ServerProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
