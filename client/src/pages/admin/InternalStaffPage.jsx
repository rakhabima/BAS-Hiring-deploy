import {
  Add as AddIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';

const InternalStaffPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if we're in dark mode
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    // Fungsi untuk mengambil data staff dari API
    const fetchStaffList = async () => {
      setLoading(true);
      setError(null);

      try {
        // Menggunakan userService.getAllUsers() untuk mendapatkan daftar pengguna
        const response = await userService.getAllUsers();
        console.log('API Response:', response);

        // Berdasarkan screenshot, data respons tampaknya ada dalam format objek
        // dengan properti 'data' yang berisi array pengguna
        let usersArray = [];

        // Periksa berbagai kemungkinan struktur data
        if (Array.isArray(response)) {
          // Jika response langsung berupa array
          usersArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Jika response memiliki property data berupa array
          usersArray = response.data;
        } else if (response && typeof response === 'object') {
          // Coba temukan array di dalam objek response
          for (const key in response) {
            if (Array.isArray(response[key])) {
              usersArray = response[key];
              break;
            }
          }
        }

        console.log('Extracted users array:', usersArray);

        // Pastikan usersArray berisi data yang valid
        if (usersArray && usersArray.length > 0) {
          // Filter hanya pengguna dengan peran staff internal (bukan CANDIDATE)
          const staffUsers = usersArray.filter(user =>
            user && user.role &&
            user.role !== 'CANDIDATE' &&
            user.role !== 'GUEST' &&
            user.role !== 'KARYAWAN' &&
            user.role !== 'ADMIN'
          );

          console.log('Filtered staff users:', staffUsers);
          setStaffList(staffUsers);
        } else {
          // Jika tidak ada data yang valid, set sebagai array kosong
          console.log('No valid users data found');
          setStaffList([]);
        }
      } catch (error) {
        console.error('Error fetching staff list:', error);
        setError('Gagal memuat data. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffList();
  }, []);

  const getRoleName = (role) => {
    switch (role) {
      case 'RECRUITER': return 'Recruiter';
      case 'GENERAL_MANAGER': return 'General Manager';
      case 'KOORDINATOR_LAPANGAN': return 'Koordinator Lapangan';
      default: return role;
    }
  };

  // Handle view button click
  const handleViewClick = (uuid) => {
    navigate(`/admin/staff/${uuid}`);
  };

  // Handle delete button click
  const handleDeleteClick = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun ${name}?`)) {
      try {
        await userService.deleteUser(id);
        // Refresh the list after deletion
        setStaffList(staffList.filter(staff => staff.uuid !== id));
        alert('Akun berhasil dihapus');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Gagal menghapus akun. Silakan coba lagi nanti.');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Daftar Staf Internal
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/admin/create-account"
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            borderRadius: '8px',
          }}
        >
          Tambah Akun
        </Button>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '70vh',
          background: isDarkMode ? theme.palette.background.paper : '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Memuat data...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="error">{error}</Typography>
          </Box>
        ) : staffList.length > 0 ? (
              <TableContainer sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                  <TableHead
                    sx={{
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'aliceblue'
                    }}
                  >
                <TableRow>
                      <TableCell sx={{ borderTopLeftRadius: '16px' }}><strong>Nama Staf</strong></TableCell>
                      <TableCell><strong>Posisi Kerja</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="center" sx={{ borderTopRightRadius: '16px' }}><strong>Aksi</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                    {staffList.map((staff, index) => {
                      const isLastRow = index === staffList.length - 1;

                      return (
                        <TableRow
                          key={staff.uuid}
                          sx={{
                            '&:hover': {
                              backgroundColor: isDarkMode
                                ? alpha(theme.palette.action.hover, 0.1)
                                : theme.palette.action.hover,
                            },
                            borderBottom: `1px solid ${isDarkMode
                              ? alpha(theme.palette.divider, 0.3)
                              : theme.palette.divider}`,
                            backgroundColor: isDarkMode
                              ? (index % 2 === 0
                                ? alpha(theme.palette.action.hover, 0.05)
                                : 'transparent')
                              : (index % 2 === 0
                                ? alpha(theme.palette.action.hover, 0.02)
                                : 'transparent')
                          }}
                        >
                          <TableCell sx={{ borderBottomLeftRadius: isLastRow ? '16px' : 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{
                                bgcolor: isDarkMode ? alpha(theme.palette.grey[500], 0.25) : 'lightgray',
                                mr: 2,
                                color: isDarkMode ? theme.palette.text.primary : 'inherit'
                              }}>
                                <PersonIcon />
                              </Avatar>
                              {staff.name}
                            </Box>
                          </TableCell>
                          <TableCell>{getRoleName(staff.role)}</TableCell>
                          <TableCell>{staff.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={staff.status ? "Aktif" : "Nonaktif"}
                              sx={{
                                bgcolor: isDarkMode
                                  ? (staff.status
                                    ? alpha(theme.palette.success.main, 0.2)
                                    : alpha(theme.palette.error.main, 0.2))
                                  : (staff.status
                                    ? '#edf7ed'
                                    : '#fdeded'),
                                color: isDarkMode
                                  ? (staff.status
                                    ? theme.palette.success.light
                                    : theme.palette.error.light)
                                  : (staff.status
                                    ? '#1e4620'
                                    : '#ab2626'),
                                borderRadius: '16px',
                                border: isDarkMode
                                  ? (staff.status
                                    ? `1px solid ${alpha(theme.palette.success.main, 0.5)}`
                                    : `1px solid ${alpha(theme.palette.error.main, 0.5)}`)
                                  : (staff.status
                                    ? '1px solid #b7dfb9'
                                    : '1px solid #f5c8c7'),
                                fontSize: '0.75rem',
                                height: '28px'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottomRightRadius: isLastRow ? '16px' : 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip
                                title="Lihat Detail Staff"
                                arrow
                                placement="top"
                              >
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={() => handleViewClick(staff.uuid)}
                                  sx={{
                                    borderRadius: '4px',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.main,
                                    '&:hover': {
                                      backgroundColor: isDarkMode
                                        ? alpha(theme.palette.primary.main, 0.1)
                                        : alpha(theme.palette.primary.main, 0.1),
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    minWidth: 0,
                                  }}
                                >
                                  Lihat
                                </Button>
                              </Tooltip>

                              <Tooltip
                                title="Hapus Staff"
                                arrow
                                placement="top"
                              >
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteClick(staff.uuid, staff.name)}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: isDarkMode
                                        ? alpha(theme.palette.error.main, 0.1)
                                        : alpha(theme.palette.error.main, 0.1),
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="textSecondary">
              Belum ada data staf internal.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default InternalStaffPage;