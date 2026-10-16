import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Centralized request interceptor to attach JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hotelpro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Centralized response interceptor for handling auth expirations cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't intercept login or register endpoint 401s (those are expected credential rejections)
      const isAuthEndpoint =
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register');

      if (!isAuthEndpoint) {
        // Clear expired or invalidated credentials
        localStorage.removeItem('hotelpro_token');
        localStorage.removeItem('hotelpro_user');
        // Dispatch custom event to notify AuthContext to update state synchronously
        window.dispatchEvent(new Event('hotelpro_session_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
