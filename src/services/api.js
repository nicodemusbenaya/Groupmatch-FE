import axios from 'axios';

// Konfigurasi URL Backend
// Gunakan process.env jika ada, atau fallback ke localhost
const HTTP_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const SOCKET_URL = WS_URL;

const api = axios.create({
  baseURL: HTTP_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Otomatis menyisipkan Token JWT ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;