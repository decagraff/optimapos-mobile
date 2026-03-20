import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import { storage } from '@/services/storage';
import { api } from '@/services/api';
import { ServerContext } from './ServerContext';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedLocationId: number | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  selectLocation: (id: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  selectedLocationId: null,
  login: async () => { throw new Error('Not initialized'); },
  logout: async () => {},
  selectLocation: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isConfigured } = useContext(ServerContext);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const savedToken = await storage.getToken();
        if (!savedToken) {
          setIsLoading(false);
          return;
        }
        api.setToken(savedToken);
        const profile = await api.getProfile();
        const savedUser = await storage.getUser();
        // Merge profile with saved locationIds
        const merged: User = {
          ...profile,
          locationIds: savedUser?.locationIds ?? profile.locationIds ?? [],
        };
        setUser(merged);
        setToken(savedToken);

        const savedLocId = await storage.getLocationId();
        if (savedLocId) setSelectedLocationId(savedLocId);
      } catch {
        // Token invalid, clear
        await storage.clearAuth();
        api.setToken(null);
      }
      setIsLoading(false);
    })();
  }, [isConfigured]);

  // Set logout callback on api
  useEffect(() => {
    api.setLogoutCallback(async () => {
      await storage.clearAuth();
      api.setToken(null);
      setUser(null);
      setToken(null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const result = await api.login(email, password);
    api.setToken(result.token);
    await storage.setToken(result.token);
    await storage.setUser(result.user);
    setUser(result.user);
    setToken(result.token);

    // Auto-select location if only one
    const locIds = result.user.locationIds;
    if (locIds.length === 1) {
      setSelectedLocationId(locIds[0]);
      await storage.setLocationId(locIds[0]);
    } else if (result.user.locationId) {
      setSelectedLocationId(result.user.locationId);
      await storage.setLocationId(result.user.locationId);
    }

    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAuth();
    api.setToken(null);
    setUser(null);
    setToken(null);
    setSelectedLocationId(null);
  }, []);

  const selectLocation = useCallback(async (id: number) => {
    setSelectedLocationId(id);
    await storage.setLocationId(id);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const profile = await api.getProfile();
    setUser(prev => prev ? { ...prev, ...profile } : profile);
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, isAuthenticated: !!user && !!token,
      selectedLocationId, login, logout, selectLocation, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
