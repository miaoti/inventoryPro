import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Session management - Generate a unique session ID for this browser tab/window
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Store session ID in sessionStorage (unique per tab)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

const api = axios.create({
  baseURL: API_URL,
  // Don't set default Content-Type - let each request set it appropriately
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    
    // Skip token validation for public endpoints
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/phantom', '/public/'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (!isPublicEndpoint) {
      if (!token) {
        console.log('No token found for protected endpoint:', config.url);
        // Clear any stale auth data and redirect
        clearAuthenticationData();
        if (typeof window !== 'undefined' && 
            window.location.pathname !== '/' && 
            window.location.pathname !== '/login') {
          window.location.href = '/login?error=authentication_required';
        }
        return Promise.reject(new Error('Authentication required'));
      }
      
      // Validate token format (basic check)
      if (token.length < 10 || !token.includes('.')) {
        console.log('Invalid token format detected');
        clearAuthenticationData();
        if (typeof window !== 'undefined' && 
            window.location.pathname !== '/' && 
            window.location.pathname !== '/login') {
          window.location.href = '/login?error=invalid_token';
        }
        return Promise.reject(new Error('Invalid token'));
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Add session ID to track concurrent sessions
      config.headers['X-Session-ID'] = getSessionId();
      // Debug: Log token status for troubleshooting
      console.log('Token found and attached to request:', token.substring(0, 20) + '...');
    } else if (!isPublicEndpoint) {
      console.log('No token found for protected endpoint');
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

    // Check for concurrent session header
    const concurrentSession = response.headers['x-concurrent-session'];
    if (concurrentSession === 'detected') {
      console.log('Concurrent session detected - user logged in elsewhere');
      handleConcurrentSession();
      return Promise.reject(new Error('You have been logged out because your account was accessed from another location.'));
    }

    return response; // Return the full response object so components can access response.data
  },
  (error) => {
    // Handle concurrent session detection
    if (error.response?.headers?.['x-concurrent-session'] === 'detected') {
      console.log('Concurrent session detected in error response');
      handleConcurrentSession();
      return Promise.reject(new Error('You have been logged out because your account was accessed from another location.'));
    }

    // Handle authentication errors more specifically
    if (error.response?.status === 401) {
      console.log('Authentication error detected (401 Unauthorized)');
      console.log('Current token:', Cookies.get('token') ? 'exists' : 'missing');
      console.log('Current URL:', window.location.pathname);
      
      // Clear all authentication data
      clearAuthenticationData();
      
      // Only redirect if we're not already on the login page or landing page
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        console.log('Redirecting to login page due to authentication error');
        window.location.href = '/?error=session_expired';
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

// Function to handle concurrent session detection
const handleConcurrentSession = () => {
  // Clear all authentication data
  clearAuthenticationData();
  
  // Show alert and redirect
  alert('You have been logged out because your account was accessed from another location.');
  window.location.href = '/?error=concurrent_session';
};

// Function to clear all authentication data
const clearAuthenticationData = () => {
  // Remove cookie
  Cookies.remove('token');
  Cookies.remove('user');
  
  // Clear localStorage items
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('authToken');
  localStorage.removeItem('cameraPermissionGranted');
  
  // Clear sessionStorage items
  sessionStorage.removeItem('isAdmin');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('session_id');
  
  // Trigger logout event for other tabs
  localStorage.setItem('logout-event', Date.now().toString());
  localStorage.removeItem('logout-event');
  
  console.log('All authentication data cleared');
};

// Function to decode JWT token and check expiry
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Consider malformed tokens as expired
  }
};

// Function to validate token and redirect if invalid
const validateTokenAndRedirect = async () => {
  const token = Cookies.get('token');
  
  if (!token) {
    console.log('No token found - redirecting to login');
    clearAuthenticationData();
    window.location.href = '/login?error=no_token';
    return false;
  }

  // Check if token is expired locally first
  if (isTokenExpired(token)) {
    console.log('Token is expired - redirecting to login');
    clearAuthenticationData();
    window.location.href = '/login?error=token_expired';
    return false;
  }

  try {
    // Make a simple API call to validate token with server
    const response = await api.get('/profile');
    console.log('Token validation successful');
    return true;
  } catch (error: any) {
    console.log('Token validation failed:', error);
    
    // Check if it's an authentication error
    if (error.response?.status === 401 || error.message?.includes('Authentication')) {
      console.log('Authentication failed - token may be revoked or invalid');
      clearAuthenticationData();
      
      // Only redirect if not already on login/landing page
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/login?error=invalid_token';
      }
      return false;
    }
    
    // For other errors (network, server), don't redirect but return false
    console.log('Server error during token validation, but not redirecting');
    return false;
  }
};

// Function to ensure user is authenticated before API calls
const ensureAuthenticated = (): boolean => {
  const token = Cookies.get('token');
  
  if (!token) {
    console.log('No token found - authentication required');
    clearAuthenticationData();
    if (typeof window !== 'undefined' && 
        window.location.pathname !== '/' && 
        window.location.pathname !== '/login') {
      window.location.href = '/login?error=authentication_required';
    }
    return false;
  }
  
  if (isTokenExpired(token)) {
    console.log('Token expired - authentication required');
    clearAuthenticationData();
    if (typeof window !== 'undefined' && 
        window.location.pathname !== '/' && 
        window.location.pathname !== '/login') {
      window.location.href = '/login?error=token_expired';
    }
    return false;
  }
  
  return true;
};

export const authAPI = {
  login: (credentials: { username: string; password: string }) => {
    // Include session ID in login request
    return api.post('/auth/login', {
      ...credentials,
      sessionId: getSessionId()
    });
  },
  register: (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
  }) => api.post('/auth/register', userData),
  logout: () => {
    const result = api.post('/auth/logout', { sessionId: getSessionId() });
    clearAuthenticationData();
    return result;
  },
  // Validate token with server using profile endpoint
  validateToken: async () => {
    if (!ensureAuthenticated()) {
      return { valid: false, error: 'No valid token' };
    }
    
    try {
      const response = await api.get('/profile');
      return { valid: true, data: response };
    } catch (error) {
      console.error('Token validation failed:', error);
      // Clear auth on validation failure
      clearAuthenticationData();
      return { valid: false, error };
    }
  },
  // Check authentication status
  checkAuth: () => {
    const token = Cookies.get('token');
    if (!token) {
      return false;
    }
    
    if (isTokenExpired(token)) {
      clearAuthenticationData();
      return false;
    }
    
    return true;
  },
  // Clear authentication and redirect
  clearAuth: () => {
    clearAuthenticationData();
    window.location.href = '/login';
  },
  // Validate token and redirect if needed
  validateAndRedirect: validateTokenAndRedirect,
  // Get current session ID
  getSessionId: getSessionId,
  // Clear all auth data
  clearAuthData: clearAuthenticationData,
  // Ensure user is authenticated
  ensureAuthenticated: ensureAuthenticated
};

