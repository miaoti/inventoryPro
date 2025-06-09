import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  // Don't set default Content-Type - let each request set it appropriately
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug: Log token status for troubleshooting
      console.log('Token found and attached to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in cookies');
    }
    
    // Set appropriate Content-Type based on data type
    if (config.data instanceof FormData) {
      // Let browser set Content-Type with boundary for FormData
      delete config.headers['Content-Type'];
    } else if (config.data && typeof config.data === 'object') {
      // Set JSON Content-Type for object data
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response interceptor:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data; // Return only the data portion
  },
  (error) => {
    // Handle authentication errors more specifically
    if (error.response?.status === 401) {
      console.log('Authentication error detected (401 Unauthorized)');
      console.log('Current token:', Cookies.get('token') ? 'exists' : 'missing');
      // Clear all authentication data
      Cookies.remove('token');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('isAdmin');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('authToken');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } else if (error.response?.status === 403) {
      // 403 Forbidden - user is authenticated but not authorized
      console.log('Authorization error detected (403 Forbidden)');
      // Don't redirect on 403 - user is authenticated but lacks permission
      // Let the component handle this error
    } else if (error.response?.status === 500) {
      // 500 Internal Server Error - don't redirect, let component handle
      console.log('Server error detected (500)', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { username: string; password: string }) => {
    // Generate a unique session ID for this login
    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    return api.post('/auth/login', { ...credentials, sessionId });
  },
  register: (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
  }) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  // Add utility to check authentication status
  checkAuth: () => {
    const token = Cookies.get('token');
    if (!token) {
      return false;
    }
    try {
      // Simple check if token exists and is not empty
      return token.length > 10; // Basic validation
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
  // Add utility to clear authentication
  clearAuth: () => {
    Cookies.remove('token');
    Cookies.remove('user');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    window.location.href = '/';
  },
  // Check if session is still valid (for multi-device logout)
  checkSession: () => api.get('/auth/check-session'),
  // Refresh token and session
  refreshSession: () => api.post('/auth/refresh-session')
};

export const itemsAPI = {
  getAll: () => api.get('/items'),
  getById: (id: number) => api.get(`/items/${id}`),
  create: (item: any) => api.post('/items', item),
  update: (id: number, item: any) => api.put(`/items/${id}`, item),
  delete: (id: number) => api.delete(`/items/${id}`),
  bulkDelete: (ids: number[]) => api.delete('/items/bulk', { data: ids }),
  importCSV: (file: File) => {
    console.log('=== FRONTEND IMPORT DEBUG ===');
    console.log('File to import:', file);
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('FormData created');
    console.log('FormData entries:');
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(key, value);
    });
    
    return api.post('/items/import-csv', formData);
  },
  exportBarcodes: () => api.get('/items/export-barcodes', { responseType: 'blob' }),
  scanBarcode: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/items/scan-barcode', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateInventory: (id: number, quantity: number) =>
    api.post(`/items/${id}/inventory`, { quantity }),
};

export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  getActive: () => api.get('/alerts/active'),
  getIgnored: () => api.get('/alerts/ignored'),
  getResolved: () => api.get('/alerts/resolved'),
  getUnread: () => api.get('/alerts/unread'),
  getCounts: () => api.get('/alerts/count'),
  markAsRead: (id: number) => api.post(`/alerts/${id}/read`),
  resolve: (id: number) => api.post(`/alerts/${id}/resolve`),
};

export const userAPI = {
  getSettings: () => api.get('/user/settings'),
  updateSettings: (settings: {
    alertEmail: string;
    enableEmailAlerts: boolean;
    enableDailyDigest: boolean;
  }) => api.put('/user/settings', settings),
};

export const barcodeAPI = {
  scanBarcode: (barcode: string) => 
    api.get(`/public/barcode/scan/${encodeURIComponent(barcode)}`),
  recordUsage: (usageData: {
    barcode: string;
    userName: string;
    quantityUsed: number;
    notes?: string;
    department?: string;
    dNumber?: string;
  }) => api.post('/public/barcode/use', usageData),
  createPurchaseOrder: (barcode: string, poData: {
    quantity: number;
    trackingNumber?: string;
  }) => api.post(`/public/barcode/create-po/${encodeURIComponent(barcode)}`, poData),
  getPendingPurchaseOrders: (barcode: string) => 
    api.get(`/public/barcode/pending-pos/${encodeURIComponent(barcode)}`),
  markPurchaseOrderAsArrived: (purchaseOrderId: number) => 
    api.post(`/public/barcode/arrive-po/${purchaseOrderId}`),
  confirmRestock: (barcode: string, restockData: {
    quantity?: number;
    purchaseOrderId?: number;
  }) => api.post(`/public/barcode/confirm-restock/${encodeURIComponent(barcode)}`, restockData),
};

