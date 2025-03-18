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
    useTheme
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { userService } from '../../services/api';

const UserDetailPage = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                const response = await userService.getUserByUUID(uuid);
                console.log('User details:', response);

                // Handle different response structures
                if (response && response.data) {
                    setUser(response.data);
                } else if (response && response.uuid) {
                    setUser(response);
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
                    Detail Staf
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
                <Card elevation={3}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h5" component="h2" sx={{ ml: 1}}>
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
                                    onClick={() => navigate(`/admin/staff/edit/${user.uuid}`)}
                                    sx={{ mr: 1 }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    color="error"
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
        </Container>
    );
};

export default UserDetailPage;