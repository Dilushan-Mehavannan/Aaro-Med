import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sd_token');
      // Only redirect if NOT already on home/login page (prevents infinite loop)
      const path = window.location.pathname;
      if (path !== '/' && path !== '/login') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
