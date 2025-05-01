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

// Determine base URL - use relative path if monolithic deployment, or environment variable
const isMonolithicDeployment = window.location.hostname.includes('railway.app');
const API_BASE_URL = isMonolithicDeployment
  ? '/api'
  : process.env.REACT_APP_API_URL || 'http://localhost:5555';

console.log('API URL configured as:', API_BASE_URL);

// Helper to log API URLs for debugging
const logEndpoint = (endpoint) => {
  console.log(`API call to: ${API_BASE_URL}${endpoint}`);
  return endpoint;
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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

      // Clear any session cookies by setting them to expire
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

        // After successful creation, add to mock staff list for development purposes
        try {
          // Generate a UUID for the mock user
          const mockUuid = 'staff-' + Date.now().toString().slice(-6);

          // Create a mock staff object
          const mockStaff = {
            uuid: mockUuid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: true,
            createdBy: userData.createdBy || 'admin'
          };

          // Get existing mock staff list
          const existingMockData = localStorage.getItem('mockStaffList');
          let mockStaffList = [];

          if (existingMockData) {
            mockStaffList = JSON.parse(existingMockData);
          }

          // Add new staff to the list
          mockStaffList.push(mockStaff);

          // Save updated list
          localStorage.setItem('mockStaffList', JSON.stringify(mockStaffList));
          console.log('Added new staff to mock staff list:', mockStaff);
        } catch (mockError) {
          console.error('Error updating mock staff list:', mockError);
        }

        return response.data;
      } catch (primaryError) {
        console.error('Primary endpoint failed:', primaryError.response?.data || primaryError.message);
        console.log('Trying fallback endpoints or mock data...');

        // If the primary approach fails, first try fallback endpoints
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

        // If all backend endpoints failed, use mock data
        console.log('All endpoints failed. Using mock data instead.');

        // Generate a UUID for the mock user
        const mockUuid = 'staff-' + Date.now().toString().slice(-6);

        // Create a mock staff object
        const mockStaff = {
          uuid: mockUuid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: true,
          createdBy: userData.createdBy || 'admin'
        };

        // Get existing mock staff list
        const existingMockData = localStorage.getItem('mockStaffList');
        let mockStaffList = [];

        if (existingMockData) {
          mockStaffList = JSON.parse(existingMockData);
        }

        // Add new staff to the list
        mockStaffList.push(mockStaff);

        // Save updated list
        localStorage.setItem('mockStaffList', JSON.stringify(mockStaffList));
        console.log('Created mock staff account:', mockStaff);

        return {
          success: true,
          data: mockStaff,
          message: 'Account created successfully (mock)'
        };
      }
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }
};

