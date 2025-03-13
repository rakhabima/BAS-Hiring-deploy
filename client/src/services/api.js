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
      
      // Ensure user data is properly formatted
      // If server response doesn't match expected format, adapt it here
      if (response.data && !response.data.user && response.data.uuid) {
        // If the API returns user data in a different format, transform it
        response.data = {
          user: {
            uuid: response.data.uuid,
            name: response.data.name || '',
            email: response.data.email || credentials.email,
            role: response.data.role || 'CANDIDATE'
          },
          ...response.data
        };
      }
      
      console.log('API login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API login error:', error.response || error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      
      // Set role to GUEST
      localStorage.setItem('userRole', 'GUEST');
      
      // Clear any session cookies by setting them to expire
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      return response.data;
    } catch (error) {
      // Even if API call fails, still clear client-side data
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      localStorage.setItem('userRole', 'GUEST');
      
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      throw error;
    }
  }
};

export default api; 