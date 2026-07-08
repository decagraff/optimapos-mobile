import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useSocket } from './useSocket';
import { AppState, AppStateStatus } from 'react-native';

const GPS_INTERVAL = 15000; // 15 seconds

interface LocationUpdate {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
}

// Offline queue for when connection drops
let offlineQueue: { orderId: number; update: LocationUpdate }[] = [];

export function useLocationTracking() {
  const { socket, isConnected } = useSocket();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);
  const [lastPosition, setLastPosition] = useState<LocationUpdate | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');

  // Monitor app state to pause/resume tracking
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);

  // Flush offline queue when connection is restored
  useEffect(() => {
    if (isConnected && socket && offlineQueue.length > 0) {
      for (const item of offlineQueue) {
        socket.emit('delivery:location', {
          orderId: item.orderId,
          lat: item.update.lat,
          lng: item.update.lng,
          accuracy: item.update.accuracy,
          speed: item.update.speed,
        });
      }
      offlineQueue = [];
    }
  }, [isConnected, socket]);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  const sendLocation = useCallback(async (orderId: number) => {
    if (appStateRef.current !== 'active') return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const update: LocationUpdate = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };

      setLastPosition(update);

      if (socket && isConnected) {
        socket.emit('delivery:location', {
          orderId,
          lat: update.lat,
          lng: update.lng,
          accuracy: update.accuracy,
          speed: update.speed,
        });
      } else {
        // Save to offline queue
        offlineQueue.push({ orderId, update });
      }
    } catch {
      // GPS error — skip this update
    }
  }, [socket, isConnected]);

  const startTracking = useCallback(async (orderId: number) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return false;

    // Send first position immediately
    await sendLocation(orderId);

    // Start interval
    intervalRef.current = setInterval(() => {
      sendLocation(orderId);
    }, GPS_INTERVAL);

    setIsTracking(true);
    setTrackingOrderId(orderId);
    return true;
  }, [requestPermission, sendLocation]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (socket && trackingOrderId) {
      socket.emit('delivery:stop', { orderId: trackingOrderId });
    }

    setIsTracking(false);
    setTrackingOrderId(null);
    setLastPosition(null);
  }, [socket, trackingOrderId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    trackingOrderId,
    lastPosition,
    permissionStatus,
    startTracking,
    stopTracking,
  };
}
