import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Divider,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    IconButton,
    useTheme,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import { userService } from '../../services/api';

const UserDetailPage = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        status: true
    });
    const [saving, setSaving] = useState(false);

    // State for alert/snackbar
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success'); // 'success' or 'error'

    // Determine if we're in dark mode
    const isDarkMode = theme.palette.mode === 'dark';

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                const response = await userService.getUserByUUID(uuid);
                console.log('User details:', response);

                // Handle different response structures
                if (response && response.data) {
                    setUser(response.data);
                    setFormData({
                        name: response.data.name || '',
                        email: response.data.email || '',
                        role: response.data.role || '',
                        status: response.data.status !== undefined ? response.data.status : true
                    });
                } else if (response && response.uuid) {
                    setUser(response);
                    setFormData({
                        name: response.name || '',
                        email: response.email || '',
                        role: response.role || '',
                        status: response.status !== undefined ? response.status : true
                    });
                } else {
                    console.error('Unexpected user data structure:', response);
                    setError('Format data tidak sesuai dengan yang diharapkan');
                }
            } catch (err) {
                console.error('Error fetching user details:', err);
                setError('Gagal memuat detail pengguna. Silakan coba lagi nanti.');
            } finally {
                setLoading(false);
            }
        };

        if (uuid) {
            fetchUserDetails();
        }
    }, [uuid]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleStatusChange = (e) => {
        setFormData({
            ...formData,
            status: e.target.value === 'true'
        });
    };

    const toggleEditMode = () => {
        if (editMode) {
            // Reset form data to original values if canceling edit
            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || '',
                status: user.status
            });
        }
        setEditMode(!editMode);
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedUser = await userService.updateUser(user.uuid, formData);
            console.log('User updated:', updatedUser);

            // Update the local user state with new data
            setUser({
                ...user,
                ...formData
            });

            setEditMode(false);

            // Show success message
            showAlert(`Akun ${formData.name} berhasil diperbarui!`, 'success');
        } catch (error) {
            console.error('Error updating user:', error);

            // Show error message
            showAlert('Gagal memperbarui akun. Silakan coba lagi nanti.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await userService.deleteUser(user.uuid);

            // Show success message
            showAlert(`Akun ${user.name} berhasil dihapus!`, 'success');

            // Navigate after a short delay to allow the user to see the success message
            setTimeout(() => {
                navigate('/admin/internal-staff', { replace: true });
            }, 1500);
        } catch (error) {
            console.error('Error deleting user:', error);

            // Show error message
            showAlert('Gagal menghapus akun. Silakan coba lagi nanti.', 'error');

            // Close the dialog
            closeDeleteDialog();
        }
    };

    const openDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    const getRoleName = (role) => {
        switch (role) {
            case 'RECRUITER': return 'Recruiter';
            case 'GENERAL_MANAGER': return 'General Manager';
            case 'KOORDINATOR_LAPANGAN': return 'Koordinator Lapangan';
            case 'KARYAWAN': return 'Karyawan';
            default: return role;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'RECRUITER': return theme.palette.info.main;
            case 'GENERAL_MANAGER': return theme.palette.success.main;
            case 'KOORDINATOR_LAPANGAN': return theme.palette.warning.main;
            default: return theme.palette.primary.main;
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleGoBack}
                    sx={{ mb: 2 }}
                >
                    Kembali
                </Button>
                <Typography variant="h4" component="h1" gutterBottom>
                    {editMode ? 'Edit Akun' : 'Detail Staf'}
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2 }}>Memuat data...</Typography>
                </Box>
            ) : error ? (
                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '200px',
                    }}
                >
                    <Typography variant="body1" color="error">{error}</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGoBack}
                        sx={{ mt: 2 }}
                    >
                        Kembali ke Daftar Staf
                    </Button>
                </Paper>
            ) : user ? (
                editMode ? (
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" component="h2" mb={3}>
                                Detail Akun
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Nama"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Posisi Kerja</InputLabel>
                                        <Select
                                            value={formData.role}
                                            name="role"
                                            label="Posisi Kerja"
                                            onChange={handleInputChange}
                                        >
                                            <MenuItem value="RECRUITER">Recruiter</MenuItem>
                                            <MenuItem value="GENERAL_MANAGER">General Manager</MenuItem>
                                            <MenuItem value="KOORDINATOR_LAPANGAN">Koordinator Lapangan</MenuItem>
                                            <MenuItem value="KARYAWAN">Karyawan</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={formData.status.toString()}
                                            name="status"
                                            label="Status"
                                            onChange={handleStatusChange}
                                        >
                                            <MenuItem value="true">Aktif</MenuItem>
                                            <MenuItem value="false">Tidak Aktif</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Button
                                    variant="outlined"
                                    onClick={toggleEditMode}
                                    sx={{ mr: 2 }}
                                    disabled={saving}
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                >
                                    Simpan
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ) : (
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                                        {user.name}
                                    </Typography>
                                    <Chip
                                        label={getRoleName(user.role)}
                                        sx={{
                                            bgcolor: getRoleColor(user.role),
                                            color: 'white',
                                            mt: 1
                                        }}
                                    />
                                </Box>
                                <Box sx={{ ml: 'auto' }}>
                                    <IconButton
                                        color="primary"
                                        onClick={toggleEditMode}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={openDeleteDialog}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {user.email}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Status
                                    </Typography>
                                    <Chip
                                        label={user.status ? "Aktif" : "Tidak Aktif"}
                                        color={user.status ? "success" : "error"}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )
            ) : (
                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '200px',
                    }}
                >
                    <Typography variant="body1">
                        Pengguna tidak ditemukan
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGoBack}
                        sx={{ mt: 2 }}
                    >
                        Kembali ke Daftar Staf
                    </Button>
                </Paper>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={closeDeleteDialog}
            >
                <DialogTitle>Hapus Akun</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Apakah Anda yakin ingin menghapus akun {user?.name}? Tindakan ini tidak dapat dibatalkan.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDialog}>Batal</Button>
                    <Button onClick={handleDelete} color="error" autoFocus>
                        Hapus
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alert/Snackbar */}
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

export default UserDetailPage;