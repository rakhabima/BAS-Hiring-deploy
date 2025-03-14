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
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const InternalStaffPage = () => {
  const theme = useTheme();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock function to get staff list from localStorage
    const fetchStaffList = () => {
      setLoading(true);
      try {
        // Try to get staff list from localStorage
        const storedStaff = localStorage.getItem('mockStaffList');
        if (storedStaff) {
          setStaffList(JSON.parse(storedStaff));
        }
      } catch (error) {
        console.error('Error fetching staff list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffList();

    // Listen for changes in localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'mockStaffList') {
        try {
          const updatedStaff = JSON.parse(e.newValue);
          setStaffList(updatedStaff || []);
        } catch (error) {
          console.error('Error parsing updated staff list:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
            <Typography variant="body1">Memuat data...</Typography>
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