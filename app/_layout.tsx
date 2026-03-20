import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ServerProvider } from '@/context/ServerContext';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ServerProvider>
        <AuthProvider>
          <SocketProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="setup" />
              <Stack.Screen name="login" />
              <Stack.Screen name="location-select" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="dark" />
          </SocketProvider>
        </AuthProvider>
      </ServerProvider>
    </ErrorBoundary>
  );
}
