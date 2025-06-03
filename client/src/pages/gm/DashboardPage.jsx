import {
    Business,
    Delete,
    Edit,
    Email,
    LocationOn,
    Phone,
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
    DialogContentText,
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
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography
} from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Tooltip as ChartTooltip,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title
} from 'chart.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { outsourcingService } from '../../services/api';
import { Navigate, useNavigate } from 'react-router-dom';

// Service categories (copy from OutsourcingRequestPage)
const SERVICE_CATEGORIES = [
  'E-Commerce',
  'Distributor',
  'Retail',
  'Manufaktur',
  'Teknologi Informasi',
  'Jasa Keuangan',
  'Pendidikan',
  'Kesehatan',
  'Logistik',
  'Hospitality',
  'Food & Beverage',
  'Perbankan',
  'Media & Komunikasi',
  'Properti',
  'Lainnya'
];

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

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
    case "PENDING":
      backgroundColor = alpha(theme.palette.warning.light, 0.2);
      color = theme.palette.warning.main;
      break;
    case "APPROVED":
      backgroundColor = alpha(theme.palette.success.main, 0.15);
      color = theme.palette.success.dark;
      break;
    case "REJECTED":
      backgroundColor = alpha(theme.palette.error.main, 0.15);
      color = theme.palette.error.dark;
      break;
    case "COMPLETED":
      backgroundColor = alpha(theme.palette.info.main, 0.15);
      color = theme.palette.info.dark;
      break;
    default:
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

// Helper function to count status occurrences
const countStatusOccurrences = (requests) => {
  const counts = {
    "PENDING": 0,
    "APPROVED": 0,
    "REJECTED": 0,
    "COMPLETED": 0
  };
  
  requests.forEach(request => {
    counts[request.status]++;
  });
  
  return counts;
};

// Helper function to group requests by date
const groupRequestsByDate = (requests, period, selectedMonth) => {
  const grouped = {};
  const currentYear = new Date().getFullYear();
  
  requests.forEach(request => {
    let dateKey;
    const requestDate = new Date(request.submission);
    const requestMonth = requestDate.getMonth();
    const requestFullYear = requestDate.getFullYear();
    
    if (period === 'yearly') {
      if (requestFullYear === currentYear) {
        dateKey = requestDate.toLocaleDateString('id-ID', { month: 'long' });
      }
    } else if (period === 'monthly') {
      if (requestMonth === selectedMonth) {
        const weekNumber = Math.ceil(requestDate.getDate() / 7);
        dateKey = `Minggu ${weekNumber}`;
      }
    } else if (period === 'weekly') {
      const dayName = requestDate.toLocaleDateString('id-ID', { weekday: 'long' });
      const dateOfMonth = requestDate.getDate();
      const month = requestDate.getMonth() + 1;
      dateKey = `${dayName} (${dateOfMonth}/${month})`;
    }
    
    if (dateKey) {
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          completed: 0,
          dateObject: requestDate,
        };
      }
      
      grouped[dateKey].total++;
      
      if (request.status === "PENDING") grouped[dateKey].pending++;
      else if (request.status === "APPROVED") grouped[dateKey].approved++;
      else if (request.status === "REJECTED") grouped[dateKey].rejected++;
      else if (request.status === "COMPLETED") grouped[dateKey].completed++;
    }
  });
  
  return grouped;
};

