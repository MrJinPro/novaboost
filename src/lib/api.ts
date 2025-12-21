// Backend API configuration and services
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'https://api.ttboost.pro';

// Token management
export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('access_token');
};

// API helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || 'Request failed');
  }

  return response.json();
};

// Auth types
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  username: string;
  plan: string | null;
  tariff_name: string | null;
  allowed_platforms: string[];
  license_expires_at: string | null;
}

// Auth API
export const authApi = {
  register: (username: string, password: string) =>
    apiRequest<AuthResponse>('/v2/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    apiRequest<AuthResponse>('/v2/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => apiRequest<UserProfile>('/v2/auth/me'),

  upgradeLicense: (licenseKey: string) =>
    apiRequest<{ success: boolean }>('/v2/auth/upgrade-license', {
      method: 'POST',
      body: JSON.stringify({ license_key: licenseKey }),
    }),
};

// Plans types
export interface Plan {
  id: string;
  name: string;
  allowed_platforms: string[];
}

export interface PlansResponse {
  items: Plan[];
}

// Plans API
export const plansApi = {
  getPlans: () => apiRequest<PlansResponse>('/v2/license/plans'),
};

// Mock data for development (when backend is unavailable)
export const mockPlans: Plan[] = [
  {
    id: 'nova_streamer_one_mobile',
    name: 'NovaStreamer One (Mobile)',
    allowed_platforms: ['mobile'],
  },
  {
    id: 'nova_streamer_one_desktop',
    name: 'NovaStreamer One (Desktop)',
    allowed_platforms: ['desktop'],
  },
  {
    id: 'nova_streamer_duo',
    name: 'NovaStreamer Duo',
    allowed_platforms: ['desktop', 'mobile'],
  },
];

// Plan pricing (for UI display - actual prices from payment provider)
export const planPricing: Record<string, { price: number; currency: string; period: string }> = {
  nova_streamer_one_mobile: { price: 4.99, currency: '$', period: '/месяц' },
  nova_streamer_one_desktop: { price: 8.99, currency: '$', period: '/месяц' },
  nova_streamer_duo: { price: 14.99, currency: '$', period: '/месяц' },
};

// Plan descriptions and features
export const planDetails: Record<string, { description: string; features: string[]; available: boolean }> = {
  nova_streamer_one_mobile: {
    description: 'Идеально для мобильного стриминга',
    features: [
      'Озвучка чата',
      'Озвучка подарков',
      'Триггеры на события',
      'Вход зрителя и т.д.',
    ],
    available: true,
  },
  nova_streamer_one_desktop: {
    description: 'Полный набор для десктопа',
    features: [
      'Озвучка чата',
      'Озвучка подарков',
      'Триггеры на события',
      'Виджеты и алёрты',
    ],
    available: false,
  },
  nova_streamer_duo: {
    description: 'Максимум возможностей',
    features: [
      'Всё из Mobile + Desktop',
      'NovaBoost Tools',
      'Приоритетная поддержка',
      'Ранний доступ к фичам',
    ],
    available: false,
  },
};
