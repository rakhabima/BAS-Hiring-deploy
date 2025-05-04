import {
  AccountCircle,
  EventNote,
  Login,
  ManageAccounts,
  PeopleAlt,
  Person,
  Refresh,
  Search,
  TrendingDown,
  TrendingUp,
  Visibility
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {
  ArcElement,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Legend,
  Title
} from 'chart.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { showNotification, userService } from '../../services/api'; // Import api as default import, ensure showNotification is exported/imported

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// User roles for filtering
const USER_ROLES = [
  'ADMIN',
  'GENERAL_MANAGER',
  'RECRUITER',
  'KOORDINATOR_LAPANGAN',
  'CANDIDATE',
  'KARYAWAN',
  'GUEST'
];

// Number of items to load per batch
const ITEMS_PER_BATCH = 100;

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2.5,
  border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.6)})`,
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  let color = theme.palette.text.primary;
  let backgroundColor = theme.palette.grey[300];
  
  switch (status) {
    case "ACTIVE":
      backgroundColor = alpha(theme.palette.success.main, 0.15);
      color = theme.palette.success.dark;
      break;
    case "INACTIVE":
      backgroundColor = alpha(theme.palette.error.main, 0.15);
      color = theme.palette.error.dark;
      break;
    case "PENDING":
      backgroundColor = alpha(theme.palette.warning.light, 0.2);
      color = theme.palette.warning.main;
      break;
    default:
      backgroundColor = alpha(theme.palette.grey[500], 0.15);
      color = theme.palette.grey[700];
      break;
  }
  
  return {
    backgroundColor,
    color,
    fontWeight: 'bold',
    '& .MuiChip-label': {
      padding: '0 12px'
    }
  };
});

// Helper function to count by role
const countByRole = (users) => {
  const allRoles = [
    'ADMIN',
    'GENERAL_MANAGER',
    'RECRUITER',
    'KOORDINATOR_LAPANGAN',
    'CANDIDATE',
    'KARYAWAN',
    'GUEST'
  ];
  const counts = {};
  allRoles.forEach(role => counts[role] = 0);
  users.forEach(user => {
    if (user && user.role) {
      if (counts[user.role] !== undefined) {
        counts[user.role]++;
      } else {
        counts[user.role] = 1;
      }
    }
  });
  const filteredCounts = {};
  Object.keys(counts).forEach(role => {
    if (counts[role] > 0) {
      filteredCounts[role] = counts[role];
    }
  });
  return filteredCounts;
};

const AdminDashboardPage = () => {
  const theme = useTheme();
  
  // Helper to get user status display value
  const getUserStatus = (user) => {
    if (!user || (user.status === undefined && user.isActive === undefined)) {
      return 'UNKNOWN';
    }
    if (typeof user.status === 'boolean') return user.status ? 'ACTIVE' : 'INACTIVE';
    if (typeof user.isActive === 'boolean') return user.isActive ? 'ACTIVE' : 'INACTIVE';
    if (user.status === 'ACTIVE' || user.status === 'INACTIVE') return user.status;
    return String(user.status || user.isActive || 'UNKNOWN').toUpperCase();
  };

  // Helper to get nice role name
  const getRoleName = (role) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'GENERAL_MANAGER': return 'General Manager';
      case 'RECRUITER': return 'Recruiter';
      case 'KOORDINATOR_LAPANGAN': return 'Koordinator Lapangan';
      case 'CANDIDATE': return 'Kandidat';
      case 'GUEST': return 'Tamu';
      case 'KARYAWAN': return 'Karyawan';
      default: return role || 'Tidak diketahui';
    }
  };

  // Helper to format date with proper locale
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  // Helper to show error notifications
  const showError = (message) => {
    console.error(message);
    // Jika ada komponen notifikasi, bisa ditambahkan di sini
  };
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState({});
  const [doughnutChartData, setDoughnutChartData] = useState(null);
  
  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Datatable states for users
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortField, setSortField] = useState('lastLogin');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  
  // State for lazy loading
  const [loadedUsersCount, setLoadedUsersCount] = useState(ITEMS_PER_BATCH);
  
  // Memoize filtered users for better performance
  const filterUsers = (users, searchQuery, roleFilter, statusFilter) => {
    return users
      .filter(user => {
        const matchesSearch = searchQuery === '' || 
          (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (user.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        
        // Use the getUserStatus helper to check status consistently
        const userStatus = typeof user.status === 'boolean' 
          ? (user.status ? 'ACTIVE' : 'INACTIVE')
          : (user.status || 'UNKNOWN');
        const matchesStatus = statusFilter === '' || userStatus === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
      });
  };

  // Get paginated users with lazy loading
  const getPaginatedUsers = (filteredUsers, page, rowsPerPage) => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredUsers.slice(start, Math.min(end, filteredUsers.length));
  };

  // --- Callbacks for useEffect dependencies ---

  // Prepare data for doughnut chart (memoized)
  const prepareDoughnutChartData = useCallback((roleCounts) => {
    const labels = Object.keys(roleCounts).map(role => `${getRoleName(role)} (${roleCounts[role]})`);
    const dataValues = Object.values(roleCounts);

    // Generate distinct colors based on the number of roles
    const backgroundColors = labels.map((_, index) => `hsl(${(index * 360 / labels.length) % 360}, 70%, 80%)`);
    const borderColors = labels.map((_, index) => `hsl(${(index * 360 / labels.length) % 360}, 70%, 50%)`);

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Users by Role',
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
    setDoughnutChartData(data);
  }, [theme]); // Add theme dependency

  // Fetch all necessary data (memoized)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching user data (optimized)...');

      // --- Hanya panggil getAllUsers ---
      const response = await userService.getAllUsers().catch(error => {
          console.error('Failed to fetch user data:', error);
          showNotification('Failed to fetch user data: ' + (error.message || 'Server error occurred'), 'error');
          return null; // Return null on error
        });
      // --------------------------------

       // Process user data (handle various potential response structures)
      let allUsers = [];
      if (response?.data && Array.isArray(response.data)) {
          allUsers = response.data;
      } else if (response?.success && Array.isArray(response?.data)) { // Handle { success: true, data: [] }
          allUsers = response.data;
      } else if (Array.isArray(response)) { // Handle direct array response (fallback)
         allUsers = response;
      }
       // Add filtering for invalid users if necessary, though backend projection helps
       allUsers = allUsers.filter(user => user && (user.uuid || user.id));

      console.log(`Processed ${allUsers.length} users in total.`);
      setUsers(allUsers);

      // Update doughnut chart based on the fetched users
      if (allUsers.length > 0) {
         const roleCounts = countByRole(allUsers);
         setRoleDistribution(roleCounts);
         prepareDoughnutChartData(roleCounts);
      } else {
         console.log('No users fetched, clearing role chart.');
         setRoleDistribution({});
         prepareDoughnutChartData({});
      }

    } catch (error) {
      // Catch any unexpected errors during processing
      console.error('Error processing dashboard data:', error);
      showNotification('Failed to process dashboard data: ' + (error.message || 'Unexpected error'), 'error');
      setUsers([]);
      setRoleDistribution({});
      prepareDoughnutChartData({});
    } finally {
      setLoading(false);
    }
  }, [prepareDoughnutChartData]); // Keep dependency

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update doughnut chart when users data changes
  useEffect(() => {
    if (users.length > 0) {
      const roleCounts = countByRole(users);
      setRoleDistribution(roleCounts);
      prepareDoughnutChartData(roleCounts);
    }
  }, [users, prepareDoughnutChartData]);

  // --- Event Handlers ---

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };
  
  // Handle sort change
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };
  
  // Handle page change
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle user details dialog open
  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedUser(null);
  };
  
  // Filter users with memoization
  const filteredUsers = useMemo(() => {
    // Initially only process a subset of users for faster rendering
    const usersToProcess = users.slice(0, loadedUsersCount);
    const filtered = filterUsers(usersToProcess, searchQuery, roleFilter, statusFilter);
    return filtered.sort((a, b) => {
      const fieldA = sortField === 'name' ? (a.name || a.fullName || '') : a[sortField] || '';
      const fieldB = sortField === 'name' ? (b.name || b.fullName || '') : b[sortField] || '';
      
      // Special case for status field
      if (sortField === 'status') {
        const statusA = getUserStatus(a);
        const statusB = getUserStatus(b);
        
        return sortOrder === 'asc' 
          ? statusA.localeCompare(statusB)
          : statusB.localeCompare(statusA);
      }
      
      // Normal comparison
      return sortOrder === 'asc'
        ? String(fieldA).localeCompare(String(fieldB))
        : String(fieldB).localeCompare(String(fieldA));
    });
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortOrder, loadedUsersCount]);
  
  // Get paginated users (memoized)
  const paginatedUsers = useMemo(() => {
    return getPaginatedUsers(filteredUsers, page, rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);
  
  // Load more users when needed
  useEffect(() => {
    // If we're getting close to the end of loaded users, load more
    if (filteredUsers.length > loadedUsersCount - ITEMS_PER_BATCH / 2 && loadedUsersCount < users.length) {
      setLoadedUsersCount(prev => Math.min(prev + ITEMS_PER_BATCH, users.length));
    }
  }, [filteredUsers.length, loadedUsersCount, users.length]);
  
  // Reset loaded count when filters change
  useEffect(() => {
    setLoadedUsersCount(ITEMS_PER_BATCH);
    setPage(0);
  }, [searchQuery, roleFilter, statusFilter]);

  // Doughnut chart options
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          color: theme.palette.text.primary,
        }
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        bodySpacing: 5,
        padding: 10,
        boxPadding: 5,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      }
    }
  };

  // Use virtualized list for large data sets
  const handleTableScroll = () => {
    // If scrolled near the bottom, load more users
    const scrollPosition = document.documentElement.scrollTop + window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition > scrollHeight - 500 && loadedUsersCount < users.length) {
      setLoadedUsersCount(prev => Math.min(prev + ITEMS_PER_BATCH, users.length));
    }
  };

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleTableScroll);
    return () => window.removeEventListener('scroll', handleTableScroll);
  }, [loadedUsersCount, users.length]);
  
  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      {loading && <LinearProgress />}
      
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          Admin Dashboard
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={() => fetchData()}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Monitor user accounts and distribution
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Users Card */}
        <Grid item xs={12} sm={6} md={6}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PeopleAlt sx={{ fontSize: 30, color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {users.length}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  {users.filter(user => getUserStatus(user) === 'ACTIVE').length} Active
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        
        {/* Active Users Card */}
        <Grid item xs={12} sm={6} md={6}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountCircle sx={{ fontSize: 30, color: theme.palette.success.main, mr: 1 }} />
                <Typography variant="h6">Active Status</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" component="div">
                  {users.filter(user => getUserStatus(user) === 'ACTIVE').length}
                </Typography>
                <Chip 
                  label="Active" 
                  size="small" 
                  sx={{ 
                    backgroundColor: alpha(theme.palette.success.main, 0.15),
                    color: theme.palette.success.dark,
                    fontWeight: 'bold',
                  }}
                />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                {users.filter(user => getUserStatus(user) === 'INACTIVE').length > 0 ? <TrendingDown sx={{ color: theme.palette.error.main, fontSize: 16, mr: 0.5 }} /> : <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />}
                <Typography variant="body2" color="text.secondary">
                  {users.filter(user => getUserStatus(user) === 'INACTIVE').length} users are inactive
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Distribution Chart */}
        <Grid item xs={12}>
          <StyledCard sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                User Distribution by Role
              </Typography>
              
              <Box sx={{ height: 350, position: 'relative' }}>
                {doughnutChartData ? (
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography color="text.secondary">Loading chart data...</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
      
      {/* User Accounts Table */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Accounts
              </Typography>
              
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    label="Search Users"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Filter by Role</InputLabel>
                    <Select
                      value={roleFilter}
                      onChange={handleRoleFilterChange}
                      label="Filter by Role"
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      {USER_ROLES.map(role => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      label="Filter by Status"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                      <MenuItem value="UNKNOWN">Unknown</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {/* Users Table */}
              <TableContainer component={Paper} variant="outlined">
                <Table sx={{ minWidth: 650 }} size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'name'}
                          direction={sortField === 'name' ? sortOrder : 'asc'}
                          onClick={() => handleSort('name')}
                        >
                          Nama Lengkap
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'email'}
                          direction={sortField === 'email' ? sortOrder : 'asc'}
                          onClick={() => handleSort('email')}
                        >
                          Email
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'role'}
                          direction={sortField === 'role' ? sortOrder : 'asc'}
                          onClick={() => handleSort('role')}
                        >
                          Role
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'status'}
                          direction={sortField === 'status' ? sortOrder : 'asc'}
                          onClick={() => handleSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'lastLogin'}
                          direction={sortField === 'lastLogin' ? sortOrder : 'asc'}
                          onClick={() => handleSort('lastLogin')}
                        >
                          Login Terakhir
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <LinearProgress />
                        </TableCell>
                      </TableRow>
                    ) : paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.uuid || user.id} hover>
                          <TableCell>{user.name || user.fullName || '-'}</TableCell>
                          <TableCell>{user.email || '-'}</TableCell>
                          <TableCell>{getRoleName(user.role)}</TableCell>
                          <TableCell>
                            <StatusChip
                              label={getUserStatus(user)}
                              status={getUserStatus(user)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(user.lastLogin || user.last_login)}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Lihat Detail">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDetails(user)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[15, 25, 50]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Baris per halaman"
                labelDisplayedRows={({ from, to, count }) => {
                  const totalLoaded = Math.min(count, loadedUsersCount);
                  const totalAvailable = users.length;
                  const showingAllLoaded = to >= totalLoaded;
                  const moreAvailable = loadedUsersCount < totalAvailable;

                  let countText = count;
                  if (moreAvailable) {
                      countText = `sekitar ${totalLoaded}${showingAllLoaded ? '+' : ''}`;
                  }

                  return `${from}-${to} dari ${countText}${moreAvailable ? ` (total ${totalAvailable})` : ''}`;
                }}
              />
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
      
      {/* User Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <Person sx={{ fontSize: 24, mr: 1 }} />
                Detail Pengguna: {selectedUser?.name || selectedUser?.fullName || '-'}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AccountCircle />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={selectedUser?.email || '-'}
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <ManageAccounts />
                  </ListItemIcon>
                  <ListItemText
                    primary="Role"
                    secondary={getRoleName(selectedUser?.role)}
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <Login />
                  </ListItemIcon>
                  <ListItemText
                    primary="Login Terakhir"
                    secondary={formatDate(selectedUser?.lastLogin || selectedUser?.last_login)}
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <EventNote />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dibuat Pada"
                    secondary={formatDate(selectedUser?.createdAt || selectedUser?.created_at)}
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    {getUserStatus(selectedUser || {}) === 'ACTIVE' ? 
                      <TrendingUp color="success" /> : 
                      <TrendingDown color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <StatusChip
                        label={getUserStatus(selectedUser || {})}
                        status={getUserStatus(selectedUser || {})}
                        size="small"
                      />
                    }
                  />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default AdminDashboardPage; 