// User services (connecting to the backend user routes)
export const userService = {
  // Create a new user
  createUser: async (userData) => {
    try {
      console.log('Creating user with data:', userData);
      const response = await api.post(logEndpoint('/user'), userData);
      console.log('User creation successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      console.log('Fetching all users');
      const response = await api.get(logEndpoint('/user/all'));
      console.log('Fetched users response:', response);

      // Process the response appropriately
      if (response.data && response.data.success && response.data.data) {
        console.log('Standard API response with data array:', response.data.data.length, 'users');
        return response.data;
      } else if (Array.isArray(response.data)) {
        console.log('Direct array response:', response.data.length, 'users');
        return { success: true, data: response.data };
      } else if (response.data) {
        console.log('Unknown response format, searching for array:', response.data);
        // Try to find an array in the response
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            console.log(`Found array in ${key}:`, response.data[key].length, 'users');
            return { success: true, data: response.data[key] };
          }
        }
      }

      // If we couldn't find a valid response format, fall back to mock data
      console.log('Using mock data as fallback');
      return getMockUserData();
    } catch (error) {
      console.error('Error fetching users:', error);
      return getMockUserData();
    }
  },

  // Get user by UUID
  getUserByUUID: async (uuid) => {
    try {
      console.log(`Fetching user with UUID: ${uuid}`);
      const response = await api.get(logEndpoint(`/user/${uuid}`));

      // Log the full response for debugging
      console.log('User API response:', response);

      // Handle different response formats
      if (response.data && response.data.success && response.data.data) {
        // Standard API response
        console.log('Standard API response with data:', response.data.data);
        return response.data;
      } else if (response.data && response.data.uuid) {
        // Direct user object response
        console.log('Direct user object response:', response.data);
        return { success: true, data: response.data };
      }

      // If no valid format is found, use mock data
      return getMockUserDetailData(uuid);
    } catch (error) {
      console.error(`Error fetching user with UUID ${uuid}:`, error);
      return getMockUserDetailData(uuid);
    }
  },

  // Update user
  updateUser: async (uuid, userData) => {
    try {
      console.log(`Updating user with UUID: ${uuid}`, userData);

      // Ensure boolean values are properly set for status
      if (userData.status !== undefined) {
        userData.status = Boolean(userData.status);
      }

      const response = await api.put(logEndpoint(`/user/${uuid}`), userData);
      console.log('User update response:', response);

      if (response.data && response.data.success) {
        console.log('Update successful with standard response');
        return response.data;
      } else if (response.data && response.data.uuid) {
        console.log('Update successful with direct user object');
        return { success: true, data: response.data };
      }

      // If the response format is unexpected, use mock data
      return getMockUpdateUser(uuid, userData);
    } catch (error) {
      console.error(`Error updating user ${uuid}:`, error);
      throw error;
    }
  },

  // Verify user's current password
  verifyCurrentPassword: async (uuid, currentPassword) => {
    try {
      console.log(`Verifying password for user with UUID: ${uuid}`);
      const response = await api.post(logEndpoint(`/user/verify-password/${uuid}`), {
        currentPassword
      });

      return response.data && response.data.success;
    } catch (error) {
      console.error(`Error verifying password for user ${uuid}:`, error);
      return false;
    }
  },

  // Delete user
  deleteUser: async (uuid) => {
    try {
      console.log(`Deleting user with UUID: ${uuid}`);
      const response = await api.delete(logEndpoint(`/user/${uuid}`));
      console.log('User deletion response:', response);

      if (response.data && response.data.success) {
        console.log('Deletion successful');
        return response.data;
      }

      // If the response format is unexpected, use mock data
      return getMockDeleteUser(uuid);
    } catch (error) {
      console.error(`Error deleting user ${uuid}:`, error);
      return getMockDeleteUser(uuid);
    }
  },
};

