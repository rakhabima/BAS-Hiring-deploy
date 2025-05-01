import {
    CheckCircle as CheckCircleIcon,
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
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

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
    'Wawancara': { color: '#1565C0', icon: <VideoCallIcon sx={{ fontSize: 32, color: 'white' }} /> },
    'Technical Test': { color: '#0D47A1', icon: <QuizIcon sx={{ fontSize: 32, color: 'white' }} /> },
    'Diterima': { color: '#2E7D32', icon: <CheckCircleIcon sx={{ fontSize: 32, color: 'white' }} /> }
};

const CandidatesPage = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [positionFilter, setPositionFilter] = useState('all');
    const [stats, setStats] = useState({
        pending: 0,
        interview: 0,
        technicalTest: 0,
        accepted: 0
    });

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

    // Fetch all applications
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const response = await jobApplicationService.getAllApplications();
                if (response && response.data) {
                    setApplications(response.data);
                    setFilteredApplications(response.data);

                    // Extract unique positions from data
                    const uniquePositions = [...new Set(response.data.map(app =>
                        app.jobPostingId?.jobPosition || app.posisi_dilamar
                    ))].filter(Boolean);

                    // Update position options
                    setPositionOptions([
                        { value: 'all', label: 'Semua Posisi' },
                        ...uniquePositions.map(pos => ({ value: pos, label: pos }))
                    ]);

                    calculateStats(response.data);
                } else {
                    setApplications([]);
                    setFilteredApplications([]);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching applications:', err);
                setError('Gagal memuat data lamaran. Silakan coba lagi.');
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    // Calculate statistics
    const calculateStats = (data) => {
        const newStats = {
            pending: 0,
            interview: 0,
            technicalTest: 0,
            accepted: 0
        };

        data.forEach(app => {
            if (app.status === 'PENDING' || app.status === 'REVIEWING' || app.status === 'REVISION') {
                newStats.pending++;
            } else if (app.status === 'INTERVIEW_SCHEDULED') {
                newStats.interview++;
            } else if (app.status === 'TECHNICAL_TEST') {
                newStats.technicalTest++;
            } else if (app.status === 'ACCEPTED' || app.status === 'ON_JOB') {
                newStats.accepted++;
            }
        });

        setStats(newStats);
    };

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

    // Filter applications based on search and filters
    useEffect(() => {
        let result = [...applications];

        // Apply search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(app =>
                (app.candidateInfo?.name || '').toLowerCase().includes(search) ||
                (app.candidateInfo?.email || '').toLowerCase().includes(search) ||
                (app.nama_ktp || '').toLowerCase().includes(search)
            );
        }

        // Apply stage filter
        if (stageFilter !== 'all') {
            result = result.filter(app => getStageFromStatus(app.status) === stageFilter);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(app => app.status === statusFilter);
        }

        // Apply position filter
        if (positionFilter !== 'all') {
            result = result.filter(app =>
                (app.jobPostingId?.jobPosition || app.posisi_dilamar) === positionFilter
            );
        }

        setFilteredApplications(result);
    }, [applications, searchTerm, stageFilter, statusFilter, positionFilter]);

    // View application details
    const handleViewApplication = (appId, status) => {
        // Different routing based on application status
        if (status === 'INTERVIEW_SCHEDULED') {
            navigate(`/recruiter/candidate-interview/${appId}`);
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
                            background: `linear-gradient(135deg, ${stageInfo['Administrasi'].color} 0%, ${stageInfo['Administrasi'].color}DD 100%)`
                        }}
                    >
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
                            background: `linear-gradient(135deg, ${stageInfo['Wawancara'].color} 0%, ${stageInfo['Wawancara'].color}DD 100%)`
                        }}
                    >
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
                            background: `linear-gradient(135deg, ${stageInfo['Technical Test'].color} 0%, ${stageInfo['Technical Test'].color}DD 100%)`
                        }}
                    >
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
                            background: `linear-gradient(135deg, ${stageInfo['Diterima'].color} 0%, ${stageInfo['Diterima'].color}DD 100%)`
                        }}
                    >
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

            {/* Search and Filters */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Cari Nama Kandidat"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            onChange={(e) => setStageFilter(e.target.value)}
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
                            onChange={(e) => setPositionFilter(e.target.value)}
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
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={4} md={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: { xs: 2, md: 0 } }}
                        >
                            Cari
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Applications Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell><Typography fontWeight="bold">Nama</Typography></TableCell>
                                <TableCell><Typography fontWeight="bold">Tahapan</Typography></TableCell>
                                <TableCell><Typography fontWeight="bold">Posisi Kerja</Typography></TableCell>
                                <TableCell><Typography fontWeight="bold">Tanggal Aplikasi</Typography></TableCell>
                                <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                                <TableCell align="center"><Typography fontWeight="bold">Aksi</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredApplications.length > 0 ? (
                                filteredApplications.map((app) => (
                                    <TableRow key={app.uuid} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        bgcolor: '#e0e0e0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2
                                                    }}
                                                >
                                                    <Typography>
                                                        {(app.candidateInfo?.name || app.nama_ktp || 'U').charAt(0).toUpperCase()}
                                                    </Typography>
                                                </Box>
                                                <Typography>{app.candidateInfo?.name || app.nama_ktp || 'Unknown'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography>{getStageFromStatus(app.status)}</Typography>
                                        </TableCell>
                                        <TableCell>{app.jobPostingId?.jobPosition || app.posisi_dilamar || '-'}</TableCell>
                                        <TableCell>{formatDate(app.submissionDate)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(app.status)}
                                                color={
                                                    app.status === 'ACCEPTED' || app.status === 'ON_JOB' ? 'success' :
                                                        app.status === 'REJECTED' ? 'error' :
                                                            app.status === 'REVISION' ? 'warning' :
                                                                'primary'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleViewApplication(app.uuid, app.status)}
                                                sx={{ borderRadius: 4 }}
                                            >
                                                Lihat
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body1" sx={{ py: 2 }}>
                                            Tidak ada data aplikasi
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
};

export default CandidatesPage; 