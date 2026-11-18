import type {
  AdminDashboardStats,
  Commerce,
  MerchantDashboardStats,
  Offer,
  Order,
  SafeUser,
  StudentDashboardStats,
  UserRole,
} from '../types';

const TOKEN_KEY = 'campussave_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || `Erreur serveur (${response.status})`);
  }
  return data;
}

export const authApi = {
  register: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: 'student' | 'merchant';
  }) => apiRequest<{ token: string; user: SafeUser }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    apiRequest<{ token: string; user: SafeUser }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  me: () => apiRequest<{ user: SafeUser }>('/auth/me'),
};

export const catalogApi = {
  getCommerces: (all = false) => apiRequest<{ commerces: Commerce[] }>(`/commerces${all ? '?all=true' : ''}`),

  getOffers: (filters?: { search?: string; category?: string; commerceId?: string; maxPrice?: string; includeAll?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category && filters.category !== 'Toutes') params.set('category', filters.category);
    if (filters?.commerceId) params.set('commerceId', filters.commerceId);
    if (filters?.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters?.includeAll) params.set('includeAll', 'true');
    const qs = params.toString();
    return apiRequest<{ offers: Offer[] }>(`/offers${qs ? `?${qs}` : ''}`);
  },
};

export const ordersApi = {
  reserve: (offerId: string, quantity: number) =>
    apiRequest<{ order: Order }>('/orders/reserve', { method: 'POST', body: JSON.stringify({ offerId, quantity }) }),

  cancel: (orderId: string) =>
    apiRequest<{ order: Order }>(`/orders/${orderId}/cancel`, { method: 'POST' }),

  myOrders: () => apiRequest<{ orders: Order[] }>('/orders/my'),

  initKonnect: (orderId: string) =>
    apiRequest<{
      paymentRef: string;
      payUrl: string | null;
      mode: 'konnect_sandbox' | 'local_sandbox_test';
      amountTnd: number;
      orderId: string;
    }>('/payments/konnect/init', { method: 'POST', body: JSON.stringify({ orderId }) }),

  verifyKonnect: (payload: { orderId: string; paymentRef: string; sandboxConfirmed?: boolean }) =>
    apiRequest<{ order: Order }>('/payments/konnect/verify', { method: 'POST', body: JSON.stringify(payload) }),

  studentDashboard: () => apiRequest<{ stats: StudentDashboardStats }>('/dashboard/student'),
};

export const merchantApi = {
  dashboard: () => apiRequest<{ commerces: Commerce[]; offers: Offer[]; stats: MerchantDashboardStats }>('/dashboard/merchant'),

  createCommerce: (payload: Partial<Commerce>) =>
    apiRequest<{ commerce: Commerce }>('/commerces', { method: 'POST', body: JSON.stringify(payload) }),

  updateCommerce: (id: string, payload: Partial<Commerce>) =>
    apiRequest<{ commerce: Commerce }>(`/commerces/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  createOffer: (payload: Partial<Offer>) =>
    apiRequest<{ offer: Offer }>('/offers', { method: 'POST', body: JSON.stringify(payload) }),

  updateOffer: (id: string, payload: Partial<Offer>) =>
    apiRequest<{ offer: Offer }>(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteOffer: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/offers/${id}`, { method: 'DELETE' }),

  orders: () => apiRequest<{ orders: Order[] }>('/orders/merchant'),

  validateQr: (qrToken: string) =>
    apiRequest<{ validated: boolean; message: string; order: Order }>('/orders/validate-qr', {
      method: 'POST',
      body: JSON.stringify({ qrToken }),
    }),
};

export const adminApi = {
  dashboard: () => apiRequest<{ stats: AdminDashboardStats }>('/dashboard/admin'),
  users: () => apiRequest<{ users: SafeUser[] }>('/admin/users'),
  setUserActive: (id: string, active: boolean) =>
    apiRequest<{ user: SafeUser }>(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  setCommerceStatus: (id: string, status: 'approved' | 'rejected' | 'pending') =>
    apiRequest<{ commerce: Commerce }>(`/admin/commerces/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  orders: () => apiRequest<{ orders: Order[] }>('/admin/orders'),
  deleteOffer: (id: string) => apiRequest<{ deleted: boolean }>(`/offers/${id}`, { method: 'DELETE' }),
};

export type AppView = 'marketplace' | 'student_orders' | 'merchant_dashboard' | 'admin_dashboard';

export function defaultViewForRole(role: UserRole | null): AppView {
  if (role === 'merchant') return 'merchant_dashboard';
  if (role === 'admin') return 'admin_dashboard';
  return 'marketplace';
}
