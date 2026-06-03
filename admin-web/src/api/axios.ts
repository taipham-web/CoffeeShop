import axios from 'axios';

const api = axios.create({
  // Khi chạy dev sẽ gọi IP thẳng, khi build lên VPS sẽ gọi relative
  baseURL: import.meta.env.PROD ? '/' : 'http://103.72.99.67:5001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
