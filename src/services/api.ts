import { ERPDataStore, AiResponse, AiDailySummary, BusinessFAQ, AppNotification } from '../types';

const TOKEN_KEY = 'klyia_fresh_erp_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function resolveApiBase(): string {
  const envUrl = (((import.meta as any).env?.VITE_API_URL as string) || '').trim();
  // Only accept explicit absolute HTTP/HTTPS URLs
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl.replace(/\/+$/, '');
  }
  // Co-hosted applet root: always empty base so relative /api/* requests hit the current host directly
  return '';
}

const API_BASE = resolveApiBase();

async function request<T>(endpoint: string, options: RequestInit & { _isRetry?: boolean } = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure endpoint is normalized with leading slash and does not duplicate base
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    // Auto-recovery: If session expired or token became invalid, seamlessly re-authenticate with default credentials and retry once
    const isExplicitlyLoggedOut = localStorage.getItem('klyia_fresh_erp_logged_out') === 'true';
    if (!options._isRetry && !cleanEndpoint.includes('/api/auth/login') && !isExplicitlyLoggedOut) {
      try {
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ username: 'klyiatech', password: 'klyia123456' }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData?.token) {
            setAuthToken(loginData.token);
            return await request<T>(endpoint, { ...options, _isRetry: true });
          }
        }
      } catch {
        // Fall through to standard unauthorized handling
      }
    }
    window.dispatchEvent(new CustomEvent('klyia:unauthorized'));
    throw new Error('Unauthorized or session expired. Please sign in again.');
  }

  // Detect HTML responses or unexpected redirects (e.g. gateway auth check or HTML fallback)
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json');
  const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');

  if (response.redirected && (isHtml || response.url.includes('cookie_check') || response.url.includes('auth'))) {
    throw new Error('Authentication session revalidating with server. Please retry in a moment.');
  }

  if (!response.ok) {
    let errorMsg = '';
    if (isJson) {
      try {
        const data = await response.json();
        errorMsg = data.error || data.message || '';
      } catch {}
    } else if (isHtml) {
      try {
        const text = await response.text();
        const snippet = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
        if (snippet && !snippet.toLowerCase().includes('doctype') && !snippet.toLowerCase().includes('html')) {
          errorMsg = snippet;
        }
      } catch {}
    } else {
      try {
        const rawText = await response.text();
        errorMsg = rawText.slice(0, 200).trim();
      } catch {}
    }

    if (!errorMsg) {
      errorMsg = isHtml
        ? `Backend returned non-JSON response (HTTP ${response.status}).`
        : response.statusText || `Request failed with HTTP ${response.status}`;
    }

    throw new Error(errorMsg);
  }

  if (isJson) {
    return response.json();
  }

  // Fallback for responses with no explicit content-type or non-JSON success
  const rawText = await response.text();
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText as unknown as T;
  }
}

