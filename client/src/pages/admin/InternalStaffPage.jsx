import { Add as AddIcon } from '@mui/icons-material';
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
  CircularProgress
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/api';

const InternalStaffPage = () => {
  const theme = useTheme();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    switch(role) {
      case 'RECRUITER': return 'Recruiter';
      case 'GENERAL_MANAGER': return 'General Manager';
      case 'KOORDINATOR_LAPANGAN': return 'Koordinator Lapangan';
      case 'KARYAWAN': return 'Karyawan';
      default: return role;
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nama</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Posisi</strong></TableCell>
                  <TableCell><strong>Tanggal Dibuat</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.uuid}>
                    <TableCell>{staff.name}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{getRoleName(staff.role)}</TableCell>
                    <TableCell>
                      {new Date(staff.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
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