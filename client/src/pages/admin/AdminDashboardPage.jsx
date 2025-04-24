import {
  AccountCircle,
  Error,
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import api, { userService } from '../../services/api'; // Import api as default import

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

// Activity type chip styling
const ActivityChip = styled(Chip)(({ theme, type }) => {
  let color = theme.palette.text.primary;
  let backgroundColor = theme.palette.grey[300];
  
  switch (type) {
    case "LOGIN":
      backgroundColor = alpha(theme.palette.success.main, 0.15);
      color = theme.palette.success.dark;
      break;
    case "LOGOUT":
      backgroundColor = alpha(theme.palette.info.main, 0.15);
      color = theme.palette.info.dark;
      break;
    case "DATA_CHANGE":
      backgroundColor = alpha(theme.palette.warning.light, 0.2);
      color = theme.palette.warning.main;
      break;
    case "ERROR":
      backgroundColor = alpha(theme.palette.error.main, 0.15);
      color = theme.palette.error.dark;
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

// Helper function to count by role
const countByRole = (users) => {
  // Daftar role yang mungkin ada
  const allRoles = [
    'ADMIN', 
    'GENERAL_MANAGER', 
    'RECRUITER', 
    'KOORDINATOR_LAPANGAN', 
    'CANDIDATE', 
    'KARYAWAN',
    'GUEST'
  ];
  
  // Inisialisasi counts dengan semua role diset ke 0
  const counts = {};
  allRoles.forEach(role => counts[role] = 0);
  
  // Hitung jumlah user per role
  users.forEach(user => {
    if (user && user.role) {
      if (counts[user.role] !== undefined) {
        counts[user.role]++;
      } else {
        // Jika ditemukan role baru yang belum terdaftar
        counts[user.role] = 1;
      }
    }
  });
  
  // Filter hanya role yang ada usernya (jumlah > 0)
  const filteredCounts = {};
  Object.keys(counts).forEach(role => {
    if (counts[role] > 0) {
      filteredCounts[role] = counts[role];
    }
  });
  
  return filteredCounts;
};

// Helper function to count by activity type
const countByActivityType = (logs) => {
  return logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {});
};

// Helper function to group activities by date
const groupActivitiesByDate = (activities, period, selectedMonth) => {
  const grouped = {};
  const currentYear = new Date().getFullYear();
  
  activities.forEach(activity => {
    let dateKey;
    const activityDate = new Date(activity.timestamp);
    const activityMonth = activityDate.getMonth();
    const activityFullYear = activityDate.getFullYear();
    
    if (period === 'yearly') {
      if (activityFullYear === currentYear) {
        dateKey = activityDate.toLocaleDateString('id-ID', { month: 'long' });
      }
    } else if (period === 'monthly') {
      if (activityMonth === selectedMonth) {
        const weekNumber = Math.ceil(activityDate.getDate() / 7);
        dateKey = `Minggu ${weekNumber}`;
      }
    } else if (period === 'weekly') {
      const dayName = activityDate.toLocaleDateString('id-ID', { weekday: 'long' });
      const dateOfMonth = activityDate.getDate();
      const month = activityDate.getMonth() + 1;
      dateKey = `${dayName} (${dateOfMonth}/${month})`;
    }
    
    if (dateKey) {
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          total: 0,
          LOGIN: 0,
          LOGOUT: 0,
          DATA_CHANGE: 0,
          ERROR: 0,
          dateObject: activityDate,
        };
      }
      
      grouped[dateKey].total++;
      grouped[dateKey][activity.type]++;
    }
  });
  
  return grouped;
};

// Generate mock activity logs for demonstration
const generateMockActivityLogs = (users, count = 50) => {
  if (!users || users.length === 0) return [];
  
  const activityTypes = ['LOGIN', 'LOGOUT', 'DATA_CHANGE', 'ERROR'];
  const descriptions = {
    LOGIN: ['User logged in', 'Successful login', 'Authentication successful'],
    LOGOUT: ['User logged out', 'Session ended', 'Logout successful'],
    DATA_CHANGE: ['Profile updated', 'Password changed', 'User information modified', 'Role updated'],
    ERROR: ['Failed login attempt', 'Invalid credentials', 'Permission denied', 'Session expired']
  };
  
  const ipAddresses = [
    '192.168.1.1', '172.16.0.1', '10.0.0.1', '127.0.0.1', 
    '192.168.0.100', '172.16.10.10', '10.0.1.25'
  ];
  
  const logs = [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const descriptions_for_type = descriptions[type];
    const description = descriptions_for_type[Math.floor(Math.random() * descriptions_for_type.length)];
    
    // Generate random timestamp within the last week
    const timestamp = new Date(
      oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime())
    );
    
    logs.push({
      id: `activity-${i}`,
      timestamp: timestamp.toISOString(),
      type,
      userId: user.uuid || user.id,
      userName: user.name || user.fullName || 'Unknown User',
      description,
      ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
      details: {
        email: user.email,
        role: user.role
      }
    });
  }
  
  // Sort by timestamp descending (newest first)
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// Month names for dropdown
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const AdminDashboardPage = () => {
  const theme = useTheme();
  
  // Helper to get user status display value
  const getUserStatus = (user) => {
    // Handle different status formats:
    // - Boolean: true/false
    // - String: "ACTIVE"/"INACTIVE"
    // - Property doesn't exist
    
    if (!user || (user.status === undefined && user.isActive === undefined)) {
      return 'UNKNOWN';
    }
    
    if (typeof user.status === 'boolean') {
      return user.status ? 'ACTIVE' : 'INACTIVE';
    }
    
    if (typeof user.isActive === 'boolean') {
      return user.isActive ? 'ACTIVE' : 'INACTIVE';
    }
    
    if (user.status === 'ACTIVE' || user.status === 'INACTIVE') {
      return user.status;
    }
    
    // Default to string representation of whatever value we have
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
  const [activityLogs, setActivityLogs] = useState([]);
  const [periodFilter, setPeriodFilter] = useState('weekly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [roleDistribution, setRoleDistribution] = useState({});
  const [activityTypeCounts, setActivityTypeCounts] = useState({});
  const [chartData, setChartData] = useState(null);
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
  
  // Activity logs table states
  const [activityPage, setActivityPage] = useState(0);
  const [activityRowsPerPage, setActivityRowsPerPage] = useState(10);
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');

  // --- Callbacks for useEffect dependencies ---

  // Prepare data for doughnut chart (memoized)
  const prepareDoughnutChartData = useCallback((roleCounts) => {
    const data = {
      labels: Object.keys(roleCounts).map(role => `${role} (${roleCounts[role]})`),
      datasets: [
        {
          label: 'Users by Role',
          data: Object.values(roleCounts),
          backgroundColor: [
            alpha(theme.palette.primary.light, 0.7),
            alpha(theme.palette.success.light, 0.7),
            alpha(theme.palette.warning.light, 0.7),
            alpha(theme.palette.error.light, 0.7),
          ],
          borderColor: [
            theme.palette.primary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main,
          ],
          borderWidth: 1,
        },
      ],
    };
    setDoughnutChartData(data);
  }, [theme]); // Add theme dependency

  // Prepare data for activity chart (memoized)
  const prepareChartData = useCallback((activities) => {
    const groupedData = groupActivitiesByDate(activities, periodFilter, selectedMonth);
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
    } else {
      sortedDates = []; // Handle potential undefined case
    }

    const chartData = {
      labels: sortedDates,
      datasets: [
        {
          label: 'Login',
          data: sortedDates.map(date => groupedData[date]?.LOGIN || 0),
          backgroundColor: 'rgba(76, 175, 80, 0.5)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        },
        {
          label: 'Logout',
          data: sortedDates.map(date => groupedData[date]?.LOGOUT || 0),
          backgroundColor: 'rgba(33, 150, 243, 0.5)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        },
        {
          label: 'Data Changes',
          data: sortedDates.map(date => groupedData[date]?.DATA_CHANGE || 0),
          backgroundColor: 'rgba(255, 193, 7, 0.5)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        },
        {
          label: 'Errors',
          data: sortedDates.map(date => groupedData[date]?.ERROR || 0),
          backgroundColor: 'rgba(244, 67, 54, 0.5)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1,
          barPercentage: 0.6,
        }
      ],
    };

    setChartData(chartData);
  }, [periodFilter, selectedMonth]); // Add dependencies

  // Fetch all necessary data (memoized)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Mengambil data user dari API...');
      
      // Array untuk menyimpan semua user
      let allUsers = [];
      
      // 1. Ambil staff internal dahulu
      try {
        const staffResponse = await userService.getAllUsers();
        console.log('Response staff internal:', staffResponse);
        
        // Ekstrak data staff berdasarkan format response
        let staffUsers = [];
        if (staffResponse && staffResponse.data && Array.isArray(staffResponse.data)) {
          staffUsers = staffResponse.data;
        } else if (staffResponse && Array.isArray(staffResponse)) {
          staffUsers = staffResponse;
        } else if (staffResponse && typeof staffResponse === 'object') {
          // Coba cari array di dalam response object
          for (const key in staffResponse) {
            if (Array.isArray(staffResponse[key])) {
              staffUsers = staffResponse[key];
              break;
            }
          }
          
          // Jika masih belum ketemu, coba cek di staffResponse.data
          if (staffUsers.length === 0 && staffResponse.data && typeof staffResponse.data === 'object') {
            for (const key in staffResponse.data) {
              if (Array.isArray(staffResponse.data[key])) {
                staffUsers = staffResponse.data[key];
                break;
              }
            }
          }
        }
        
        console.log(`Ditemukan ${staffUsers.length} staff internal`);
        // Tambahkan ke array allUsers
        allUsers = [...staffUsers];
      } catch (staffError) {
        console.error('Gagal mengambil data staff:', staffError);
      }
      
      // 2. Ambil data kandidat melalui beberapa endpoint alternatif
      try {
        // Coba beberapa endpoint yang mungkin untuk mendapatkan kandidat
        const possibleEndpoints = [
          '/auth/candidates',           // Endpoint khusus kandidat
          '/user/candidates',           // Endpoint khusus kandidat alternatif
          '/auth/users?role=CANDIDATE', // Endpoint dengan filter query
          '/user/all-candidates'        // Endpoint alternatif lain
        ];
        
        let candidatesFetched = false;
        let candidatesResponse = null;
        
        // Coba setiap endpoint sampai berhasil
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`Mencoba endpoint kandidat: ${endpoint}`);
            candidatesResponse = await api.get(endpoint);
            console.log(`Response dari ${endpoint}:`, candidatesResponse);
            candidatesFetched = true;
            break;
          } catch (endpointError) {
            console.log(`Endpoint ${endpoint} gagal:`, endpointError.message);
          }
        }
        
        // Jika semua endpoint gagal, coba cara alternatif - cek database authentication langsung
        if (!candidatesFetched) {
          try {
            console.log('Mencoba endpoint auth langsung untuk mendapatkan semua user');
            candidatesResponse = await api.get('/auth/users');
            console.log('Response dari /auth/users:', candidatesResponse);
            candidatesFetched = true;
          } catch (authError) {
            console.error('Gagal mengakses data auth:', authError);
          }
        }
        
        // Jika kandidat berhasil diambil, proses datanya
        if (candidatesFetched && candidatesResponse) {
          let candidatesData = [];
          
          // Ekstrak data kandidat berdasarkan format response
          if (candidatesResponse.data && Array.isArray(candidatesResponse.data)) {
            candidatesData = candidatesResponse.data;
          } else if (candidatesResponse.data && candidatesResponse.data.data && 
                     Array.isArray(candidatesResponse.data.data)) {
            candidatesData = candidatesResponse.data.data;
          } else if (Array.isArray(candidatesResponse)) {
            candidatesData = candidatesResponse;
          } else if (candidatesResponse && typeof candidatesResponse === 'object') {
            // Coba cari array di response object
            for (const key in candidatesResponse) {
              if (Array.isArray(candidatesResponse[key])) {
                candidatesData = candidatesResponse[key];
                break;
              }
            }
            
            // Cek juga di candidatesResponse.data
            if (candidatesData.length === 0 && 
                candidatesResponse.data && 
                typeof candidatesResponse.data === 'object') {
              for (const key in candidatesResponse.data) {
                if (Array.isArray(candidatesResponse.data[key])) {
                  candidatesData = candidatesResponse.data[key];
                  break;
                }
              }
            }
          }
          
          // Filter data kandidat dan pastikan role-nya benar
          const filteredCandidates = candidatesData
            .filter(user => 
              user && 
              (user.role === 'CANDIDATE' || 
               (typeof user.role === 'string' && user.role.toUpperCase().includes('CANDIDATE')))
            )
            .map(candidate => ({
              ...candidate,
              role: 'CANDIDATE' // Pastikan role CANDIDATE terstandarisasi
            }));
          
          console.log(`Ditemukan ${filteredCandidates.length} kandidat dari API`);
          if (filteredCandidates.length > 0) {
            console.log('Contoh data kandidat:', filteredCandidates[0]);
          }
          
          // Tambahkan kandidat ke array allUsers
          allUsers = [...allUsers, ...filteredCandidates];
        }
      } catch (candidatesError) {
        console.error('Gagal mengambil data kandidat:', candidatesError);
      }
      
      // 3. Jika masih belum ada data kandidat, coba satu endpoint umum lagi
      if (!allUsers.some(user => user.role === 'CANDIDATE')) {
        try {
          console.log('Mencoba endpoint terakhir untuk mendapatkan semua user termasuk kandidat');
          const allResponse = await api.get('/user');
          console.log('Response dari /user:', allResponse);
          
          // Proses data dari endpoint umum
          let additionalUsers = [];
          if (allResponse.data && Array.isArray(allResponse.data)) {
            additionalUsers = allResponse.data;
          } else if (allResponse.data && allResponse.data.data && Array.isArray(allResponse.data.data)) {
            additionalUsers = allResponse.data.data;
          } else if (allResponse && typeof allResponse.data === 'object') {
            for (const key in allResponse.data) {
              if (Array.isArray(allResponse.data[key])) {
                additionalUsers = allResponse.data[key];
                break;
              }
            }
          }
          
          console.log(`Ditemukan ${additionalUsers.length} user tambahan`);
          
          // Tambahkan user yang belum ada sebelumnya berdasarkan email (untuk menghindari duplikat)
          const existingEmails = new Set(allUsers.map(user => user.email));
          const newUsers = additionalUsers.filter(user => !existingEmails.has(user.email));
          console.log(`${newUsers.length} user baru akan ditambahkan ke daftar`);
          
          // Gabungkan dengan allUsers
          allUsers = [...allUsers, ...newUsers];
        } catch (error) {
          console.error('Gagal mengambil data dari endpoint umum:', error);
        }
      }
      
      // 4. Jika masih belum ada data juga, gunakan mock data sebagai fallback
      if (allUsers.length === 0) {
        console.warn('Tidak ada data user ditemukan! Menggunakan data mock...');
        
        // Buat beberapa data mock untuk testing
        allUsers = [
          {
            uuid: 'mock-1',
            name: 'Admin Test',
            email: 'admin@example.com',
            role: 'ADMIN',
            status: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            uuid: 'mock-2',
            name: 'Kandidat Test 1',
            email: 'kandidat1@example.com',
            role: 'CANDIDATE',
            status: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            uuid: 'mock-3',
            name: 'Kandidat Test 2',
            email: 'kandidat2@example.com',
            role: 'CANDIDATE',
            status: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            uuid: 'mock-4',
            name: 'Recruiter Test',
            email: 'recruiter@example.com',
            role: 'RECRUITER',
            status: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            uuid: 'mock-5',
            name: 'General Manager',
            email: 'gm@example.com',
            role: 'GENERAL_MANAGER',
            status: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        // Tampilkan peringatan di UI
        showError('Menggunakan data contoh karena tidak bisa mengambil data asli dari server');
      }
      
      // 5. Analisis hasil final
      console.log(`Total ${allUsers.length} user berhasil dikumpulkan`);
      
      // Analisis distribusi role 
      const roleSummary = {};
      allUsers.forEach(user => {
        const role = user.role || 'UNKNOWN';
        roleSummary[role] = (roleSummary[role] || 0) + 1;
      });
      console.log('Distribusi role:', roleSummary);
      
      // Cek data kandidat final
      const finalCandidates = allUsers.filter(user => user.role === 'CANDIDATE');
      console.log(`Final: ${finalCandidates.length} kandidat ditemukan`);
      if (finalCandidates.length > 0) {
        console.log('Contoh kandidat final:', finalCandidates[0]);
      } else {
        console.warn('PERINGATAN: Tidak ada kandidat ditemukan dalam data akhir!');
      }
      
      // Update state dengan semua user yang dikumpulkan
      setUsers(allUsers);
      
      // Generate mock activity logs for demonstration
      try {
        // In a real app, would fetch from API
        console.log('Generating mock activity logs for demonstration');
        const mockActivityLogs = generateMockActivityLogs(allUsers, 50);
        setActivityLogs(mockActivityLogs);
        
        // Count activity types
        const typeCounts = countByActivityType(mockActivityLogs);
        setActivityTypeCounts(typeCounts);
        
        // Prepare activity chart data
        prepareChartData(mockActivityLogs);
      } catch (activityError) {
        console.error('Error generating mock activity logs:', activityError);
      }
      
      // Hitung distribusi role dari data yang dikumpulkan
      const roleCounts = countByRole(allUsers);
      console.log('Distribusi role untuk chart:', roleCounts);
      setRoleDistribution(roleCounts);
      prepareDoughnutChartData(roleCounts);
      
    } catch (error) {
      console.error('Error utama:', error);
      showError('Gagal memuat data pengguna: ' + (error.message || 'Terjadi kesalahan server'));
      setUsers([]);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  }, [prepareDoughnutChartData, prepareChartData]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Add fetchData as dependency

  // Update doughnut chart when users data changes
  useEffect(() => {
    if (users.length > 0) {
      const roleCounts = countByRole(users);
      setRoleDistribution(roleCounts);
      prepareDoughnutChartData(roleCounts);
    }
  }, [users, prepareDoughnutChartData]); // Add prepareDoughnutChartData as dependency

  // Update bar chart when activity logs or filters change
  useEffect(() => {
    if (activityLogs.length > 0) {
      // Update activity type counts
      const typeCounts = countByActivityType(activityLogs);
      setActivityTypeCounts(typeCounts);
      
      // Prepare chart data
      prepareChartData(activityLogs);
    }
  }, [activityLogs, periodFilter, selectedMonth, prepareChartData]);

  // --- Event Handlers ---

  // Handle period filter change
  const handlePeriodChange = (_, newPeriod) => {
    if (newPeriod !== null) {
      setPeriodFilter(newPeriod);
    }
  };
  
  // Handle month selection
  const handleMonthChange = (event) => {
    setSelectedMonth(parseInt(event.target.value));
  };
  
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
  
  // Handle activity type filter change
  const handleActivityTypeFilterChange = (event) => {
    setActivityTypeFilter(event.target.value);
    setActivityPage(0);
  };
  
  // Handle activity search change
  const handleActivitySearchChange = (event) => {
    setActivitySearchQuery(event.target.value);
    setActivityPage(0);
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
  
  // Handle activity page change
  const handleActivityChangePage = (_, newPage) => {
    setActivityPage(newPage);
  };
  
  // Handle activity rows per page change
  const handleActivityChangeRowsPerPage = (event) => {
    setActivityRowsPerPage(parseInt(event.target.value, 10));
    setActivityPage(0);
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
  
  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = searchQuery === '' || 
          (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (user.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        
        // Use the getUserStatus helper to check status consistently
        const userStatus = getUserStatus(user);
        const matchesStatus = statusFilter === '' || userStatus === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const fieldA = sortField === 'name' ? (a.name || a.fullName || '') : 
                      a[sortField] || '';
        const fieldB = sortField === 'name' ? (b.name || b.fullName || '') : 
                      b[sortField] || '';
        
        // Special handling for status field due to possibly different formats
        if (sortField === 'status') {
          const statusA = getUserStatus(a);
          const statusB = getUserStatus(b);
          
          if (sortOrder === 'asc') {
            return statusA.localeCompare(statusB);
          } else {
            return statusB.localeCompare(statusA);
          }
        }
        
        // Normal string or date comparison
        if (sortOrder === 'asc') {
          return String(fieldA).localeCompare(String(fieldB));
        } else {
          return String(fieldB).localeCompare(String(fieldA));
        }
      });
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortOrder]);
  
  // Get paginated users
  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);
  
  // Filter activity logs
  const filteredActivityLogs = useMemo(() => {
    return activityLogs
      .filter(log => {
        const matchesSearch = activitySearchQuery === '' || 
          log.description.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
          (log.userId && log.userId.toLowerCase().includes(activitySearchQuery.toLowerCase()));
        
        const matchesType = activityTypeFilter === '' || log.type === activityTypeFilter;
        
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [activityLogs, activitySearchQuery, activityTypeFilter]);
  
  // Get paginated activity logs
  const paginatedActivityLogs = useMemo(() => {
    const start = activityPage * activityRowsPerPage;
    return filteredActivityLogs.slice(start, start + activityRowsPerPage);
  }, [filteredActivityLogs, activityPage, activityRowsPerPage]);
  
  // Calculate user metrics
  const userMetrics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => getUserStatus(user) === 'ACTIVE').length;
    const inactiveUsers = users.filter(user => getUserStatus(user) === 'INACTIVE').length;
    const activePercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      activePercentage
    };
  }, [users]);
  
  // Calculate activity metrics
  const activityMetrics = useMemo(() => {
    const totalActivities = activityLogs.length;
    const loginCount = activityLogs.filter(log => log.type === 'LOGIN').length;
    const logoutCount = activityLogs.filter(log => log.type === 'LOGOUT').length;
    const dataChangeCount = activityLogs.filter(log => log.type === 'DATA_CHANGE').length;
    const errorCount = activityLogs.filter(log => log.type === 'ERROR').length;
    
    // Get today's activities
    const today = new Date().setHours(0, 0, 0, 0);
    const todayActivities = activityLogs.filter(log => new Date(log.timestamp) >= today).length;
    
    return {
      totalActivities,
      loginCount,
      logoutCount,
      dataChangeCount,
      errorCount,
      todayActivities
    };
  }, [activityLogs]);
  
  // Bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.text.secondary, 0.1),
        },
        ticks: {
          color: theme.palette.text.secondary,
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 45,
          minRotation: 45,
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
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
        Monitor user activity, accounts, and system logs
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Users Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PeopleAlt sx={{ fontSize: 30, color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {userMetrics.totalUsers}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  {userMetrics.activeUsers} Active ({userMetrics.activePercentage.toFixed(0)}%)
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        
        {/* Active Users Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountCircle sx={{ fontSize: 30, color: theme.palette.success.main, mr: 1 }} />
                <Typography variant="h6">Active Status</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" component="div">
                  {userMetrics.activeUsers}
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
                <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {userMetrics.inactiveUsers} users are inactive
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        
        {/* Today's Activity Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EventNote sx={{ fontSize: 30, color: theme.palette.warning.main, mr: 1 }} />
                <Typography variant="h6">Today's Activity</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {activityMetrics.todayActivities}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  From {activityMetrics.totalActivities} total activities
                </Typography>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        
        {/* System Errors Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Error sx={{ fontSize: 30, color: theme.palette.error.main, mr: 1 }} />
                <Typography variant="h6">System Errors</Typography>
              </Box>
              <Typography variant="h3" component="div">
                {activityMetrics.errorCount}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {activityMetrics.errorCount > 0 ? (
                  <>
                    <TrendingUp sx={{ color: theme.palette.error.main, fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" color="error">
                      Needs attention
                    </Typography>
                  </>
                ) : (
                  <>
                    <TrendingDown sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2" color="success.main">
                      All systems operational
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Activity Chart */}
        <Grid item xs={12} md={8}>
          <StyledCard sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">System Activity</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <FormControl variant="outlined" size="small">
                    <Select
                      value={periodFilter}
                      onChange={(e) => setPeriodFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {periodFilter === 'monthly' && (
                    <FormControl variant="outlined" size="small">
                      <Select
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        displayEmpty
                      >
                        {monthNames.map((month, index) => (
                          <MenuItem key={month} value={index}>{month}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ height: 300, mt: 2 }}>
                {!chartData ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography color="text.secondary">Data aktivitas belum tersedia.</Typography>
                  </Box>
                ) : (
                  <Bar data={chartData} options={barChartOptions} />
                )}
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        
        {/* User Distribution Chart */}
        <Grid item xs={12} md={4}>
          <StyledCard sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                User Distribution
              </Typography>
              
              <Box sx={{ height: 300, position: 'relative' }}>
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
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
              />
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
      
      {/* Activity Logs Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Logs
              </Typography>
              
              {/* Filter Activity Logs */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    label="Search Activities"
                    value={activitySearchQuery}
                    onChange={handleActivitySearchChange}
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
                    <InputLabel>Filter by Type</InputLabel>
                    <Select
                      value={activityTypeFilter}
                      onChange={handleActivityTypeFilterChange}
                      label="Filter by Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="LOGIN">Login</MenuItem>
                      <MenuItem value="LOGOUT">Logout</MenuItem>
                      <MenuItem value="DATA_CHANGE">Data Change</MenuItem>
                      <MenuItem value="ERROR">Error</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {/* Activity Logs Table */}
              <TableContainer component={Paper} variant="outlined">
                <Table sx={{ minWidth: 650 }} size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Activity Type</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>IP Address</TableCell>
                    </TableRow>
                  </TableHead>
                  
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <LinearProgress />
                        </TableCell>
                      </TableRow>
                    ) : paginatedActivityLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No activity logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedActivityLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell>
                            <ActivityChip
                              label={log.type}
                              type={log.type}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{log.userName}</TableCell>
                          <TableCell>{log.description}</TableCell>
                          <TableCell>{log.ipAddress}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredActivityLogs.length}
                rowsPerPage={activityRowsPerPage}
                page={activityPage}
                onPageChange={handleActivityChangePage}
                onRowsPerPageChange={handleActivityChangeRowsPerPage}
                labelRowsPerPage="Baris per halaman"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
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