export const api = {
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },

  isExplicitlyLoggedOut: (): boolean => {
    return localStorage.getItem('klyia_fresh_erp_logged_out') === 'true';
  },

  // Auth
  login: async (credentials: { username: string; password: string }) => {
    localStorage.removeItem('klyia_fresh_erp_logged_out');
    const res = await request<{ token: string; username: string; role: string; mustChangePassword: boolean; businessName: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res?.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  getCurrentUser: () =>
    request<{ username: string; role: string; mustChangePassword: boolean; businessSettings: any }>('/api/auth/me'),

  changePassword: (payload: { currentPassword?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () => {
    clearAuthToken();
    localStorage.setItem('klyia_fresh_erp_logged_out', 'true');
    window.dispatchEvent(new CustomEvent('klyia:unauthorized'));
    return request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }).catch(() => ({ success: true }));
  },

  // ERP Data
  getERPData: () => request<ERPDataStore>('/api/erp/data'),
  getData: () => request<ERPDataStore>('/api/erp/data'),

  // Fruits
  createFruit: (payload: any) =>
    request<{ success: boolean; fruit: any }>('/api/erp/fruits', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateFruit: (id: string, payload: any) =>
    request<{ success: boolean; fruit: any }>(`/api/erp/fruits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteFruit: (id: string) =>
    request<{ success: boolean }>(`/api/erp/fruits/${id}`, {
      method: 'DELETE',
    }),

  // Purchases
  createPurchase: (payload: any) =>
    request<{ success: boolean; purchase: any }>('/api/erp/purchases', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePurchase: (id: string, payload: any) =>
    request<{ success: boolean; purchase: any }>(`/api/erp/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Sales
  createSale: (payload: any) =>
    request<{ success: boolean; sale: any }>('/api/erp/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSale: (id: string, payload: any) =>
    request<{ success: boolean; sale: any }>(`/api/erp/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Customers
  createCustomer: (payload: any) =>
    request<{ success: boolean; customer: any }>('/api/erp/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCustomer: (id: string, payload: any) =>
    request<{ success: boolean; customer: any }>(`/api/erp/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCustomer: (id: string) =>
    request<{ success: boolean }>(`/api/erp/customers/${id}`, {
      method: 'DELETE',
    }),

  recordCustomerPayment: (customerId: string, payload: any) =>
    request<{ success: boolean; customer: any; payment: any }>(`/api/erp/customers/${customerId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCustomerPayment: (id: string, payload: any) =>
    request<{ success: boolean; payment: any }>(`/api/erp/customer-payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateCustomerLedgerEntry: (id: string, payload: any) =>
    request<{ success: boolean; entry: any }>(`/api/erp/customer-ledger/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createCustomerLedgerEntry: (payload: any) =>
    request<{ success: boolean; entry: any }>('/api/erp/customer-ledger', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Suppliers
  createSupplier: (payload: any) =>
    request<{ success: boolean; supplier: any }>('/api/erp/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSupplier: (id: string, payload: any) =>
    request<{ success: boolean; supplier: any }>(`/api/erp/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteSupplier: (id: string) =>
    request<{ success: boolean }>(`/api/erp/suppliers/${id}`, {
      method: 'DELETE',
    }),

  recordSupplierPayment: (supplierId: string, payload: any) =>
    request<{ success: boolean; supplier: any; payment: any }>(`/api/erp/suppliers/${supplierId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSupplierPayment: (id: string, payload: any) =>
    request<{ success: boolean; payment: any }>(`/api/erp/supplier-payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateSupplierLedgerEntry: (id: string, payload: any) =>
    request<{ success: boolean; entry: any }>(`/api/erp/supplier-ledger/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createSupplierLedgerEntry: (payload: any) =>
    request<{ success: boolean; entry: any }>('/api/erp/supplier-ledger', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Expenses
  createExpense: (payload: any) =>
    request<{ success: boolean; expense: any }>('/api/erp/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateExpense: (id: string, payload: any) =>
    request<{ success: boolean; expense: any }>(`/api/erp/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/api/erp/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Daily Rates
  updateDailyRates: (rates: any[]) =>
    request<{ success: boolean; message: string }>('/api/erp/daily-rates', {
      method: 'POST',
      body: JSON.stringify({ rates }),
    }),

  copyYesterdayRates: () =>
    request<{ success: boolean; count: number; message: string }>('/api/erp/daily-rates/copy-yesterday', {
      method: 'POST',
    }),

  // Wastage
  logWastage: (payload: any) =>
    request<{ success: boolean; wastage: any }>('/api/erp/wastage', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createWastage: (payload: any) =>
    request<{ success: boolean; wastage: any }>('/api/erp/wastage', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWastage: (id: string, payload: any) =>
    request<{ success: boolean; wastage: any }>(`/api/erp/wastage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Stock Adjustment
  adjustStock: (payload: any) =>
    request<{ success: boolean; stockItem: any }>('/api/erp/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Notifications
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/erp/notifications/${id}/read`, {
      method: 'PUT',
    }),

  // Settings
  updateSettings: (payload: any) =>
    request<{ success: boolean; settings: any }>('/api/erp/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Backup & Reset
  getBackupUrl: () => '/api/erp/backup',
  exportBackup: () => request<any>('/api/erp/backup'),

  // Local Offline SQLite Storage & Backups
  getStorageInfo: () =>
    request<{
      appDataDir: string;
      dbPath: string;
      dbExists: boolean;
      dbSizeBytes: number;
      dbSizeDisplay: string;
      engine: string;
      mode: string;
      uploadsDir: string;
      uploadsCount: number;
      backupsDir: string;
      backupsCount: number;
    }>('/api/system/storage-info'),

  listLocalBackups: () =>
    request<{
      backups: Array<{
        filename: string;
        filepath: string;
        sizeBytes: number;
        sizeDisplay: string;
        createdAt: string;
      }>;
    }>('/api/backup/list'),

  createLocalBackup: (note?: string) =>
    request<{
      success: boolean;
      backup: {
        filename: string;
        filepath: string;
        sizeDisplay: string;
        createdAt: string;
      };
      message: string;
    }>('/api/backup/create', {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  restoreLocalBackup: (filename: string) =>
    request<{ success: boolean; message: string }>('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    }),

  uploadFile: async (file: File): Promise<{ url: string; filename: string; originalName: string; size: number }> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE}/api/upload`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });
    if (!res.ok) {
      let errMsg = 'File upload failed';
      try {
        const errData = await res.json();
        errMsg = errData.error || errMsg;
      } catch {
        errMsg = res.statusText || errMsg;
      }
      throw new Error(errMsg);
    }
    return res.json();
  },

  restoreBackup: (data: any) =>
    request<{ success: boolean; message: string }>('/api/erp/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  importBackup: (data: any) =>
    request<{ success: boolean; message: string }>('/api/erp/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetDemoData: () =>
    request<{ success: boolean; message: string }>('/api/erp/reset-demo', {
      method: 'POST',
    }),

  // AI Assistant & Smart Notifications
  askAI: (question: string) =>
    request<AiResponse>('/api/gemini/chat', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  getAISummary: () =>
    request<AiDailySummary>('/api/ai/summary'),

  getAINotifications: () =>
    request<{ notifications: AppNotification[] }>('/api/ai/notifications'),

  getBusinessFAQs: () =>
    request<{ faqs: BusinessFAQ[] }>('/api/ai/faqs'),

  // Dashboard Amount Privacy Lock PIN
  verifyDashboardPin: (pin: string) =>
    request<{ success: boolean; message: string }>('/api/erp/dashboard-pin/verify', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  changeDashboardPin: (payload: { currentPin?: string; newPin: string }) =>
    request<{ success: boolean; message: string }>('/api/erp/dashboard-pin/change', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
