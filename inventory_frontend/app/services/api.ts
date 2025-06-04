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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
  }) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
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
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
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
  }) => api.post('/public/barcode/use', usageData),
};

export const adminAPI = {
  getItemDisplaySettings: () => api.get('/admin/settings/item-display'),
  updateItemDisplaySettings: (fields: string[]) => 
    api.post('/admin/settings/item-display', { fields }),
};

export const statsAPI = {
  getDailyUsage: (days: number = 7) => api.get(`/stats/daily-usage?days=${days}`),
  getTopUsageItems: (limit: number = 5) => api.get(`/stats/top-usage?limit=${limit}`),
  getLowStockItems: () => api.get('/stats/low-stock'),
  getStockAlerts: () => api.get('/stats/stock-alerts'),
  getQuickStats: () => api.get('/stats/quick-stats'),
};

export default api; 