export const adminAPI = {
  getItemDisplaySettings: () => api.get('/admin/settings/item-display'),
  updateItemDisplaySettings: (fields: string[]) => 
    api.post('/admin/settings/item-display', { fields }),
  getAlertThresholds: () => api.get('/admin/settings/alert-thresholds'),
  updateAlertThresholds: (thresholds: {
    warningThreshold: number;
    criticalThreshold: number;
  }) => api.post('/admin/settings/alert-thresholds', thresholds),
};

export const purchaseOrderAPI = {
  getByItem: (itemId: number) => api.get(`/items/${itemId}/purchase-orders`),
  getPendingByItem: (itemId: number) => api.get(`/items/${itemId}/purchase-orders/pending`),
  create: (poData: {
    itemId: number;
    quantity: number;
    orderDate?: string;
    trackingNumber?: string;
  }) => api.post(`/items/${poData.itemId}/purchase-orders`, poData),
  update: (itemId: number, poId: number, poData: {
    quantity: number;
    trackingNumber?: string;
    orderDate?: string;
  }) => api.put(`/items/${itemId}/purchase-orders/${poId}`, poData),
  markAsArrived: (id: number) => api.post(`/items/purchase-orders/${id}/arrive`),
  getTotalPendingQuantity: (itemId: number) => api.get(`/items/${itemId}/purchase-orders/pending-quantity`),
};

export const statsAPI = {
  getDailyUsage: (days: number = 7) => api.get(`/stats/daily-usage?days=${days}`),
  getDailyUsageFiltered: (startDate: string, endDate: string) => 
    api.get(`/stats/daily-usage/filtered?startDate=${startDate}&endDate=${endDate}`),
  getTopUsageItems: (limit: number = 5) => api.get(`/stats/top-usage?limit=${limit}`),
  getTopUsageItemsFiltered: (limit: number = 5, startDate: string, endDate: string) => 
    api.get(`/stats/top-usage/filtered?limit=${limit}&startDate=${startDate}&endDate=${endDate}`),
  getLowStockItems: () => api.get('/stats/low-stock'),
  getStockAlerts: () => api.get('/stats/stock-alerts'),
  getQuickStats: () => api.get('/stats/quick-stats'),
};

// User Management API (Owner only)
export const userManagementAPI = {
  getAll: (): Promise<import('../types/user').User[]> => {
    return api.get('/admin/users');
  },

  getById: (id: number): Promise<import('../types/user').User> => {
    return api.get(`/admin/users/${id}`);
  },

  create: (data: import('../types/user').CreateUserRequest): Promise<{ message: string; user: import('../types/user').User }> => {
    return api.post('/admin/users', data);
  },

  update: (id: number, data: import('../types/user').UserUpdateRequest): Promise<import('../types/user').User> => {
    return api.put(`/admin/users/${id}`, data);
  },

  updateUsername: (id: number, data: import('../types/user').UpdateUsernameRequest): Promise<{ message: string; user: import('../types/user').User }> => {
    return api.put(`/admin/users/${id}/username`, data);
  },

  delete: (id: number): Promise<void> => {
    return api.delete(`/admin/users/${id}`);
  }
};

// Profile API (for current user)
export const profileAPI = {
  get: (): Promise<import('../types/user').User> => {
    return api.get('/profile');
  },

  update: (data: import('../types/user').ProfileUpdateRequest): Promise<{ message: string; user: import('../types/user').User }> => {
    return api.put('/profile', data);
  }
};

// Purchase Order Statistics API (Owner only)
export const purchaseOrderStatsAPI = {
  getAll: (): Promise<import('../types/purchaseOrder').PurchaseOrder[]> => {
    return api.get('/admin/purchase-orders/stats');
  },

  getByItem: (itemId: number): Promise<import('../types/purchaseOrder').PurchaseOrder[]> => {
    return api.get(`/admin/purchase-orders/stats/item/${itemId}`);
  },

  getPending: (): Promise<import('../types/purchaseOrder').PurchaseOrder[]> => {
    return api.get('/admin/purchase-orders/stats/pending');
  },

  getArrived: (): Promise<import('../types/purchaseOrder').PurchaseOrder[]> => {
    return api.get('/admin/purchase-orders/stats/arrived');
  }
};

export default api; 