import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/', // Proxy will forward this to http://localhost:5000
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This enables cookie handling
});

// Request interceptor for adding any auth tokens or logging
api.interceptors.request.use(
  (config) => {
    // You can add request logging here if needed
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);

      // You can handle specific status codes here
      switch (error.response.status) {
        case 401:
          console.log('Unauthorized - redirect to login');
          break;
        case 403:
          console.log('Forbidden - insufficient permissions');
          break;
        case 500:
          console.log('Server error');
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Error in request configuration
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.',
      };
    }
  },

  // Signup user
  signup: async (username, email, password) => {
    try {
      const response = await api.post('/signup', { username, email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed. Please try again.',
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/logout');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Logout failed.',
      };
    }
  },

  // Check authentication status
  checkAuth: async () => {
    try {
      const response = await api.get('/check-auth');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Auth check failed.',
      };
    }
  },
};

export default api;
