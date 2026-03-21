import type { LoginResponse, Location, User, Product, Category, Table, Order, AddonGroup } from '@/types';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

type LogoutCallback = () => void;

class ApiClient {
  private baseUrl = '';
  private token: string | null = null;
  private tenantHost = '';
  private onLogout: LogoutCallback | null = null;

  configure(baseUrl: string, tenantHost: string) {
    this.baseUrl = baseUrl;
    this.tenantHost = tenantHost;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setLogoutCallback(cb: LogoutCallback) {
    this.onLogout = cb;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantHost,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.onLogout?.();
      throw new ApiError('Sesión expirada', 401);
    }

    if (!res.ok) {
      let msg = 'Error del servidor';
      try {
        const err = await res.json();
        msg = err.error || msg;
      } catch {}
      throw new ApiError(msg, res.status);
    }

    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: any) {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: any) {
    return this.request<T>('PATCH', path, body);
  }

  // Endpoints
  async health(): Promise<{ status: string; name?: string }> {
    return this.get('/api/health');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.post('/api/auth/login', { email, password });
  }

  async register(data: { name: string; email: string; phone: string; password: string }): Promise<LoginResponse> {
    return this.post('/api/auth/register', data);
  }

  async getProfile(): Promise<User> {
    return this.get('/api/auth/me');
  }

  async getLocations(): Promise<Location[]> {
    return this.get('/api/locations');
  }

  async getCategories(locationId?: number): Promise<Category[]> {
    const q = locationId ? `?locationId=${locationId}` : '';
    return this.get(`/api/categories${q}`);
  }

  async getProducts(locationId?: number, categoryId?: number): Promise<Product[]> {
    const params = new URLSearchParams();
    if (locationId) params.set('locationId', String(locationId));
    if (categoryId) params.set('categoryId', String(categoryId));
    const q = params.toString() ? `?${params}` : '';
    return this.get(`/api/products${q}`);
  }

  async getAddonGroups(locationId?: number): Promise<AddonGroup[]> {
    const q = locationId ? `?locationId=${locationId}` : '';
    return this.get(`/api/addons/groups${q}`);
  }

  async getTables(locationId?: number): Promise<Table[]> {
    const q = locationId ? `?locationId=${locationId}` : '';
    return this.get(`/api/tables${q}`);
  }

  async getMyOrders(): Promise<Order[]> {
    const res = await this.get<{ orders: Order[] }>('/api/orders/my');
    return res.orders || [];
  }

  async createOrder(data: any): Promise<{ order: Order; whatsappLink?: string }> {
    return this.post('/api/orders', data);
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    return this.patch(`/api/orders/${orderId}/status`, { status });
  }

  async getKitchenOrders(locationId?: number): Promise<any[]> {
    const q = locationId ? `?locationId=${locationId}` : '';
    return this.get(`/api/orders/kitchen/active${q}`);
  }

  async updateKitchenStatus(orderId: number, status: string): Promise<any> {
    return this.patch(`/api/orders/kitchen/${orderId}/status`, { status });
  }

  // Delivery
  async getDeliveryOrders(): Promise<Order[]> {
    return this.get('/api/orders/delivery/active');
  }

  async updateDeliveryStatus(orderId: number, status: string): Promise<Order> {
    return this.patch(`/api/orders/delivery/${orderId}/status`, { status });
  }

  async uploadDeliveryPhoto(orderId: number, uri: string): Promise<{ deliveryPhoto: string }> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    formData.append('photo', {
      uri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const headers: Record<string, string> = {
      'X-Tenant-Id': this.tenantHost,
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${this.baseUrl}/api/orders/delivery/${orderId}/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new ApiError('Error subiendo foto', res.status);
    return res.json();
  }

  async assignDeliveryUser(orderId: number, deliveryUserId: number | null): Promise<Order> {
    return this.patch(`/api/orders/delivery/${orderId}/assign`, { deliveryUserId });
  }

  async getDeliveryUsers(locationId?: number): Promise<{ id: number; name: string; phone: string }[]> {
    const q = locationId ? `?locationId=${locationId}` : '';
    return this.get(`/api/orders/delivery/users${q}`);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }

  put<T>(path: string, body?: any) {
    return this.request<T>('PUT', path, body);
  }

  // ─── Repeat order ──────────────────────────────────────────────
  async repeatOrder(orderId: number): Promise<{ order: Order }> {
    return this.post(`/api/orders/repeat/${orderId}`);
  }

  // ─── Change password ──────────────────────────────────────────
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.patch('/api/users/me/password', { currentPassword, newPassword });
  }

  // ─── Addresses ────────────────────────────────────────────────
  async getAddresses(): Promise<any[]> {
    return this.get('/api/users/me/addresses');
  }

  async createAddress(data: { label: string; address: string; reference?: string; isDefault?: boolean }): Promise<any> {
    return this.post('/api/users/me/addresses', data);
  }

  async updateAddress(id: number, data: any): Promise<any> {
    return this.put(`/api/users/me/addresses/${id}`, data);
  }

  async deleteAddress(id: number): Promise<void> {
    return this.delete(`/api/users/me/addresses/${id}`);
  }

  // ─── Favorites ────────────────────────────────────────────────
  async getFavorites(): Promise<any[]> {
    return this.get('/api/users/me/favorites');
  }

  async addFavorite(productId: number): Promise<any> {
    return this.post('/api/users/me/favorites', { productId });
  }

  async removeFavorite(productId: number): Promise<void> {
    return this.delete(`/api/users/me/favorites/${productId}`);
  }

  // ─── Product toggle ───────────────────────────────────────────
  async toggleProduct(productId: number, isActive: boolean): Promise<Product> {
    return this.put(`/api/products/${productId}`, { isActive });
  }
}

export const api = new ApiClient();
