import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  create: (itemData: any) => api.post('/items', itemData),
  update: (id: number, itemData: any) => api.put(`/items/${id}`, itemData),
  delete: (id: number) => api.delete(`/items/${id}`),
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

export default api; 