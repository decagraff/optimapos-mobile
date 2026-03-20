import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  SLUG: 'server_slug',
  LOCATION_ID: 'selected_location_id',
  LOCATION_NAME: 'selected_location_name',
} as const;

export const storage = {
  // Token
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.TOKEN);
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
  },

  // User (JSON serialized)
  async getUser(): Promise<any | null> {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user: any): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },

  // Server slug
  async getSlug(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.SLUG);
  },
  async setSlug(slug: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.SLUG, slug);
  },

  // Selected location
  async getLocationId(): Promise<number | null> {
    const raw = await SecureStore.getItemAsync(KEYS.LOCATION_ID);
    return raw ? parseInt(raw, 10) : null;
  },
  async setLocationId(id: number): Promise<void> {
    await SecureStore.setItemAsync(KEYS.LOCATION_ID, String(id));
  },
  async getLocationName(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.LOCATION_NAME);
  },
  async setLocationName(name: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.LOCATION_NAME, name);
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER);
    await SecureStore.deleteItemAsync(KEYS.LOCATION_ID);
    await SecureStore.deleteItemAsync(KEYS.LOCATION_NAME);
  },

  // Clear everything (including server)
  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER);
    await SecureStore.deleteItemAsync(KEYS.SLUG);
    await SecureStore.deleteItemAsync(KEYS.LOCATION_ID);
    await SecureStore.deleteItemAsync(KEYS.LOCATION_NAME);
  },
};