// Month names for dropdown
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DashboardPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [activeVendors, setActiveVendors] = useState(0);
  const [completedVendorsCount, setCompletedVendorsCount] = useState(0);
  const [periodFilter, setPeriodFilter] = useState('weekly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [statusCounts, setStatusCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0, COMPLETED: 0 });
  const [chartData, setChartData] = useState(null);
  const [doughnutChartData, setDoughnutChartData] = useState(null);
  const navigate = useNavigate();
  
  // Dialogs state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    vendorName: '',
    email: '',
    contactInfo: '',
    location: '',
    message: '',
    status: '',
    serviceType: ''
  });
  const [newStatus, setNewStatus] = useState('');
  
  // Datatable states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  
  // State for Vendor List Dialog
  const [isVendorListDialogOpen, setIsVendorListDialogOpen] = useState(false);
  const [vendorListDialogTitle, setVendorListDialogTitle] = useState('');
  const [vendorsForDialog, setVendorsForDialog] = useState([]);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Refetch chart data when period or month changes OR when requests data changes
  useEffect(() => {
    if (requests.length > 0) {
      prepareChartData(requests);
      prepareDoughnutChartData(statusCounts);
    }
  }, [periodFilter, selectedMonth, requests, statusCounts]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await outsourcingService.getAllOutsourcingRequests();
      console.log('API Response:', response);
      
      // Ensure response is always an array
      const requestsData = Array.isArray(response) ? response : [];
      
      console.log('Processed requests data:', requestsData);
      setRequests(requestsData);
      
      // Count status occurrences
      const counts = countStatusOccurrences(requestsData);
      setStatusCounts(counts);
      
      // Calculate active vendors (only APPROVED)
      const approvedVendors = requestsData.filter(req => req.status === "APPROVED").length;
      setActiveVendors(approvedVendors);
      
      // Calculate completed vendors
      const completedVendors = requestsData.filter(req => req.status === "COMPLETED").length;
      setCompletedVendorsCount(completedVendors);
      
      // Prepare chart data (initial load)
      prepareChartData(requestsData);
      prepareDoughnutChartData(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
      setRequests([]);
      setStatusCounts({ PENDING: 0, APPROVED: 0, REJECTED: 0, COMPLETED: 0 });
      setActiveVendors(0);
      setCompletedVendorsCount(0);
      setChartData(null);
      setDoughnutChartData(null);
    } finally {
      setLoading(false);
    }
  };
  
  const prepareChartData = (dataToChart) => {
    const groupedData = groupRequestsByDate(dataToChart, periodFilter, selectedMonth);
    let sortedDates;
    
    if (periodFilter === 'yearly') {
      sortedDates = monthNames.filter(month => groupedData[month]);
    } else if (periodFilter === 'monthly') {
      sortedDates = Object.keys(groupedData).sort((a, b) => {
        const weekA = parseInt(a.split(' ')[1]);
        const weekB = parseInt(b.split(' ')[1]);
        return weekA - weekB;
      });
    } else if (periodFilter === 'weekly') {
      sortedDates = Object.keys(groupedData).sort((a, b) => {
        return groupedData[a].dateObject - groupedData[b].dateObject;
      });
    }
    
    const chartData = {
      labels: sortedDates,
      datasets: [
        {
          label: 'Diproses',
          data: sortedDates.map(date => groupedData[date]?.pending || 0),
          backgroundColor: 'rgba(255, 193, 7, 0.5)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        },
        {
          label: 'Ditolak',
          data: sortedDates.map(date => groupedData[date]?.rejected || 0),
          backgroundColor: 'rgba(244, 67, 54, 0.5)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        },
        {
          label: 'Diterima',
          data: sortedDates.map(date => groupedData[date]?.approved || 0),
          backgroundColor: 'rgba(76, 175, 80, 0.5)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        },
        {
          label: 'Selesai',
          data: sortedDates.map(date => groupedData[date]?.completed || 0),
          backgroundColor: 'rgba(33, 150, 243, 0.5)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        }
      ],
    };
    
    setChartData(chartData);
  };
  
  // Function to prepare data for the Doughnut chart
  const prepareDoughnutChartData = (counts) => {
    const data = {
      labels: [
        `Belum Diproses (${counts.PENDING})`,
        `Diterima (${counts.APPROVED})`,
        `Ditolak (${counts.REJECTED})`,
        `Selesai (${counts.COMPLETED})`,
      ],
      datasets: [
        {
          label: 'Jumlah Vendor',
          data: [counts.PENDING, counts.APPROVED, counts.REJECTED, counts.COMPLETED],
          backgroundColor: [
            alpha(theme.palette.warning.light, 0.7),
            alpha(theme.palette.success.light, 0.7),
            alpha(theme.palette.error.light, 0.7),
            alpha(theme.palette.info.light, 0.7),
          ],
          borderColor: [
            theme.palette.warning.main,
            theme.palette.success.main,
            theme.palette.error.main,
            theme.palette.info.main,
          ],
          borderWidth: 1,
        },
      ],
    };
    setDoughnutChartData(data);
  };
  
  // Calculate percentage change for stats
  const calculatePercentageChange = (count, total) => {
    if (total === 0) return 0;
    return (count / total) * 100;
  };
  
  // Handle delete dialog
  const openDeleteDialog = (request) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedRequest(null);
  };
  
  const handleDelete = async () => {
    if (!selectedRequest) return;
    
    try {
      await outsourcingService.deleteOutsourcingRequest(selectedRequest.uuid);
      closeDeleteDialog();
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };
  
  // Handle status update dialog
  const openStatusDialog = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setStatusDialogOpen(true);
  };
  
  const closeStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedRequest(null);
    setNewStatus('');
  };
  
  const handleStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) return;
    
    try {
      await outsourcingService.updateOutsourcingRequestStatus(selectedRequest.uuid, newStatus);
      closeStatusDialog();
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  // Handle detail dialog
  const openDetailDialog = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      vendorName: request.vendorName,
      email: request.email,
      contactInfo: request.contactInfo,
      location: request.location,
      message: request.message,
      status: request.status,
      serviceType: request.serviceType || ''
    });
    setDetailDialogOpen(true);
    setEditMode(false);
  };
  
  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedRequest(null);
    setEditMode(false);
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveEdit = async () => {
    if (!selectedRequest) return;
    
    try {
      // Create update data object from form data
      const updateData = {
        vendorName: editFormData.vendorName,
        email: editFormData.email,
        contactInfo: editFormData.contactInfo,
        location: editFormData.location,
        message: editFormData.message,
        status: editFormData.status,
        serviceType: editFormData.serviceType
      };
      
      console.log('Saving edit with data:', updateData);
      
      // Call API to update the full data
      await outsourcingService.updateOutsourcingRequestData(selectedRequest.uuid, updateData);
      
      closeDetailDialog();
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating vendor:', error);
    }
  };
  
  // Handle period filter change
  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriodFilter(newPeriod);
      setPage(0);
    }
  };
  
  // Handle month selection change
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
    setPage(0);
  };
  
  // Status translation
  const translateStatus = (status) => {
    switch (status) {
      case 'PENDING': return 'Belum Diproses';
      case 'APPROVED': return 'Diterima';
      case 'REJECTED': return 'Ditolak';
      case 'COMPLETED': return 'Selesai';
      default: return status;
    }
  };
  
  // Handle Search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };
  
  // Handle Status Filter
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };
  
  // Handle Sorting
  const handleSort = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
  };
  
  // Handle Pagination Change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filtered and Sorted Data for Table
  const filteredAndSortedRequests = useMemo(() => {
    let result = [...requests];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(req =>
        req.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(req => req.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.submission);
      const dateB = new Date(b.submission);
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    
    return result;
  }, [requests, searchQuery, statusFilter, sortOrder]);
  
  // Paginated Data
  const paginatedRequests = filteredAndSortedRequests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handler for opening the vendor list dialog
  const handleOpenVendorListDialog = (status, title) => {
    const filteredVendors = requests.filter(req => req.status === status);
    setVendorsForDialog(filteredVendors);
    setVendorListDialogTitle(title);
    setIsVendorListDialogOpen(true);
  };

  // Handler for closing the vendor list dialog
  const handleCloseVendorListDialog = () => {
    setIsVendorListDialogOpen(false);
    setVendorsForDialog([]); // Clear data when closing
    setVendorListDialogTitle('');
  };

  const handleViewDetail = (id) => {
    navigate(`/gm/outsourcing-detail/${id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard General Manager
      </Typography>
      
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Card Vendor Batal */}
            <Grid item xs={12} sm={6} md={2.4} onClick={() => handleOpenVendorListDialog('REJECTED', 'Vendor Batal')} sx={{ cursor: 'pointer' }}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Vendor Batal
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {statusCounts.REJECTED}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {statusCounts.REJECTED > 0 ? (
                      <TrendingDown color="error" />
                    ) : (
                      <TrendingUp color="success" />
                    )}
                    <Typography variant="body2" color={statusCounts.REJECTED > 0 ? "error" : "success"} sx={{ ml: 1 }}>
                      {calculatePercentageChange(statusCounts.REJECTED, requests.length).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Card Vendor Perlu Diproses */}
            <Grid item xs={12} sm={6} md={2.4} onClick={() => handleOpenVendorListDialog('PENDING', 'Vendor Perlu Diproses')} sx={{ cursor: 'pointer' }}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Vendor Perlu Diproses
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {statusCounts.PENDING}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="warning" />
                    <Typography variant="body2" color="warning.main" sx={{ ml: 1 }}>
                      {calculatePercentageChange(statusCounts.PENDING, requests.length).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Card Vendor Aktif (Approved) */}
            <Grid item xs={12} sm={6} md={2.4} onClick={() => handleOpenVendorListDialog('APPROVED', 'Vendor Aktif')} sx={{ cursor: 'pointer' }}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Vendor Aktif
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {activeVendors}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="success" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                      {calculatePercentageChange(activeVendors, requests.length).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Card Vendor Selesai (Completed) */}
            <Grid item xs={12} sm={6} md={2.4} onClick={() => handleOpenVendorListDialog('COMPLETED', 'Vendor Selesai')} sx={{ cursor: 'pointer' }}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Vendor Selesai
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {completedVendorsCount} 
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="info" />
                    <Typography variant="body2" color="info.main" sx={{ ml: 1 }}>
                      {calculatePercentageChange(completedVendorsCount, requests.length).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Card Total Vendor */}
            <Grid item xs={12} sm={6} md={2.4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Vendor
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {requests.length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="primary" />
                    <Typography variant="body2" color="primary.main" sx={{ ml: 1 }}>
                      {/* You might want a different metric here, or keep it simple */}
                      100%
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
          
          {/* Chart Section - Now using Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Doughnut Chart for Status Distribution */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Distribusi Status
                </Typography>
                {doughnutChartData && (statusCounts.PENDING + statusCounts.APPROVED + statusCounts.REJECTED + statusCounts.COMPLETED > 0) ? (
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Doughnut 
                      data={doughnutChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                  label += ': ';
                                }
                                if (context.parsed !== null) {
                                  const total = context.dataset.data.reduce((acc, value) => acc + value, 0);
                                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                                  label += `${context.parsed} (${percentage})`;
                                }
                                return label;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Tidak ada data status
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Bar Chart for Vendor Statistics */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Statistik Vendor
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {periodFilter === 'monthly' && (
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Bulan</InputLabel>
                        <Select
                          value={selectedMonth}
                          label="Bulan"
                          onChange={handleMonthChange}
                        >
                          {monthNames.map((month, index) => (
                            <MenuItem key={month} value={index}>{month}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    
                    <ToggleButtonGroup
                      value={periodFilter}
                      exclusive
                      onChange={handlePeriodChange}
                      aria-label="Period Filter"
                      size="small"
                    >
                      <ToggleButton value="weekly">
                        Mingguan
                      </ToggleButton>
                      <ToggleButton value="monthly">
                        Bulanan
                      </ToggleButton>
                      <ToggleButton value="yearly">
                        Tahunan
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>

                {chartData && chartData.labels && chartData.labels.length > 0 ? (
                  <Box sx={{ height: 350 }}>
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                              size: 14
                            },
                            bodyFont: {
                              size: 13
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Tidak ada data yang tersedia untuk periode ini
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* Vendors Table */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Daftar Vendor
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Cari Vendor"
                  variant="outlined"
                  size="small"
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
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Filter Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value=""><em>Semua Status</em></MenuItem>
                    <MenuItem value="PENDING">Belum Diproses</MenuItem>
                    <MenuItem value="APPROVED">Diterima</MenuItem>
                    <MenuItem value="REJECTED">Ditolak</MenuItem>
                    <MenuItem value="COMPLETED">Selesai</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.light, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}>Nama</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.light, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}>Kategori Layanan</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.light, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}>Email</TableCell>
                    <TableCell
                      sortDirection={sortOrder}
                      sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.light, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}
                    >
                      <TableSortLabel
                        active={true}
                        direction={sortOrder}
                        onClick={handleSort}
                      >
                        Tanggal Aplikasi
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.light, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.light, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRequests.length > 0 ? (
                    paginatedRequests.map((request, index) => (
                      <TableRow
                        hover
                        key={request.uuid}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Business sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                            <Typography variant="body2" fontWeight="medium">
                              {request.vendorName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {request.serviceType || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Email fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
                            <Typography variant="body2">{request.email}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {new Date(request.submission).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <StatusChip 
                            label={translateStatus(request.status)} 
                            status={request.status} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Lihat Detail">
                            <IconButton onClick={() => handleViewDetail(request.uuid)} color="info" size="small">
                              <Visibility fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ubah Status Cepat">
                            <IconButton onClick={() => openStatusDialog(request)} color="primary" size="small">
                              <Edit fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus">
                            <IconButton onClick={() => openDeleteDialog(request)} color="error" size="small">
                              <Delete fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {searchQuery || statusFilter ? 'Tidak ada vendor yang cocok' : 'Tidak ada data vendor'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[15, 25, 50]}
              component="div"
              count={filteredAndSortedRequests.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
            />
          </Paper>
          
          {/* Detail Dialog */}
          <Dialog
            open={detailDialogOpen}
            onClose={closeDetailDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {editMode ? 'Edit Vendor' : 'Detail Vendor'}
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                startIcon={<Edit />}
                onClick={toggleEditMode}
              >
                {editMode ? 'Batal Edit' : 'Edit'}
              </Button>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Informasi Dasar
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Nama Vendor"
                      name="vendorName"
                      value={editFormData.vendorName}
                      onChange={handleEditChange}
                      variant="outlined"
                      margin="dense"
                    />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Nama Vendor
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedRequest?.vendorName}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      variant="outlined"
                      margin="dense"
                    />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {selectedRequest?.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Kategori Layanan"
                      name="serviceType"
                      value={editFormData.serviceType}
                      onChange={handleEditChange}
                      variant="outlined"
                      margin="dense"
                      select
                    >
                      {SERVICE_CATEGORIES.map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Kategori Layanan
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest?.serviceType || 'N/A'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Kontak"
                      name="contactInfo"
                      value={editFormData.contactInfo}
                      onChange={handleEditChange}
                      variant="outlined"
                      margin="dense"
                    />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Kontak
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {selectedRequest?.contactInfo}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {editMode ? (
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={editFormData.status}
                        label="Status"
                        name="status"
                        onChange={handleEditChange}
                      >
                        <MenuItem value="PENDING">Belum Diproses</MenuItem>
                        <MenuItem value="APPROVED">Diterima</MenuItem>
                        <MenuItem value="REJECTED">Ditolak</MenuItem>
                        <MenuItem value="COMPLETED">Selesai</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <StatusChip 
                        label={translateStatus(selectedRequest?.status)} 
                        status={selectedRequest?.status} 
                      />
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Lokasi dan Pesan
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Lokasi"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditChange}
                      variant="outlined"
                      margin="dense"
                    />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Lokasi
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                        <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', mt: 0.5 }} />
                        <Typography variant="body1">
                          {selectedRequest?.location}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label="Pesan"
                      name="message"
                      value={editFormData.message}
                      onChange={handleEditChange}
                      variant="outlined"
                      margin="dense"
                      multiline
                      rows={4}
                    />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pesan
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          mt: 1, 
                          minHeight: '100px',
                          backgroundColor: theme => theme.palette.background.default
                        }}
                      >
                        <Typography variant="body1">
                          {selectedRequest?.message}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Informasi Tambahan
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tanggal Permintaan
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest?.submission 
                      ? new Date(selectedRequest.submission).toLocaleString('id-ID')
                      : '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID Permintaan
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {selectedRequest?.uuid || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDetailDialog} color="inherit">
                Tutup
              </Button>
              {editMode && (
                <Button
                  onClick={handleSaveEdit}
                  variant="contained"
                  color="primary"
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                    color: 'white',
                    boxShadow: theme.shadows[2],
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                    }
                  }}
                >
                  Simpan Perubahan
                </Button>
              )}
            </DialogActions>
          </Dialog>
          
          {/* Status Update Dialog */}
          <Dialog open={statusDialogOpen} onClose={closeStatusDialog}>
            <DialogTitle>
              Ubah Status Vendor
            </DialogTitle>
            <DialogContent>
              <DialogContentText paragraph>
                Anda akan mengubah status vendor: <strong>{selectedRequest?.vendorName}</strong>
              </DialogContentText>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <MenuItem value="PENDING">Belum Diproses</MenuItem>
                  <MenuItem value="APPROVED">Diterima</MenuItem>
                  <MenuItem value="REJECTED">Ditolak</MenuItem>
                  <MenuItem value="COMPLETED">Selesai</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeStatusDialog} color="inherit">
                Batal
              </Button>
              <Button 
                onClick={handleStatusUpdate} 
                variant="contained" 
                color="primary"
                disabled={!newStatus || newStatus === selectedRequest?.status}
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                  color: 'white',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                  }
                }}
              >
                Simpan
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
            <DialogTitle>
              Konfirmasi Hapus Vendor
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Apakah Anda yakin ingin menghapus vendor <strong>{selectedRequest?.vendorName}</strong>? Tindakan ini tidak dapat dibatalkan.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDeleteDialog} color="inherit">
                Batal
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="contained" 
                color="error"
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.error.main} 30%, ${theme.palette.error.dark} 90%)`,
                  color: 'white',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                  }
                }}
              >
                Hapus
              </Button>
            </DialogActions>
          </Dialog>

          {/* Vendor List Dialog */}
          <Dialog open={isVendorListDialogOpen} onClose={handleCloseVendorListDialog} maxWidth="sm" fullWidth>
            <DialogTitle>{vendorListDialogTitle}</DialogTitle>
            <DialogContent dividers>
              {vendorsForDialog.length > 0 ? (
                <List dense>
                  {vendorsForDialog.map((vendor) => (
                    <ListItem key={vendor.uuid} disablePadding>
                      <ListItemText 
                        primary={vendor.vendorName} 
                        secondary={`Email: ${vendor.email} | Tgl: ${new Date(vendor.submission).toLocaleDateString('id-ID')}`}
                      />
                       {/* Optional: Add an action/link to view full detail */}
                       <IconButton edge="end" size="small" onClick={() => { openDetailDialog(vendor); handleCloseVendorListDialog(); }}>
                         <Visibility fontSize="inherit" />
                       </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                  Tidak ada vendor dalam status ini.
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseVendorListDialog}>Tutup</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default DashboardPage; 