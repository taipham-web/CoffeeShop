import axios from 'axios';

const api = axios.create({
  // Khi chạy localhost sẽ gọi thẳng IP. Khi build lên Vercel sẽ gọi qua '/api' để proxy
  baseURL: import.meta.env.PROD ? '/api' : 'http://103.72.99.67:5001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
