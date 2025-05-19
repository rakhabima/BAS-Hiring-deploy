import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Quiz as QuizIcon,
  Search as SearchIcon,
  VideoCall as VideoCallIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
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
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartJSTooltip,
  Legend,
  LinearScale,
  Title
} from 'chart.js';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { jobApplicationService, showNotification } from '../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartJSTooltip,
  Legend,
  ArcElement
);

// Map status to UI display name
const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING':
      return 'Menunggu Verifikasi';
    case 'REVIEWING':
      return 'Sedang Ditinjau';
    case 'REVISION':
      return 'Perlu Revisi';
    case 'INTERVIEW_SCHEDULED':
      return 'Wawancara';
    case 'TECHNICAL_TEST':
      return 'Technical Test';
    case 'REJECTED':
      return 'Ditolak';
    case 'ACCEPTED':
      return 'Diterima';
    case 'ON_JOB':
      return 'Aktif Bekerja';
    default:
      return status;
  }
};

// Map stage names to colors and icons for the stats cards
const stageInfo = {
  'Administrasi': { color: '#1976D2', icon: <PersonIcon sx={{ fontSize: 32, color: 'white' }} /> },
  'Wawancara': { color: '#7B1FA2', icon: <VideoCallIcon sx={{ fontSize: 32, color: 'white' }} /> },
  'Technical Test': { color: '#FF6D00', icon: <QuizIcon sx={{ fontSize: 32, color: 'white' }} /> },
  'Diterima': { color: '#2E7D32', icon: <CheckCircleIcon sx={{ fontSize: 32, color: 'white' }} /> },
  'Ditolak': { color: '#D32F2F', icon: <CheckCircleIcon sx={{ fontSize: 32, color: 'white' }} /> }
};

// Status color mapping for better UI
const statusColors = {
  'PENDING': '#42A5F5',
  'REVIEWING': '#1976D2',
  'REVISION': '#FFA726',
  'INTERVIEW_SCHEDULED': '#7B1FA2',
  'TECHNICAL_TEST': '#FF6D00',
  'REJECTED': '#D32F2F',
  'ACCEPTED': '#2E7D32',
  'ON_JOB': '#43A047'
};

const CandidatesPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [timePeriod, setTimePeriod] = useState('week');
  const [activeCard, setActiveCard] = useState(null);
  
  // Dialog delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [stats, setStats] = useState({
    pending: 0,
    interview: 0,
    technicalTest: 0,
    accepted: 0,
    rejected: 0
  });
  const [chartData, setChartData] = useState({
    statusDistribution: { labels: [], datasets: [] },
    applicationTrends: { labels: [], datasets: [] }
  });
  const theme = useTheme();
  
  // Dynamic position options based on available positions
  const [positionOptions, setPositionOptions] = useState([
    { value: 'all', label: 'Semua Posisi' }
  ]);
  
  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'PENDING', label: 'Menunggu Verifikasi' },
    { value: 'REVIEWING', label: 'Sedang Ditinjau' },
    { value: 'REVISION', label: 'Perlu Revisi' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Wawancara' },
    { value: 'TECHNICAL_TEST', label: 'Technical Test' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'ACCEPTED', label: 'Diterima' },
    { value: 'ON_JOB', label: 'Aktif Bekerja' }
  ];

  const stageOptions = [
    { value: 'all', label: 'Semua Tahapan' },
    { value: 'Administrasi', label: 'Administrasi' },
    { value: 'Wawancara', label: 'Wawancara' },
    { value: 'Technical Test', label: 'Technical Test' },
    { value: 'Diterima', label: 'Diterima' }
  ];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalApplications, setTotalApplications] = useState(0);

  // Debounce timers
  const searchDebounceTimer = useRef(null);
  const filtersDebounceTimer = useRef(null);

  // Combine all filters into one object to track changes
  const currentFilters = {
    searchTerm,
    stageFilter,
    statusFilter,
    positionFilter
  };

  const fetchApplications = useCallback(async (currentPage, currentLimit, currentFilters) => {
      try {
        setLoading(true);
      const response = await jobApplicationService.getAllApplications(
        currentPage + 1, 
        currentLimit,
        currentFilters
      );

      if (response && response.data && response.pagination) {
        setApplications(response.data);
        setTotalApplications(response.pagination.totalCount);
        // Position options logic
        const uniquePositions = [...new Set(response.data.map(app => app.jobPostingId?.jobPosition || app.posisi_dilamar))].filter(Boolean);
        setPositionOptions(prevOptions => {
           const existingValues = new Set(prevOptions.map(opt => opt.value));
            const newOptions = uniquePositions
                .filter(pos => !existingValues.has(pos))
                .map(pos => ({ value: pos, label: pos }));
            if (newOptions.length > 0) return [...prevOptions, ...newOptions];
            return prevOptions;
        });
        } else {
          setApplications([]);
        setTotalApplications(0);
        }
        setError(null);
      } catch (err) {
      setError('Gagal memuat daftar lamaran.');
        console.error('Error fetching applications:', err);
      setApplications([]);
      setTotalApplications(0);
      } finally {
        // Set loading to false immediately after table data is loaded
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
      case 'stage':
        setStageFilter(value);
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

  // Fetch OVERALL stage statistics ONCE on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching overall stage stats...");
        const statsData = await jobApplicationService.getApplicationStageStats();
        if (statsData) {
          console.log("Received stats:", statsData);
          // Update state with the fetched overall counts
          setStats({
            pending: statsData.pending || 0,
            interview: statsData.interview || 0,
            technicalTest: statsData.technicalTest || 0,
            accepted: statsData.accepted || 0,
            rejected: statsData.rejected || 0 // Use if the 'rejected' card is displayed
          });
        }
      } catch (statsError) {
        console.error("Failed to fetch stage stats:", statsError);
        showNotification('Gagal memuat statistik tahapan.', 'error'); // Inform user
        // Optionally set stats to 0 or leave them as they were
        setStats({ pending: 0, interview: 0, technicalTest: 0, accepted: 0, rejected: 0 });
      }
    };
    fetchStats();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Helper to get ISO week number (needed for weekly trends formatting)
   const getISOWeek = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
   }

  // Fetch data SPECIFICALLY for the charts when timePeriod changes
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Only set chart loading, not the main loading state
        setChartLoading(true);
        console.log(`Fetching chart data for period: ${timePeriod}`);

        const [distributionData, trendsData] = await Promise.all([
          jobApplicationService.getApplicationStatusDistribution(timePeriod),
          jobApplicationService.getApplicationTrends(timePeriod)
        ]);

        console.log("Received distribution data:", distributionData);
        console.log("Received trends data:", trendsData);

        // Format Status Distribution (Pie Chart)
        const statusMap = {}; // Use map for easier lookup
        Object.keys(distributionData).forEach(statusKey => {
            const label = getStatusLabel(statusKey);
            statusMap[label] = (statusMap[label] || 0) + distributionData[statusKey];
        });
        const statusLabels = Object.keys(statusMap).filter(label => statusMap[label] > 0);
        const statusCounts = statusLabels.map(label => statusMap[label]);

        const statusChart = {
          labels: statusLabels,
          datasets: [{
            data: statusCounts,
             backgroundColor: [ '#FFA726', '#42A5F5', '#7E57C2', '#26A69A', '#66BB6A', '#EF5350', '#5C6BC0', '#2E7D32' ],
             borderWidth: 1,
             borderColor: theme.palette.mode === 'dark' ? '#333' : '#fff'
          }]
        };

        // Format Application Trends (Bar Chart)
        let trendLabels = [];
        const trendCounts = [];
        const timeLabelsData = {}; // Use object for easy mapping

        if (timePeriod === 'week') {
             const weekKeys = Object.keys(trendsData).sort();
             const currentWeekNum = getISOWeek(new Date());
             const currentYear = new Date().getFullYear();

             weekKeys.forEach(key => {
                 try {
                    const [year, weekStr] = key.split('-W');
                    const yearNum = parseInt(year);
                    const weekNum = parseInt(weekStr);
                    let weeksDiff = (currentYear - yearNum) * 52 + (currentWeekNum - weekNum);
                    // Determine label based on weeks ago
                    let label = null;
                    if (weeksDiff < 1) label = 'Minggu 1'; // This week
                    else if (weeksDiff < 2) label = 'Minggu 2'; // Last week
                    else if (weeksDiff < 3) label = 'Minggu 3'; // 2 weeks ago
                    else if (weeksDiff < 4) label = 'Minggu 4'; // 3 weeks ago

                    if (label) {
                      timeLabelsData[label] = (timeLabelsData[label] || 0) + trendsData[key];
                    }
                 } catch(e) { console.error(`Error parsing week key: ${key}`, e); }
             });
             // Define fixed order for labels
             trendLabels = ['Minggu 4', 'Minggu 3', 'Minggu 2', 'Minggu 1'];
             trendLabels.forEach(lbl => trendCounts.push(timeLabelsData[lbl] || 0));

        } else if (timePeriod === 'month') {
             const monthKeys = Object.keys(trendsData).sort();
             monthKeys.forEach(key => {
                try {
                    const date = new Date(key + '-02'); // Use day 02 to avoid timezone issues
                    const label = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                    timeLabelsData[label] = trendsData[key];
                } catch(e) { console.error(`Error parsing month key: ${key}`, e); }
             });
             trendLabels = Object.keys(timeLabelsData); // Labels derived from data keys
             trendLabels.forEach(lbl => trendCounts.push(timeLabelsData[lbl]));

        } else if (timePeriod === 'year') {
            trendLabels = Object.keys(trendsData).sort();
            trendLabels.forEach(year => trendCounts.push(trendsData[year]));
        }

        const trendsChart = {
          labels: trendLabels,
          datasets: [{
            label: 'Jumlah Lamaran',
            data: trendCounts,
            backgroundColor: theme.palette.primary.main,
            borderColor: theme.palette.primary.dark,
            borderWidth: 1
          }]
        };

        setChartData({ statusDistribution: statusChart, applicationTrends: trendsChart });

      } catch (chartError) {
        console.error("Failed to fetch or process chart data:", chartError);
        showNotification('Gagal memuat data grafik.', 'error');
        setChartData({ statusDistribution: { labels: [], datasets: [] }, applicationTrends: { labels: [], datasets: [] } });
      } finally {
         // Only set chart loading to false, not affecting main table loading
         setChartLoading(false);
      }
    };

    fetchChartData();
  }, [timePeriod, theme]); // Only depends on timePeriod and theme

  // Effect to fetch paginated applications (now depends on fetchApplications reference and uses debounced filters)
  useEffect(() => {
    // Fetch applications whenever page, rowsPerPage or any filter changes
    const currentFilters = { searchTerm, stageFilter, statusFilter, positionFilter };
    fetchApplications(page, rowsPerPage, currentFilters);
  }, [page, rowsPerPage, searchTerm, stageFilter, statusFilter, positionFilter, fetchApplications]);

  // Map application status to stage for UI display
  const getStageFromStatus = (status) => {
    if (status === 'PENDING' || status === 'REVIEWING' || status === 'REVISION') {
      return 'Administrasi';
    } else if (status === 'INTERVIEW_SCHEDULED') {
      return 'Wawancara';
    } else if (status === 'TECHNICAL_TEST') {
      return 'Technical Test';
    } else if (status === 'ACCEPTED' || status === 'ON_JOB') {
      return 'Diterima';
    } else if (status === 'REJECTED') {
      return 'Ditolak';
    }
    return status;
  };

  // Handle card click to filter applications by stage
  const handleCardClick = (cardName) => {
    setActiveCard(prevActiveCard => prevActiveCard === cardName ? null : cardName);
    
    switch (cardName) {
      case 'pending':
        handleFilterChange('stage', 'Administrasi');
        break;
      case 'interview':
        handleFilterChange('stage', 'Wawancara');
        break;
      case 'technicalTest':
        handleFilterChange('stage', 'Technical Test');
        break;
      case 'accepted':
        handleFilterChange('stage', 'Diterima');
        break;
      case 'rejected':
        handleFilterChange('stage', 'Ditolak');
        break;
      default:
        break;
    }
  };

  // View application details
  const handleViewApplication = (appId, status) => {
    // Different routing based on application status
    if (status === 'INTERVIEW_SCHEDULED') {
      navigate(`/recruiter/candidate-interview-preview/${appId}`);
    } else if (status === 'TECHNICAL_TEST') {
      navigate(`/recruiter/technical-test/${appId}`);
    } else {
      navigate(`/recruiter/candidate-detail/${appId}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Handle time period change
  const handleTimePeriodChange = (event) => {
    setTimePeriod(event.target.value);
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
  const handleStageFilterChange = (event) => {
    const newStage = event.target.value;
    handleFilterChange('stage', newStage);
    setActiveCard(newStage === 'all' ? null : newStage);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    handleFilterChange('status', event.target.value);
    setPage(0);
  };

  const handlePositionFilterChange = (event) => {
    handleFilterChange('position', event.target.value);
    setPage(0);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    handleFilterChange('stage', 'all');
    handleFilterChange('status', 'all');
    handleFilterChange('position', 'all');
    setActiveCard(null);
    setPage(0); // Reset page on filter reset
  };
  
  // Handle opening delete dialog
  const handleOpenDeleteDialog = (application, event) => {
    // Stop event propagation to prevent navigation
    event.stopPropagation();
    setApplicationToDelete(application);
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };
  
  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setApplicationToDelete(null);
    setDeleteConfirmText('');
  };
  
  // Handle delete confirmation text change
  const handleDeleteConfirmTextChange = (event) => {
    setDeleteConfirmText(event.target.value);
  };
  
  // Handle delete application
  const handleDeleteApplication = async () => {
    if (deleteConfirmText !== 'Hapus') {
      return; // Don't proceed if confirmation text is incorrect
    }
    
    try {
      setIsDeleting(true);
      await jobApplicationService.deleteApplication(applicationToDelete.uuid);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
      setDeleteConfirmText('');
      
      // Refresh the applications list
      fetchApplications(page, rowsPerPage, { searchTerm, stageFilter, statusFilter, positionFilter });
      
      // Refresh overall stats
      const statsData = await jobApplicationService.getApplicationStageStats();
      if (statsData) {
        setStats({
          pending: statsData.pending || 0,
          interview: statsData.interview || 0,
          technicalTest: statsData.technicalTest || 0,
          accepted: statsData.accepted || 0,
          rejected: statsData.rejected || 0
        });
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Kandidat
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${stageInfo['Administrasi'].color} 0%, ${stageInfo['Administrasi'].color}DD 100%)`,
              cursor: 'pointer',
              position: 'relative',
              '&:hover': {
                opacity: 0.9,
                transform: 'translateY(-3px)',
                transition: 'all 0.2s ease-in-out'
              },
              border: activeCard === 'Administrasi' ? '3px solid #fff' : 'none',
              boxShadow: activeCard === 'Administrasi' ? '0 0 10px rgba(255,255,255,0.5)' : 3
            }}
            onClick={() => handleCardClick('Administrasi')}
          >
            {activeCard === 'Administrasi' && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  right: 10, 
                  top: 10, 
                  bgcolor: '#fff', 
                  color: stageInfo['Administrasi'].color, 
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </Box>
            )}
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mr: 2 
            }}>
              {stageInfo['Administrasi'].icon}
            </Box>
            <Box>
              <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Tahap Administrasi
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${stageInfo['Wawancara'].color} 0%, ${stageInfo['Wawancara'].color}DD 100%)`,
              cursor: 'pointer',
              position: 'relative',
              '&:hover': {
                opacity: 0.9,
                transform: 'translateY(-3px)',
                transition: 'all 0.2s ease-in-out'
              },
              border: activeCard === 'Wawancara' ? '3px solid #fff' : 'none',
              boxShadow: activeCard === 'Wawancara' ? '0 0 10px rgba(255,255,255,0.5)' : 3
            }}
            onClick={() => handleCardClick('Wawancara')}
          >
            {activeCard === 'Wawancara' && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  right: 10, 
                  top: 10, 
                  bgcolor: '#fff', 
                  color: stageInfo['Wawancara'].color, 
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </Box>
            )}
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mr: 2 
            }}>
              {stageInfo['Wawancara'].icon}
            </Box>
            <Box>
              <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.interview}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Tahap Wawancara
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${stageInfo['Technical Test'].color} 0%, ${stageInfo['Technical Test'].color}DD 100%)`,
              cursor: 'pointer',
              position: 'relative',
              '&:hover': {
                opacity: 0.9,
                transform: 'translateY(-3px)',
                transition: 'all 0.2s ease-in-out'
              },
              border: activeCard === 'Technical Test' ? '3px solid #fff' : 'none',
              boxShadow: activeCard === 'Technical Test' ? '0 0 10px rgba(255,255,255,0.5)' : 3
            }}
            onClick={() => handleCardClick('Technical Test')}
          >
            {activeCard === 'Technical Test' && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  right: 10, 
                  top: 10, 
                  bgcolor: '#fff', 
                  color: stageInfo['Technical Test'].color, 
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </Box>
            )}
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mr: 2 
            }}>
              {stageInfo['Technical Test'].icon}
            </Box>
            <Box>
              <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.technicalTest}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Tahap Technical Test
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${stageInfo['Diterima'].color} 0%, ${stageInfo['Diterima'].color}DD 100%)`,
              cursor: 'pointer',
              position: 'relative',
              '&:hover': {
                opacity: 0.9,
                transform: 'translateY(-3px)',
                transition: 'all 0.2s ease-in-out'
              },
              border: activeCard === 'Diterima' ? '3px solid #fff' : 'none',
              boxShadow: activeCard === 'Diterima' ? '0 0 10px rgba(255,255,255,0.5)' : 3
            }}
            onClick={() => handleCardClick('Diterima')}
          >
            {activeCard === 'Diterima' && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  right: 10, 
                  top: 10, 
                  bgcolor: '#fff', 
                  color: stageInfo['Diterima'].color, 
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </Box>
            )}
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mr: 2 
            }}>
              {stageInfo['Diterima'].icon}
            </Box>
            <Box>
              <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
                {stats.accepted}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Diterima
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TextField
              select
              label="Periode Waktu"
              value={timePeriod}
              onChange={handleTimePeriodChange}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="week">Mingguan</MenuItem>
              <MenuItem value="month">Bulanan</MenuItem>
              <MenuItem value="year">Tahunan</MenuItem>
            </TextField>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Distribusi Status Lamaran
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {(chartLoading && !chartData.statusDistribution.labels.length) ? <CircularProgress /> : chartData.statusDistribution.labels.length > 0 ? (
                <Pie data={chartData.statusDistribution} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: theme.palette.text.primary,
                          font: { size: 11 },
                          padding: 15
                        }
                      },
                      tooltip: { bodyFont: { size: 13 }, titleFont: { size: 13 } }
                    }
                  }} />
              ) : ( <Typography variant="body2" color="text.secondary">Tidak ada data</Typography> )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary }}>
              {timePeriod === 'week' ? 'Tren Aplikasi Mingguan' : 
               timePeriod === 'month' ? 'Tren Aplikasi Bulanan' : 
               'Tren Aplikasi Tahunan'}
            </Typography>
            <Box sx={{ height: 300 }}>
              {(chartLoading && !chartData.applicationTrends.labels.length) ? <CircularProgress /> : chartData.applicationTrends.labels.length > 0 ? (
                <Bar data={chartData.applicationTrends} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, ticks: { color: theme.palette.text.secondary }, grid: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } },
                      x: { ticks: { color: theme.palette.text.secondary }, grid: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: { bodyFont: { size: 13 }, titleFont: { size: 13 } }
                    }
                  }}/>
              ) : ( <Typography variant="body2" color="text.secondary">Tidak ada data</Typography> )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Cari Nama Kandidat"
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
              label="Tahapan"
              value={stageFilter}
              onChange={handleStageFilterChange}
              SelectProps={{
                MenuProps: {
                  sx: { maxHeight: '300px' },
                  disableScrollLock: true
                }
              }}
            >
              {stageOptions.map((option) => (
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
          
          <Grid item xs={12} md={1}>
            <Button 
              variant="outlined" 
              color="secondary" 
              size="medium" 
              onClick={handleResetFilters}
              fullWidth
              sx={{ height: '40px' }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Applications Table */}
      <div id="applications-table">
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
                    }}>Tahapan</TableCell>
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
                    }}>Posisi</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2
                    }}>Tanggal Melamar</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.95rem',
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      py: 2,
                      width: '80px',
                      textAlign: 'center'
                    }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.length > 0 ? (
                    applications.map((application) => (
                      <TableRow 
                        key={application.uuid} 
                        hover 
                        onClick={() => handleViewApplication(application.uuid, application.status)}
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
                                bgcolor: statusColors[application.status] || theme.palette.grey[500],
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                mr: 2
                              }}
                            >
                              {(application.candidateInfo?.name || application.nama_ktp || 'N/A').charAt(0).toUpperCase()}
                            </Box>
                            <Typography variant="body1" fontWeight="medium">
                              {(application.candidateInfo?.name || application.nama_ktp || 'N/A')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getStageFromStatus(application.status)} 
                            size="small"
                            sx={{ 
                              bgcolor: stageInfo[getStageFromStatus(application.status)]?.color || '#757575',
                              color: '#fff',
                              fontWeight: 'medium',
                              fontSize: '0.85rem',
                              height: '28px',
                              '& .MuiChip-label': {
                                px: 1.5
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: statusColors[application.status],
                              fontWeight: 'medium'
                            }}
                          >
                            {getStatusLabel(application.status)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {application.jobPostingId?.jobPosition || application.posisi_dilamar || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(application.submissionDate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Hapus Aplikasi">
                            <IconButton 
                              size="medium" 
                              color="error"
                              onClick={(e) => handleOpenDeleteDialog(application, e)}
                              sx={{ 
                                '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' },
                                minWidth: '40px',
                                height: '40px'
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body1" sx={{ my: 3, color: theme.palette.text.secondary }}>
                          Tidak ada data kandidat ditemukan.
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
              count={totalApplications}
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            width: '450px',
            maxWidth: '95vw',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold" color="error">
            Konfirmasi Hapus Aplikasi
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ mb: 3 }}>
            Anda akan menghapus aplikasi <strong>{applicationToDelete?.candidateInfo?.name || applicationToDelete?.nama_ktp || 'kandidat'}</strong> untuk posisi <strong>{applicationToDelete?.jobPostingId?.jobPosition || applicationToDelete?.posisi_dilamar || 'posisi'}</strong> secara <strong>permanen</strong>. Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
          <DialogContentText sx={{ mb: 1, color: 'text.primary' }}>
            Ketik "<strong>Hapus</strong>" untuk mengkonfirmasi:
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            value={deleteConfirmText}
            onChange={handleDeleteConfirmTextChange}
            variant="outlined"
            placeholder="Hapus"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Batal
          </Button>
          <Button 
            onClick={handleDeleteApplication} 
            variant="contained" 
            color="error"
            disabled={deleteConfirmText !== 'Hapus' || isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CandidatesPage; 