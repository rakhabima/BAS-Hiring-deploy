import api, { logEndpoint, showNotification } from './api';

// Employee services for handling candidates with ON_JOB status
export const employeeService = {
  // Get all employees (candidates with ON_JOB status)
  getEmployees: async (page = 1, limit = 10, filters = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
        ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
        ...(filters.divisionFilter && filters.divisionFilter !== 'all' && { divisionFilter: filters.divisionFilter }),
        ...(filters.statusFilter && filters.statusFilter !== 'all' && { statusFilter: filters.statusFilter }),
        ...(filters.positionFilter && filters.positionFilter !== 'all' && { positionFilter: filters.positionFilter }),
      }).toString();

      // Create a cache key for this specific query
      const cacheKey = `employees_${queryParams}`;
      let cachedData = null;
      
      // Try to get cached data, but don't fail if storage access fails
      try {
        const storedData = sessionStorage.getItem(cacheKey);
        if (storedData) {
          cachedData = JSON.parse(storedData);
        }
      } catch (storageError) {
        console.warn('Failed to access sessionStorage:', storageError);
      }
      
      // Return data from cache if available and recent (less than 30 seconds old)
      if (cachedData) {
        const { data, timestamp } = cachedData;
        const now = new Date().getTime();
        if (now - timestamp < 30000) { // 30 seconds cache validity
          console.log('Using cached employee data');
          return data;
        }
      }

      // If not in cache or cache expired, fetch from server
      console.time('employeeFetch');
      
      // Use the jobApplication endpoint instead
      const endpoint = `/jobApplication/all?${queryParams}`;
      console.log(`API call to: ${endpoint}`);
      const response = await api.get(endpoint);
      console.timeEnd('employeeFetch');
      
      // Process data to filter only employees (candidates with ON_JOB or ACCEPTED status)
      let employeeData = [];
      let totalCount = 0;
      
      if (response.data && response.data.data) {
        // Filter candidates that are now employees (status ON_JOB or ACCEPTED)
        const employeeCandidates = response.data.data.filter(app => 
          app.status === 'ON_JOB' || app.status === 'ACCEPTED'
        );
        
        console.log('Filtered employeeCandidates:', employeeCandidates);
        
        // Apply additional filters based on the provided filters
        let filteredEmployees = [...employeeCandidates];
        
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredEmployees = filteredEmployees.filter(emp => 
            (emp.nama_ktp && emp.nama_ktp.toLowerCase().includes(searchLower)) || 
            (emp.posisi_dilamar && emp.posisi_dilamar.toLowerCase().includes(searchLower))
          );
        }
        
        if (filters.divisionFilter && filters.divisionFilter !== 'all') {
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.division === filters.divisionFilter
          );
        }
        
        if (filters.positionFilter && filters.positionFilter !== 'all') {
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.posisi_dilamar === filters.positionFilter
          );
        }
        
        if (filters.statusFilter && filters.statusFilter !== 'all') {
          const isActive = filters.statusFilter === 'active';
          filteredEmployees = filteredEmployees.filter(emp => 
            isActive ? (emp.status === 'ON_JOB') : (emp.status === 'ACCEPTED')
          );
        }
        
        // Implement pagination manually
        totalCount = filteredEmployees.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalCount);
        employeeData = filteredEmployees.slice(startIndex, endIndex);
        
        // Map application data to employee data format
        employeeData = employeeData.map(app => ({
          uuid: app.uuid || app.id,
          name: app.nama_ktp || 'N/A',
          position: app.posisi_dilamar || 'N/A',
          division: app.divisi || 'N/A',
          location: app.kota || 'N/A',
          joinDate: app.tanggal_bergabung || app.updatedAt || app.submissionDate,
          contractEndDate: app.tanggal_berakhir_kontrak || null,
          isActive: app.status_kerja !== undefined ? app.status_kerja : (app.status === 'ON_JOB'),
          email: app.email || 'N/A',
          phone: app.no_telepon || 'N/A',
          candidateId: app.candidateId || app.uuid,
          applicationId: app.uuid,
          status: app.status
        }));
      }
      
      // Create response in the same format as the expected API would return
      const formattedResponse = {
        success: true,
        data: employeeData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount: totalCount,
          limit: limit
        }
      };
      
      // Try to cache the result with timestamp, but don't fail if storage is full
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: formattedResponse,
          timestamp: new Date().getTime()
        }));
      } catch (storageError) {
        console.warn('Failed to cache employee data:', storageError);
      }
      
      return formattedResponse;
    } catch (error) {
      console.error('Error in getEmployees:', error);
      showNotification('Gagal mengambil data karyawan: ' + (error.response?.data?.message || error.message), 'error');
      
      // Return empty data with pagination structure to prevent UI errors
      return {
        success: false,
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          limit: limit
        }
      };
    }
  },

  // Get employee statistics
  getEmployeeStats: async () => {
    try {
      // Use the dedicated employee stats endpoint
      console.log('Fetching employee statistics');
      const response = await api.get(logEndpoint('/jobApplication/employee/stats'));
      
      if (response.data && response.data.data) {
        console.log('Received employee stats:', response.data.data);
        return response.data.data;
      } else {
        console.warn("Unexpected format for employee stats:", response.data);
        return { total: 0, active: 0, inactive: 0 };
      }
    } catch (error) {
      console.error('Failed to fetch employee stats:', error);
      showNotification('Gagal mengambil statistik karyawan: ' + (error.response?.data?.message || error.message), 'error');
      return { total: 0, active: 0, inactive: 0 };
    }
  },

  // Update employee status (active/inactive)
  updateEmployeeStatus: async (uuid, status) => {
    try {
      // Map to the appropriate jobApplication endpoint for updating status
      const endpoint = `/jobApplication/${uuid}/update-status`;
      console.log(`API call to: ${endpoint}`);
      const statusData = { 
        status: status ? 'ON_JOB' : 'ACCEPTED' 
      };
      const response = await api.put(endpoint, statusData);
      showNotification('Status karyawan berhasil diperbarui', 'success');
      return response.data;
    } catch (error) {
      showNotification('Gagal memperbarui status karyawan: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    }
  }
}; 