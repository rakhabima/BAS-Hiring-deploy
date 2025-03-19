import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
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
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme
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

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // State for alert/snackbar
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success'); // 'success' or 'error'

  // Determine if we're in dark mode
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    // Function to fetch staff data from API
    const fetchStaffList = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching internal staff list');
        // Use userService.getAllUsers() to get user list
        const response = await userService.getAllUsers();
        console.log('Response from getAllUsers:', response);

        let usersArray = [];

        // Check various possible data structures
        if (Array.isArray(response)) {
          console.log('Response is an array');
          usersArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          console.log('Response has data array property');
          usersArray = response.data;
        } else if (response && typeof response === 'object') {
          console.log('Response is an object, looking for array properties');
          for (const key in response) {
            if (Array.isArray(response[key])) {
              console.log(`Found array in property: ${key}`);
              usersArray = response[key];
              break;
            }
          }
        }

        console.log('Processing users array:', usersArray);

        // Make sure usersArray contains valid data
        if (usersArray && usersArray.length > 0) {
          // Filter only internal staff users (not CANDIDATE)
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
          console.log('No users found or empty array');
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
    console.log(`Navigating to user detail page for UUID: ${uuid}`);
    navigate(`/admin/staff/${uuid}`);
  };

  // Open delete dialog
  const openDeleteDialog = (staff) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
  };

  // Close delete dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  // Show alert
  const showAlert = (message, severity = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // Close alert
  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
  };

  // Handle delete button click
  const handleDelete = async () => {
    try {
      await userService.deleteUser(staffToDelete.uuid);
      // Refresh the list after deletion
      setStaffList(staffList.filter(staff => staff.uuid !== staffToDelete.uuid));

      // Show success message using Material UI Alert
      showAlert(`Akun ${staffToDelete.name} berhasil dihapus!`, 'success');

      // Close the dialog
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Gagal menghapus akun. Silakan coba lagi nanti.', 'error');
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
          <TableContainer component={Box} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <TableHead
                sx={{
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'aliceblue'
                }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, borderTopLeftRadius: '16px', padding: '16px' }}>
                    Nama Staf
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, padding: '16px' }}>
                    Posisi Kerja
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, padding: '16px' }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, padding: '16px', textAlign: 'center' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, padding: '16px', textAlign: 'center', borderTopRightRadius: '16px' }}>
                    Aksi
                  </TableCell>
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
                      <TableCell sx={{
                        padding: '16px',
                        borderBottomLeftRadius: isLastRow ? '16px' : 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
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
                      <TableCell sx={{
                        padding: '16px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {getRoleName(staff.role)}
                      </TableCell>
                      <TableCell sx={{
                        padding: '16px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {staff.email}
                      </TableCell>
                      <TableCell sx={{ padding: '16px', textAlign: 'center' }}>
                        <Chip
                          label={staff.status ? "Aktif" : "Tidak Aktif"}
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
                            height: '28px',
                            minWidth: '100px',
                            padding: '0 12px',
                            display: 'inline-flex',
                            justifyContent: 'center'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{
                        padding: '16px',
                        textAlign: 'center',
                        borderBottomRightRadius: isLastRow ? '16px' : 0
                      }}>
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
                              onClick={() => openDeleteDialog(staff)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Hapus Akun</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus akun {staffToDelete?.name}? Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Batal</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert/Snackbar - Matching the CreateAccountPage style */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InternalStaffPage;