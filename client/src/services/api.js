import axios from 'axios';

// Create custom event types for notifications
export const SHOW_NOTIFICATION = 'SHOW_NOTIFICATION';

// Helper function to show notifications
const showNotification = (message, severity) => {
  const event = new CustomEvent(SHOW_NOTIFICATION, {
    detail: { message, severity }
  });
  window.dispatchEvent(event);
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5555';

console.log('API URL configured as:', API_URL);

// Helper to log API URLs for debugging
const logEndpoint = (endpoint) => {
  console.log(`API call to: ${API_URL}${endpoint}`);
  return endpoint;
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`${error.config.method.toUpperCase()} ${error.config.url} - Status: ${error.response.status}`);
    } else {
      console.error(`Request failed for ${error.config?.url || 'unknown endpoint'}:`, error.message);
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post(logEndpoint('/auth/signup'), {
        ...userData,
        isPublicRegistration: true // Ensure CANDIDATE role
      });
      
      // Show success notification
      showNotification('Registrasi berhasil! Silakan login.', 'success');
      
      return response.data;
    } catch (error) {
      // Show error notification
      let errorMsg = 'Registrasi gagal. Silakan coba lagi.';
      
      if (error.response) {
        if (error.response.status === 409) {
          errorMsg = 'Email sudah terdaftar. Silakan gunakan email lain.';
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      showNotification(errorMsg, 'error');
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Login attempt:', credentials.email);
      
      // Check if this is a mock account first (for development only)
      const mockStaffList = localStorage.getItem('mockStaffList');
      if (mockStaffList) {
        try {
          const staffList = JSON.parse(mockStaffList);
          const matchingUser = staffList.find(user => 
            user.email === credentials.email
          );
          
          if (matchingUser) {
            console.log('Found matching mock user, checking if backend auth fails');
          }
        } catch (error) {
          console.error('Error parsing mock staff list:', error);
        }
      }
      
      // Proceed with real login
      const response = await api.post(logEndpoint('/auth/login'), credentials);
      
      // Show success notification
      showNotification('Login berhasil! Selamat datang.', 'success');
      
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
      // Show error notification
      let errorMsg = 'Login gagal. Silakan coba lagi.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Email atau kata sandi salah.';
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      showNotification(errorMsg, 'error');
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post(logEndpoint('/auth/logout'));
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      
      // Set role to GUEST
      localStorage.setItem('userRole', 'GUEST');
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Show success notification
      showNotification('Logout berhasil. Sampai jumpa!', 'success');
      
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
      
      // Show error notification
      showNotification('Terjadi kesalahan saat logout.', 'error');
      throw error;
    }
  },

  // Create internal staff account (Admin only)
  createAccount: async (userData) => {
    try {
      console.log('Creating staff account with data:', userData);
      
      // PRIORITY 1: Use the same endpoint as registration since we know it works
      // But with isPublicRegistration: false to indicate admin-created account
      try {
        console.log('Trying primary signup endpoint with staff flags');
        const response = await api.post(logEndpoint('/auth/signup'), {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          isPublicRegistration: false,
          isInternalStaff: true,
          createdBy: userData.createdBy || 'admin'
        });
        
        console.log('Staff account creation successful:', response.data);
        return response.data;
      } catch (primaryError) {
        console.error('Primary endpoint failed:', primaryError.response?.data || primaryError.message);
        console.log('Trying fallback endpoints...');
        
        // If the primary approach fails, try the fallback endpoints
        const possibleEndpoints = [
          '/auth/create-staff',
          '/admin/create-account',
          '/auth/admin/create-account',
          '/auth/signup/staff',
          '/auth/register-staff'
        ];
        
        let successResponse = null;
        let errorDetails = [];
        
        // Try each endpoint
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await api.post(logEndpoint(endpoint), userData);
            console.log(`Success with endpoint ${endpoint}:`, response.data);
            successResponse = response;
            break; // Exit the loop if successful
          } catch (endpointError) {
            const errorInfo = {
              endpoint,
              status: endpointError.response?.status,
              message: endpointError.message,
              data: endpointError.response?.data
            };
            errorDetails.push(errorInfo);
            console.log(`Failed with endpoint ${endpoint}:`, errorInfo);
            // Continue to the next endpoint
          }
        }
        
        if (successResponse) {
          return successResponse.data;
        }
        
        // If all backend endpoints failed, throw a clear error
        console.error('All account creation endpoints failed:', errorDetails);
        throw new Error('Could not create account. Database connection issue or endpoint not implemented.');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }
};

export default api; 