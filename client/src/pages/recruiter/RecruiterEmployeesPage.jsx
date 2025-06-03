import {
  AccountBox as AccountBoxIcon,
  Business as BusinessIcon,
  DeleteOutline as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  WorkOutline as WorkOutlineIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApplicationService, showNotification } from '../../services/api';

// Status color mapping for better UI
const statusColors = {
  'active': '#2E7D32',
  'inactive': '#D32F2F'
};

// Map for role-based page titles
const pageTitleMap = {
  'RECRUITER': 'Daftar Karyawan',
  'KOORDINATOR_LAPANGAN': 'Daftar Karyawan'
};

const RecruiterEmployeesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  // Dynamic position and division options based on available data
  const [positionOptions, setPositionOptions] = useState([
    { value: 'all', label: 'Semua Posisi' }
  ]);
  
  const [divisionOptions, setDivisionOptions] = useState([
    { value: 'all', label: 'Semua Divisi' }
  ]);
  
  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Tidak Aktif' }
  ];
  
  // Debounce timers
  const searchDebounceTimer = useRef(null);
  const filtersDebounceTimer = useRef(null);
  
  // Current user role
  const [userRole, setUserRole] = useState('RECRUITER');
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  
  // Get current user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Fetch employee detail data
  const fetchEmployeeDetails = async (employeeId) => {
    try {
      const response = await jobApplicationService.getApplicationById(employeeId);
      if (response && response.data) {
        // Log full response to check structure
        console.log(`Full data for employee ${employeeId}:`, JSON.stringify(response.data, null, 2));
        
        // Extract location from jobPosting if available
        let jobPostingLocation = null;
        
        // Check various possible structures for jobPostingId
        if (response.data.jobPostingId) {
          if (typeof response.data.jobPostingId === 'object' && response.data.jobPostingId.location) {
            console.log("Found location in jobPostingId object:", response.data.jobPostingId.location);
            jobPostingLocation = response.data.jobPostingId.location;
          } else if (response.data.jobPosting && typeof response.data.jobPosting === 'object') {
            console.log("Found location in jobPosting object:", response.data.jobPosting.location);
            jobPostingLocation = response.data.jobPosting.location;
          }
        }
        
        console.log(`Location data for ${employeeId}:`, {
          lokasi_penempatan: response.data.lokasi_penempatan,
          kota: response.data.kota,
          divisi: response.data.divisi,
          tanggal_bergabung: response.data.tanggal_bergabung,
          tanggal_berakhir_kontrak: response.data.tanggal_berakhir_kontrak,
          status_kerja: response.data.status_kerja
        });
        
        return {
          ...response.data,
          jobPostingLocation
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching details for employee ${employeeId}:`, error);
      return null;
    }
  };

  // Fetch employees with filters and pagination
  const fetchEmployees = useCallback(async (currentPage, currentLimit, currentFilters) => {
    try {
      setLoading(true);
      
      // Use the existing getAllApplications function to get the list of employees
      const response = await jobApplicationService.getAllApplications(
        currentPage,
        currentLimit,
        {
          searchTerm: currentFilters.searchTerm,
          stageFilter: 'Diterima', // To get applications in accepted stages
          positionFilter: currentFilters.positionFilter !== 'all' ? currentFilters.positionFilter : undefined
        }
      );

      if (response && response.data) {
        console.log('Raw API response:', response.data);
        
        // Filter for employees only (ON_JOB or ACCEPTED status)
        const employeeApplications = response.data.filter(app => 
          app.status === 'ON_JOB' || app.status === 'ACCEPTED'
        );
        
        // Fetch detailed information for each employee
        const employeesWithDetails = await Promise.all(
          employeeApplications.map(async (app) => {
            const detailedData = await fetchEmployeeDetails(app.uuid);
            if (detailedData) {
              console.log('Detailed employee data:', detailedData);
              return {
                ...app,
                divisi: detailedData.divisi || null,
                tanggal_bergabung: detailedData.tanggal_bergabung || null,
                tanggal_berakhir_kontrak: detailedData.tanggal_berakhir_kontrak || null,
                status_kerja: detailedData.status_kerja !== undefined ? detailedData.status_kerja : (detailedData.status === 'ON_JOB'),
                lokasi_penempatan: detailedData.lokasi_penempatan || null
              };
            }
            return app;
          })
        );
        
        console.log('Employees with details:', employeesWithDetails);
        
        // Apply additional client-side filters
        let filteredEmployees = [...employeesWithDetails];
        
        if (currentFilters.divisionFilter && currentFilters.divisionFilter !== 'all') {
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.divisi === currentFilters.divisionFilter
          );
        }
        
        if (currentFilters.statusFilter && currentFilters.statusFilter !== 'all') {
          const isActive = currentFilters.statusFilter === 'active';
          filteredEmployees = filteredEmployees.filter(emp => {
            if (emp.status_kerja !== undefined) {
              return isActive ? emp.status_kerja === true : emp.status_kerja === false;
            } else {
              return isActive ? emp.status === 'ON_JOB' : emp.status === 'ACCEPTED';
            }
          });
        }
        
        // Transform the data to match the expected format
        const mappedEmployees = filteredEmployees.map(app => {
          // Log each item before transformation
          console.log('Processing application for display:', {
            uuid: app.uuid,
            name: app.nama_ktp,
            position: app.posisi_dilamar,
            divisi: app.divisi,
            kota: app.kota,
            lokasi_penempatan: app.lokasi_penempatan,
            tanggal_bergabung: app.tanggal_bergabung,
            tanggal_berakhir_kontrak: app.tanggal_berakhir_kontrak,
            status_kerja: app.status_kerja
          });
          
          // Determine the best location value to display
          let locationDisplay = 'N/A';
          if (app.jobPostingLocation) {
            locationDisplay = app.jobPostingLocation;
          } else if (app.kota) {
            locationDisplay = app.kota;
          }
          
          console.log(`Final location for ${app.uuid}:`, locationDisplay);
          
          return {
            uuid: app.uuid,
            name: app.nama_ktp || 'N/A',
            position: app.posisi_dilamar || 'N/A',
            divisi: app.divisi || 'N/A',
            lokasi_penempatan: app.lokasi_penempatan,
            tanggal_bergabung: app.tanggal_bergabung || null,
            tanggal_berakhir_kontrak: app.tanggal_berakhir_kontrak || null,
            status_kerja: app.status_kerja !== undefined ? app.status_kerja : (app.status === 'ON_JOB'),
            status: app.status
          };
        });
        
        console.log('Mapped employees:', mappedEmployees);
        
        setEmployees(mappedEmployees);
        setTotalEmployees(response.pagination?.totalCount || filteredEmployees.length);
        
        // Update position options
        const uniquePositions = [...new Set(filteredEmployees.map(emp => emp.posisi_dilamar))].filter(Boolean);
        setPositionOptions(prevOptions => {
          const existingValues = new Set(prevOptions.map(opt => opt.value));
          const newOptions = uniquePositions
            .filter(pos => !existingValues.has(pos) && pos !== 'all')
            .map(pos => ({ value: pos, label: pos }));
          if (newOptions.length > 0) return [...prevOptions, ...newOptions];
          return prevOptions;
        });
        
        // Update division options
        const uniqueDivisions = [...new Set(filteredEmployees.map(emp => emp.divisi))].filter(Boolean);
        setDivisionOptions(prevOptions => {
          const existingValues = new Set(prevOptions.map(opt => opt.value));
          const newOptions = uniqueDivisions
            .filter(div => !existingValues.has(div) && div !== 'all')
            .map(div => ({ value: div, label: div }));
          if (newOptions.length > 0) return [...prevOptions, ...newOptions];
          return prevOptions;
        });
      } else {
        setEmployees([]);
        setTotalEmployees(0);
      }
      setError(null);
    } catch (err) {
      setError('Gagal memuat daftar karyawan.');
      console.error('Error fetching employees:', err);
      setEmployees([]);
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search term changes with debounce
  const handleSearchChange = (event) => {
    const value = event.target.value;
    
    // Clear any existing timer
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    // Set the search term immediately to update the input field
    setSearchTerm(value);
    
    // Set a new timer for the actual data fetch
    searchDebounceTimer.current = setTimeout(() => {
      // Reset to first page when search changes
      setPage(0);
    }, 400); // 400ms debounce delay
  };

  // Handle filter changes with debounce
  const handleFilterChange = (filterType, value) => {
    // Set the filter value immediately to update the UI
    switch (filterType) {
      case 'division':
        setDivisionFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'position':
        setPositionFilter(value);
        break;
      default:
        break;
    }
    
    // Clear any existing timer
    if (filtersDebounceTimer.current) {
      clearTimeout(filtersDebounceTimer.current);
    }
    
    // Set a new timer for the actual data fetch and go back to first page
    filtersDebounceTimer.current = setTimeout(() => {
      setPage(0);
    }, 400); // 400ms debounce delay
  };

  // Calculate employee statistics from application data
  const calculateEmployeeStats = useCallback(async () => {
    try {
      console.log("Calculating employee stats...");
      // Fetch all employees (without pagination) to calculate stats
      const response = await jobApplicationService.getAllApplications(1, 1000, {
        stageFilter: 'Diterima' // Get all accepted applications
      });
      
      if (response && response.data) {
        // Filter for employees (ON_JOB or ACCEPTED status)
        const employeeApplications = response.data.filter(app => 
          app.status === 'ON_JOB' || app.status === 'ACCEPTED'
        );
        
        // For accurate stats, we need to fetch details for each employee
        const employeesWithDetails = await Promise.all(
          employeeApplications.map(async (app) => {
            const detailedData = await fetchEmployeeDetails(app.uuid);
            if (detailedData) {
              return {
                ...app,
                status_kerja: detailedData.status_kerja !== undefined ? detailedData.status_kerja : (detailedData.status === 'ON_JOB')
              };
            }
            return app;
          })
        );
        
        // Count active and inactive employees
        const activeCount = employeesWithDetails.filter(emp => 
          emp.status_kerja === true || (emp.status_kerja === undefined && emp.status === 'ON_JOB')
        ).length;
        
        const inactiveCount = employeesWithDetails.filter(emp => 
          emp.status_kerja === false || (emp.status_kerja === undefined && emp.status === 'ACCEPTED')
        ).length;
        
        const totalCount = employeesWithDetails.length;
        
        console.log("Calculated stats:", {
          total: totalCount,
          active: activeCount,
          inactive: inactiveCount
        });
        
          setStats({
          total: totalCount,
          active: activeCount,
          inactive: inactiveCount
          });
        }
      } catch (statsError) {
      console.error("Failed to calculate employee stats:", statsError);
        showNotification('Gagal memuat statistik karyawan.', 'error');
        setStats({ total: 0, active: 0, inactive: 0 });
      }
  }, []);

  // Fetch employee statistics once on mount
  useEffect(() => {
    calculateEmployeeStats();
  }, [calculateEmployeeStats]);

  // Effect to fetch paginated employees
  useEffect(() => {
    const currentFilters = { searchTerm, divisionFilter, statusFilter, positionFilter };
    fetchEmployees(page, rowsPerPage, currentFilters);
  }, [page, rowsPerPage, searchTerm, divisionFilter, statusFilter, positionFilter, fetchEmployees]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  // Filter handlers
  const handleDivisionFilterChange = (event) => {
    handleFilterChange('division', event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    handleFilterChange('status', event.target.value);
  };

  const handlePositionFilterChange = (event) => {
    handleFilterChange('position', event.target.value);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    handleFilterChange('division', 'all');
    handleFilterChange('status', 'all');
    handleFilterChange('position', 'all');
    setPage(0); // Reset page on filter reset
  };

  // Handle view employee detail
  const handleViewEmployee = (employeeId) => {
    navigate(`/recruiter/employee/${employeeId}`);
  };

  // Handle delete employee dialog open
  const handleDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
    setDeleteConfirmText('');
  };

  // Handle delete employee dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
    setDeleteConfirmText('');
    setDeletingEmployee(false);
  };

  // Handle confirm delete employee
  const handleConfirmDeleteEmployee = async () => {
    if (deleteConfirmText !== 'Hapus' || !employeeToDelete) {
      return;
    }

    try {
      setDeletingEmployee(true);
      await jobApplicationService.deleteEmployeeFromList(employeeToDelete.uuid);
      
      // Refresh the employee list
      const currentFilters = { searchTerm, divisionFilter, statusFilter, positionFilter };
      fetchEmployees(page, rowsPerPage, currentFilters);
      
      // Refresh stats
      calculateEmployeeStats();
      
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Error deleting employee:', error);
      setDeletingEmployee(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        {pageTitleMap[userRole] || 'Daftar Karyawan'}
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={3} sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            color: 'white'
          }}>
            <Box sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mr: 2 
            }}>
              <AccountBoxIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2">
                Total Karyawan
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card elevation={3} sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            borderRadius: 2,
            bgcolor: '#2E7D32',
            color: 'white'
          }}>
            <Box sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mr: 2 
            }}>
              <WorkOutlineIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.active}
              </Typography>
              <Typography variant="body2">
                Karyawan Aktif
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card elevation={3} sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            borderRadius: 2,
            bgcolor: '#D32F2F',
            color: 'white'
          }}>
            <Box sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mr: 2 
            }}>
              <BusinessIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.inactive}
              </Typography>
              <Typography variant="body2">
                Karyawan Tidak Aktif
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Cari Nama Karyawan"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              select
              fullWidth
              label="Divisi"
              value={divisionFilter}
              onChange={handleDivisionFilterChange}
              SelectProps={{
                MenuProps: {
                  sx: { maxHeight: '300px' },
                  disableScrollLock: true
                }
              }}
            >
              {divisionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              select
              fullWidth
              label="Posisi kerja"
              value={positionFilter}
              onChange={handlePositionFilterChange}
              SelectProps={{
                MenuProps: {
                  sx: { maxHeight: '300px' },
                  disableScrollLock: true
                }
              }}
            >
              {positionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              SelectProps={{
                MenuProps: {
                  sx: { maxHeight: '300px' },
                  disableScrollLock: true
                }
              }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              color="secondary" 
              size="medium" 
              onClick={handleResetFilters}
              fullWidth
              sx={{ height: '40px' }}
              startIcon={<FilterListIcon />}
            >
              Reset Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Employees Table */}
      <div id="employees-table">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ 
              maxHeight: 'calc(100vh - 350px)',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              },
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Nama</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Posisi</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Divisi</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Lokasi</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Tanggal Bergabung</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Akhir Kontrak</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Status</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <TableRow 
                        key={employee.uuid} 
                        hover 
                        sx={{ 
                          cursor: 'pointer',
                          height: '64px', // Increase row height
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.08)' 
                              : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: theme.palette.primary.main,
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                mr: 2
                              }}
                            >
                              {(employee.name || 'N/A').charAt(0).toUpperCase()}
                            </Box>
                            <Typography variant="body1" fontWeight="medium">
                              {employee.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {employee.position || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {employee.divisi || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {employee.lokasi_penempatan || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(employee.tanggal_bergabung)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(employee.tanggal_berakhir_kontrak)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={employee.status_kerja ? 'Karyawan Aktif' : 'Karyawan Tidak Aktif'}>
                            <Chip 
                              label={employee.status_kerja ? 'Aktif' : 'Tidak Aktif'}
                              size="small"
                              sx={{ 
                                bgcolor: employee.status_kerja ? statusColors.active : statusColors.inactive,
                                color: '#fff',
                                fontWeight: 'medium',
                                fontSize: '0.85rem',
                                height: '28px',
                                '& .MuiChip-label': {
                                  px: 1.5
                                }
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Lihat Detail">
                          <IconButton onClick={(e) => { e.stopPropagation(); handleViewEmployee(employee.uuid); }}>
                            <VisibilityIcon />
                          </IconButton>
                            </Tooltip>
                            {userRole === 'RECRUITER' && (
                              <Tooltip title="Hapus dari Daftar">
                                <IconButton 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee); }}
                                  sx={{ color: theme.palette.error.main }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body1" sx={{ my: 3, color: theme.palette.text.secondary }}>
                          Tidak ada data karyawan ditemukan.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              rowsPerPageOptions={[5, 10, 25, 50]}
              count={totalEmployees}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Baris per halaman:"
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderTop: `1px solid ${theme.palette.divider}`,
                '.MuiTablePagination-toolbar': {
                  height: '56px',
                  minHeight: '56px',
                  padding: '0 16px'
                },
                '.MuiTablePagination-displayedRows, .MuiTablePagination-selectLabel': {
                  fontWeight: 'medium'
                }
              }}
            />
          </Paper>
        )}
      </div>

      {/* Delete Employee Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Konfirmasi Hapus Karyawan
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Anda akan menghapus karyawan <strong>{employeeToDelete?.name}</strong> dari daftar karyawan.
            Aksi ini bersifat soft-delete dan tidak akan menghapus data karyawan dari database.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            Untuk melanjutkan, ketik <strong>"Hapus"</strong> di bawah ini:
          </DialogContentText>
          <TextField
            fullWidth
            label="Konfirmasi Penghapusan"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Ketik 'Hapus' untuk mengkonfirmasi"
            error={deleteConfirmText && deleteConfirmText !== 'Hapus'}
            helperText={deleteConfirmText && deleteConfirmText !== 'Hapus' ? 'Ketik "Hapus" dengan benar' : ''}
            disabled={deletingEmployee}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={deletingEmployee}>
            Batal
          </Button>
          <Button
            onClick={handleConfirmDeleteEmployee}
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== 'Hapus' || deletingEmployee}
            startIcon={deletingEmployee ? <CircularProgress size={20} /> : null}
          >
            {deletingEmployee ? 'Menghapus...' : 'Hapus Karyawan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RecruiterEmployeesPage; 