import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize errors into a consistent shape before they reach UI code
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || !error.response) {
      // Backend is completely unreachable
      error.isNetworkError = true;
      error.userMessage =
        'Cannot reach the server. Make sure the backend is running on port 5000.';
      return Promise.reject(error);
    }

    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Request timed out. The server is taking too long to respond.';
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Attach a clean message for UI toast usage
    error.userMessage =
      error.response?.data?.message ||
      (status === 403 ? 'You do not have permission to perform this action.' :
       status === 404 ? 'Resource not found.' :
       status >= 500 ? 'Server error. Please try again.' :
       'Something went wrong.');

    return Promise.reject(error);
  }
);

// Dedicated health ping — uses direct axios (not the api instance) to avoid auth interceptors
export const pingServer = async () => {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
};

export default api;