export const itemsAPI = {
  getAll: (department?: string) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    const params = department ? `?department=${encodeURIComponent(department)}` : '';
    return api.get(`/items${params}`);
  },
  getDepartments: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/items/departments');
  },
  createDepartment: (name: string) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.post('/items/departments', { name });
  },
  deleteDepartment: (departmentName: string) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.delete(`/items/departments/${encodeURIComponent(departmentName)}`);
  },
  getById: (id: number) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get(`/items/${id}`);
  },
  create: (item: any) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.post('/items', item);
  },
  update: (id: number, itemData: any) => api.put(`/items/${id}`, itemData),
  delete: (id: number) => api.delete(`/items/${id}`),
  bulkDelete: (itemIds: number[]) => api.delete('/items/bulk', { data: itemIds }),
  importCSV: (file: File, departmentOverride?: { useDepartmentOverride: boolean; overrideDepartment?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add department override parameters if provided
    if (departmentOverride?.useDepartmentOverride) {
      formData.append('useDepartmentOverride', 'true');
      if (departmentOverride.overrideDepartment) {
        formData.append('overrideDepartment', departmentOverride.overrideDepartment);
      }
    } else {
      formData.append('useDepartmentOverride', 'false');
    }
    
    return api.post('/items/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportBarcodes: () => api.get('/items/export-barcodes', { responseType: 'blob' }),
  regenerateQRCodes: () => api.post('/items/regenerate-qr-codes'),
  scanBarcode: (file: File) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/items/scan-barcode', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateInventory: (id: number, quantity: number) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.post(`/items/${id}/inventory`, { quantity });
  },
};

export const alertsAPI = {
  getAll: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/alerts');
  },
  getActive: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/alerts/active');
  },
  getIgnored: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/alerts/ignored');
  },
  getResolved: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/alerts/resolved');
  },
  getUnread: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/alerts/unread');
  },
  getCounts: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/alerts/count');
  },
  markAsRead: (id: number) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.post(`/alerts/${id}/read`);
  },
  resolve: (id: number) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.post(`/alerts/${id}/resolve`);
  },
};

