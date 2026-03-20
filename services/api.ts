import type { LoginResponse, Location, User } from '@/types';

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

  async getProfile(): Promise<User> {
    return this.get('/api/auth/me');
  }

  async getLocations(): Promise<Location[]> {
    return this.get('/api/locations');
  }
}

export const api = new ApiClient();
