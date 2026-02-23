import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

export const customerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
};

export const paymentConditionService = {
  getAll: () => api.get('/paymentconditions'),
  getById: (id) => api.get(`/paymentconditions/${id}`),
  create: (data) => api.post('/paymentconditions', data),
};

export const orderService = {
  getAll: () => api.get('/orders'),
  getPending: () => api.get('/orders/pending'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  approve: (id) => api.put(`/orders/${id}/approve`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  changePassword: (id, newPassword) => api.put(`/users/${id}/password`, { newPassword }),
};

export default api;