export const userAPI = {
  getSettings: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/user/settings');
  },
  updateSettings: (settings: {
    alertEmail?: string;
    enableEmailAlerts?: boolean;
    enableDailyDigest?: boolean;
    warningThreshold?: number;
    criticalThreshold?: number;
  }) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.put('/user/settings', settings);
  },
  getQuickActions: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/user/quick-actions');
  },
  updateQuickActions: (actions: string[]) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.post('/user/quick-actions', { actions });
  },
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

// Public items API for scanner search functionality (no authentication required)
export const publicItemsAPI = {
  searchItems: () => api.get('/public/items/search'),
};

// Public QR code API for QR code usage functionality (no authentication required)
export const publicQRAPI = {
  getItemByQRCode: (qrCodeId: string) => api.get(`/public/qr/item/${qrCodeId}`),
  recordUsageByQRCode: (qrCodeId: string, usageData: {
    userName: string;
    quantityUsed: number;
    notes?: string;
    department?: string;
    dNumber?: string;
  }) => api.post(`/public/qr/use/${qrCodeId}`, usageData),
};

export const systemLogsAPI = {
  getLogs: (params: {
    page?: number;
    size?: number;
    level?: string;
    module?: string;
    username?: string;
    sortBy?: string;
    sortDir?: string;
  }) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.level) queryParams.append('level', params.level);
    if (params.module) queryParams.append('module', params.module);
    if (params.username) queryParams.append('username', params.username);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);
    
    return api.get(`/system-logs?${queryParams.toString()}`);
  },
  getStatistics: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/system-logs/statistics');
  },
  getRecentLogs: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/system-logs/recent');
  },
  getLogById: (id: number) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get(`/system-logs/${id}`);
  },
  deleteLogs: (logIds: number[]) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.delete('/system-logs/bulk', { data: logIds });
  },
  deleteOldLogs: (days: number) => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.delete(`/system-logs/cleanup?days=${days}`);
  },
  getAvailableFilters: () => {
    if (!ensureAuthenticated()) {
      return Promise.reject(new Error('Authentication required'));
    }
    return api.get('/system-logs/filters');
  },
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
  getQuickStats: (department?: string) => {
    const params = department ? `?department=${encodeURIComponent(department)}` : '';
    return api.get(`/stats/quick-stats${params}`);
  },
  getAvailableDepartments: () => api.get('/stats/departments'),
};

// User Management API (Owner only)
export const userManagementAPI = {
  getAll: (): Promise<any> => {
    return api.get('/admin/users');
  },

  getById: (id: number): Promise<any> => {
    return api.get(`/admin/users/${id}`);
  },

  create: (data: import('../types/user').CreateUserRequest): Promise<any> => {
    return api.post('/admin/users', data);
  },

  update: (id: number, data: import('../types/user').UserUpdateRequest): Promise<any> => {
    return api.put(`/admin/users/${id}`, data);
  },

  updateUsername: (id: number, data: import('../types/user').UpdateUsernameRequest): Promise<any> => {
    return api.put(`/admin/users/${id}/username`, data);
  },

  delete: (id: number): Promise<void> => {
    return api.delete(`/admin/users/${id}`);
  }
};

// Profile API (for current user)
export const profileAPI = {
  get: (): Promise<any> => {
    return api.get('/profile');
  },

  update: (data: import('../types/user').ProfileUpdateRequest): Promise<any> => {
    return api.put('/profile', data);
  }
};

// Purchase Order Statistics API (Owner only)
export const purchaseOrderStatsAPI = {
  getAll: (): Promise<any> => {
    return api.get('/admin/purchase-orders/stats');
  },

  getByItem: (itemId: number): Promise<any> => {
    return api.get(`/admin/purchase-orders/stats/item/${itemId}`);
  },

  getPending: (): Promise<any> => {
    return api.get('/admin/purchase-orders/stats/pending');
  },

  getArrived: (): Promise<any> => {
    return api.get('/admin/purchase-orders/stats/arrived');
  }
};

export default api; 