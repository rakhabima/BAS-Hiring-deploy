import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5555';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth services
export const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/signup', {
        ...userData,
        isPublicRegistration: true // Ensure CANDIDATE role
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api; 