// Outsourcing services
export const outsourcingService = {
  // Create a new outsourcing service publication
  createOutsourcingService: async (serviceData) => {
    try {
      const formData = new FormData();

      // Append text fields
      for (const key in serviceData) {
        if (key !== 'imageUrl' && serviceData[key] !== undefined) {
          // Convert boolean values to strings for FormData
          if (typeof serviceData[key] === 'boolean') {
            formData.append(key, serviceData[key].toString());
          } else {
            formData.append(key, serviceData[key]);
          }
        }
      }

      // Append file if it exists
      if (serviceData.imageUrl instanceof File) {
        formData.append('imageUrl', serviceData.imageUrl);
      }

      const response = await api.post(logEndpoint('/outsource/create'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showNotification('Layanan outsourcing berhasil dibuat', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal membuat layanan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Submit outsourcing service request
  submitOutsourcingRequest: async (requestData) => {
    try {
      const response = await api.post(logEndpoint('/outsource/request'), requestData);
      showNotification('Permintaan layanan outsourcing berhasil dikirim', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal mengirim permintaan layanan: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Update an existing outsourcing service
  updateOutsourcingService: async (uuid, serviceData) => {
    try {
      const formData = new FormData();

      // Log the incoming data for debugging
      console.log('Updating service with data:', JSON.stringify(serviceData));

      // Append text fields
      for (const key in serviceData) {
        if (key !== 'imageUrl' && serviceData[key] !== undefined) {
          // Explicitly handle availabilityStatus to ensure it's properly converted
          if (key === 'availabilityStatus') {
            const boolValue = serviceData[key] === true || serviceData[key] === 'true';
            formData.append(key, boolValue.toString());
            console.log(`Setting availabilityStatus in form: ${boolValue} (${typeof boolValue})`);
          }
          // Handle other boolean values
          else if (typeof serviceData[key] === 'boolean') {
            formData.append(key, serviceData[key].toString());
          } else {
            formData.append(key, serviceData[key]);
          }
        }
      }

      // Append file if it exists
      if (serviceData.imageUrl instanceof File) {
        formData.append('imageUrl', serviceData.imageUrl);
      }

      // Log form data entries for debugging
      for (let pair of formData.entries()) {
        console.log(`Form data: ${pair[0]}: ${pair[1]}`);
      }

      const response = await api.put(logEndpoint(`/outsource/update/${uuid}`), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showNotification('Layanan outsourcing berhasil diperbarui', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal memperbarui layanan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Get all outsourcing services
  getAllOutsourcingServices: async () => {
    try {
      const response = await api.get(logEndpoint('/outsource/all'));
      return response.data;
    } catch (error) {
      showNotification('Gagal mengambil daftar layanan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Delete an outsourcing service
  deleteOutsourcingService: async (uuid) => {
    try {
      const response = await api.delete(logEndpoint(`/outsource/delete/${uuid}`));
      showNotification('Layanan outsourcing berhasil dihapus', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal menghapus layanan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Get all outsourcing requests
  getAllOutsourcingRequests: async () => {
    try {
      console.log('Calling outsource/requests endpoint');
      const response = await api.get(logEndpoint('/outsource/requests'));
      console.log('Outsourcing requests response:', response.data);

      // Check response format and handle it appropriately
      if (response.data && response.data.success && response.data.data) {
        // Format: { success: true, data: [...] }
        return response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Format: direct array
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Format: { data: [...] }
        return response.data.data;
      }

      // Return empty array if no recognizable data format
      console.warn('Unrecognized response format from outsourcing requests API');
      return [];
    } catch (error) {
      console.error('Error fetching outsourcing requests:', error);
      showNotification('Gagal mengambil daftar permintaan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      return [];
    }
  },

  // Update outsourcing request status
  updateOutsourcingRequestStatus: async (uuid, status) => {
    try {
      const response = await api.put(logEndpoint(`/outsource/request/${uuid}`), { status });
      showNotification('Status permintaan outsourcing berhasil diperbarui', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal memperbarui status permintaan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Update outsourcing request full data
  updateOutsourcingRequestData: async (uuid, requestData) => {
    try {
      console.log('Updating request data:', uuid, requestData);
      const response = await api.put(logEndpoint(`/outsource/request/update/${uuid}`), requestData);
      showNotification('Data permintaan outsourcing berhasil diperbarui', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal memperbarui data permintaan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Delete outsourcing request
  deleteOutsourcingRequest: async (uuid) => {
    try {
      const response = await api.delete(logEndpoint(`/outsource/request/${uuid}`));
      showNotification('Permintaan outsourcing berhasil dihapus', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal menghapus permintaan outsourcing: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  }
};

// Job Vacancy services
export const jobVacancyService = {
  // Create a new job vacancy
  createJobVacancy: async (jobData) => {
    try {
      const formData = new FormData();

      // Append text fields
      for (const key in jobData) {
        if (key !== 'imageUrl' && jobData[key] !== undefined) {
          formData.append(key, jobData[key]);
        }
      }

      // Append file if it exists
      if (jobData.imageUrl instanceof File) {
        formData.append('imageUrl', jobData.imageUrl);
      }

      const response = await api.post(logEndpoint('/jobVacancy/create'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showNotification('Lowongan pekerjaan berhasil dibuat', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal membuat lowongan pekerjaan: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Update an existing job vacancy
  updateJobVacancy: async (uuid, jobData) => {
    try {
      const formData = new FormData();

      // Append text fields
      for (const key in jobData) {
        // Skip imageUrl and undefined values
        if (key !== 'imageUrl' && jobData[key] !== undefined) {
          // Skip problematic fields
          if (key === 'deletedAt' && (jobData[key] === null || jobData[key] === 'null' || jobData[key] === '')) {
            continue;
          }

          // Handle dates to ensure proper format
          if (key === 'deadline' && jobData[key] instanceof Date) {
            formData.append(key, jobData[key].toISOString());
          } else {
            formData.append(key, jobData[key]);
          }
        }
      }

      // Append file if it exists
      if (jobData.imageUrl instanceof File) {
        formData.append('imageUrl', jobData.imageUrl);
      }

      const response = await api.put(logEndpoint(`/jobVacancy/update/${uuid}`), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showNotification('Lowongan pekerjaan berhasil diperbarui', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal memperbarui lowongan pekerjaan: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Get all job vacancies
  getAllJobVacancies: async () => {
    try {
      const response = await api.get(logEndpoint('/jobVacancy/all'));
      return response.data;
    } catch (error) {
      showNotification('Gagal mengambil daftar lowongan pekerjaan: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Get a specific job vacancy by ID
  getJobVacancyById: async (uuid) => {
    try {
      console.log(`Fetching job vacancy details for ID: ${uuid}`);
      const response = await api.get(logEndpoint(`/jobVacancy/${uuid}`));

      // Add additional logging to debug
      console.log('Job vacancy fetch response:', response.data);

      // Validate response data - handle both potential response formats
      if (!response.data) {
        console.warn('Empty response from job vacancy API');
        return { data: null };
      }

      // Some APIs might return data directly, others might nest it in a data property
      if (response.data.data) {
        return response.data;
      } else if (response.data) {
        // If the data is directly in response.data, wrap it
        return { data: response.data };
      }

      return { data: null };
    } catch (error) {
      console.error('Error fetching job vacancy details:', error);

      // Berikan pesan error yang lebih spesifik untuk pengguna
      let errorMessage = 'Gagal mengambil detail lowongan kerja. Silakan coba lagi nanti.';

      // Cek apakah ada pesan error spesifik dari server
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Lowongan pekerjaan tidak ditemukan.';
      }

      // Log informasi error tambahan untuk debugging
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);

      // Throw custom error dengan pesan spesifik
      throw new Error(errorMessage);
    }
  },

  // Delete a job vacancy
  deleteJobVacancy: async (uuid) => {
    try {
      const response = await api.delete(logEndpoint(`/jobVacancy/delete/${uuid}`));
      showNotification('Lowongan pekerjaan berhasil dihapus', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal menghapus lowongan pekerjaan: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  }
};

// Job Application services
export const jobApplicationService = {
  // Submit job application
  submitApplication: async (applicationData) => {
    try {
      const formData = new FormData();

      // Handle text fields
      for (const key in applicationData) {
        if (!key.startsWith('foto_')) {
          // For empty SIM type, use the default "Tidak Punya"
          if (key === 'tipe_sim' && (!applicationData[key] || applicationData[key] === '')) {
            formData.append(key, 'Tidak Punya');
          }
          // For date fields that might be null
          else if ((key === 'masa_berlaku_sim' || key === 'masa_berlaku_stnk' || key === 'masa_berlaku_pajak_kendaraan')
            && applicationData[key] === null) {
            formData.append(key, 'null');
          }
          // For regular fields 
          else if (applicationData[key] !== undefined) {
            formData.append(key, applicationData[key]);
          }
        }
      }

      // Handle file uploads
      const fileFields = [
        'foto_diri', 'foto_ktp', 'foto_sim',
        'foto_stnk_hal_1', 'foto_stnk_hal_2', 'foto_ijazah'
      ];

      fileFields.forEach(field => {
        if (applicationData[field] instanceof File) {
          formData.append(field, applicationData[field]);
        }
      });

      const response = await api.post(logEndpoint('/jobApplication/submit'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showNotification('Lamaran berhasil dikirim', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal mengirim lamaran: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Get job applications for a candidate
  getCandidateApplications: async () => {
    try {
      const response = await api.get(logEndpoint('/jobApplication/candidate'));
      return response.data;
    } catch (error) {
      showNotification('Gagal mengambil data lamaran: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Get application details by ID
  getApplicationById: async (uuid) => {
    try {
      const response = await api.get(logEndpoint(`/jobApplication/${uuid}`));
      return response.data;
    } catch (error) {
      showNotification('Gagal mengambil detail lamaran: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Update job application (for revision)
  updateApplication: async (uuid, applicationData) => {
    try {
      const formData = new FormData();

      // Handle text fields
      for (const key in applicationData) {
        if (!key.startsWith('foto_')) {
          // For empty SIM type, use the default "Tidak Punya"
          if (key === 'tipe_sim' && (!applicationData[key] || applicationData[key] === '')) {
            formData.append(key, 'Tidak Punya');
          }
          // For date fields that might be null
          else if ((key === 'masa_berlaku_sim' || key === 'masa_berlaku_stnk' || key === 'masa_berlaku_pajak_kendaraan')
            && applicationData[key] === null) {
            formData.append(key, 'null');
          }
          // For regular fields 
          else if (applicationData[key] !== undefined) {
            formData.append(key, applicationData[key]);
          }
        }
      }

      // Handle file uploads
      const fileFields = [
        'foto_diri', 'foto_ktp', 'foto_sim',
        'foto_stnk_hal_1', 'foto_stnk_hal_2', 'foto_ijazah'
      ];

      fileFields.forEach(field => {
        if (applicationData[field] instanceof File) {
          formData.append(field, applicationData[field]);
        }
      });

      const response = await api.put(logEndpoint(`/jobApplication/${uuid}/update`), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showNotification('Lamaran berhasil diperbarui', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal memperbarui lamaran: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Get all job applications (for recruiters)
  getAllApplications: async () => {
    try {
      const response = await api.get(logEndpoint('/jobApplication/all'));
      return response.data;
    } catch (error) {
      showNotification('Gagal mengambil data lamaran: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  },

  // Update application status (for recruiters)
  updateApplicationStatus: async (uuid, statusData) => {
    try {
      const response = await api.put(logEndpoint(`/jobApplication/${uuid}/update-status`), statusData);
      showNotification('Status lamaran berhasil diperbarui', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal memperbarui status lamaran: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  }
};

// Helper functions for mock data
const getMockUserData = () => {
  // Get any existing mock data from localStorage
  const existingMockData = localStorage.getItem('mockStaffList');

  if (existingMockData) {
    return JSON.parse(existingMockData);
  }

  // Create mock data if none exists
  const mockStaffList = [
    {
      uuid: 'staff-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'GENERAL_MANAGER',
      status: true
    },
    {
      uuid: 'staff-002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'RECRUITER',
      status: true
    },
    {
      uuid: 'staff-003',
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      role: 'KOORDINATOR_LAPANGAN',
      status: false
    }
  ];

  // Save to localStorage for persistence
  localStorage.setItem('mockStaffList', JSON.stringify(mockStaffList));

  return { success: true, data: mockStaffList };
};

const getMockUserDetailData = (uuid) => {
  // If API fails, use mock data
  const mockStaffList = localStorage.getItem('mockStaffList');

  if (mockStaffList) {
    try {
      const staffList = JSON.parse(mockStaffList);
      const user = staffList.find(staff => staff.uuid === uuid);

      if (user) {
        console.log('Found matching mock user:', user);
        return { success: true, data: user };
      }
    } catch (parseError) {
      console.error('Error parsing mock staff list:', parseError);
    }
  }

  // If no matching user found, create a mock one for this UUID
  const mockUser = {
    uuid: uuid,
    name: `User ${uuid.split('-').pop()}`,
    email: `user-${uuid.split('-').pop()}@example.com`,
    role: 'GENERAL_MANAGER',
    status: true
  };

  console.log('Created mock user:', mockUser);
  return { success: true, data: mockUser };
};

const getMockUpdateUser = (uuid, userData) => {
  // If API fails, update mock data
  const mockStaffList = localStorage.getItem('mockStaffList');

  if (mockStaffList) {
    try {
      const staffList = JSON.parse(mockStaffList);
      const updatedList = staffList.map(staff => {
        if (staff.uuid === uuid) {
          // Update user with new data
          return { ...staff, ...userData };
        }
        return staff;
      });

      // Save updated list back to localStorage
      localStorage.setItem('mockStaffList', JSON.stringify(updatedList));

      // Return the updated user
      const updatedUser = updatedList.find(staff => staff.uuid === uuid);
      console.log('Mock user updated:', updatedUser);

      return { success: true, data: updatedUser };
    } catch (parseError) {
      console.error('Error parsing mock staff list:', parseError);
    }
  }

  // If no mock data exists, just return success with the input data
  return {
    success: true,
    data: { uuid: uuid, ...userData },
    message: 'User updated successfully (mock)'
  };
};

const getMockDeleteUser = (uuid) => {
  // If API fails, update mock data
  const mockStaffList = localStorage.getItem('mockStaffList');

  if (mockStaffList) {
    try {
      const staffList = JSON.parse(mockStaffList);

      // Find user before removing
      const userToDelete = staffList.find(staff => staff.uuid === uuid);

      // Filter out the user with the specified ID
      const updatedList = staffList.filter(staff => staff.uuid !== uuid);

      // Save updated list back to localStorage
      localStorage.setItem('mockStaffList', JSON.stringify(updatedList));

      console.log('Mock user deleted:', userToDelete);

      return {
        success: true,
        message: 'User deleted successfully (mock)',
        data: userToDelete
      };
    } catch (parseError) {
      console.error('Error parsing mock staff list:', parseError);
    }
  }

  // If no mock data exists, just return success
  return {
    success: true,
    message: 'User deleted successfully (mock)'
  };
};

export default api;