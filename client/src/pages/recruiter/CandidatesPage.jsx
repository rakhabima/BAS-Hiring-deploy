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
    Typography,
    useTheme
} from '@mui/material';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip
} from 'chart.js';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
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
    const [timePeriod, setTimePeriod] = useState('week'); // 'week', 'month', 'year'
    const [activeCard, setActiveCard] = useState(null); // Track which card is active
    const [stats, setStats] = useState({
        pending: 0,
        interview: 0,
        technicalTest: 0,
        accepted: 0,
        rejected: 0
    });
    const [chartData, setChartData] = useState({
        statusDistribution: {
            labels: [],
            datasets: []
        },
        applicationTrends: {
            labels: [],
            datasets: []
        }
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
                    prepareChartData(response.data, timePeriod);
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

    // Update chart data when time period changes
    useEffect(() => {
        if (applications.length > 0) {
            prepareChartData(applications, timePeriod);
        }
    }, [timePeriod, applications]);

    // Calculate statistics
    const calculateStats = (data) => {
        const newStats = {
            pending: 0,
            interview: 0,
            technicalTest: 0,
            accepted: 0,
            rejected: 0
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
            } else if (app.status === 'REJECTED') {
                newStats.rejected++;
            }
        });

        setStats(newStats);
    };

    // Prepare data for charts
    const prepareChartData = (data, period = 'week') => {
        // Status distribution for pie chart
        const statusCounts = {
            'Menunggu Verifikasi': 0,
            'Sedang Ditinjau': 0,
            'Perlu Revisi': 0,
            'Wawancara': 0,
            'Technical Test': 0,
            'Ditolak': 0,
            'Diterima': 0,
            'Aktif Bekerja': 0
        };

        // Get date range based on period
        const today = new Date();
        const startDate = new Date(today);

        // Filter data by time period
        let filteredData = [...data];
        let timeLabels = [];

        if (period === 'week') {
            // Last 4 weeks
            startDate.setDate(today.getDate() - 28);
            timeLabels = ['Minggu 4', 'Minggu 3', 'Minggu 2', 'Minggu 1'];
        } else if (period === 'month') {
            // Last 6 months
            startDate.setMonth(today.getMonth() - 6);

            // Create month labels for past 6 months
            timeLabels = [];
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(today);
                monthDate.setMonth(today.getMonth() - i);
                timeLabels.push(monthDate.toLocaleString('id-ID', { month: 'long' }));
            }
        } else if (period === 'year') {
            // Last 2 years
            startDate.setFullYear(today.getFullYear() - 2);

            // Create year labels
            const currentYear = today.getFullYear();
            timeLabels = [
                (currentYear - 1).toString(),
                currentYear.toString()
            ];
        }

        // Filter data to selected time period
        filteredData = data.filter(app => {
            const submissionDate = new Date(app.submissionDate);
            return submissionDate >= startDate;
        });

        // Calculate status distribution
        filteredData.forEach(app => {
            const statusLabel = getStatusLabel(app.status);
            statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
        });

        // Prepare time-based data
        const timeData = {};
        timeLabels.forEach(label => {
            timeData[label] = 0;
        });

        // Group applications by time period
        filteredData.forEach(app => {
            const submissionDate = new Date(app.submissionDate);

            if (period === 'week') {
                const daysAgo = Math.floor((today - submissionDate) / (1000 * 60 * 60 * 24));

                if (daysAgo <= 7) {
                    timeData['Minggu 1']++;
                } else if (daysAgo <= 14) {
                    timeData['Minggu 2']++;
                } else if (daysAgo <= 21) {
                    timeData['Minggu 3']++;
                } else if (daysAgo <= 28) {
                    timeData['Minggu 4']++;
                }
            } else if (period === 'month') {
                const submissionMonth = submissionDate.toLocaleString('id-ID', { month: 'long' });
                if (timeLabels.includes(submissionMonth)) {
                    timeData[submissionMonth]++;
                }
            } else if (period === 'year') {
                const submissionYear = submissionDate.getFullYear().toString();
                if (timeLabels.includes(submissionYear)) {
                    timeData[submissionYear]++;
                }
            }
        });

        // Configure chart data
        setChartData({
            statusDistribution: {
                labels: Object.keys(statusCounts).filter(key => statusCounts[key] > 0),
                datasets: [
                    {
                        data: Object.values(statusCounts).filter(count => count > 0),
                        backgroundColor: [
                            '#FFA726', // Orange - Menunggu Verifikasi
                            '#42A5F5', // Blue - Sedang Ditinjau
                            '#7E57C2', // Purple - Perlu Revisi
                            '#26A69A', // Teal - Wawancara
                            '#66BB6A', // Green - Technical Test
                            '#EF5350', // Red - Ditolak
                            '#5C6BC0', // Indigo - Diterima
                            '#2E7D32'  // Dark Green - Aktif Bekerja
                        ],
                        borderWidth: 1,
                        borderColor: theme.palette.mode === 'dark' ? '#333' : '#fff'
                    }
                ]
            },
            applicationTrends: {
                labels: period === 'week' ? timeLabels.reverse() : timeLabels,
                datasets: [
                    {
                        label: 'Jumlah Lamaran',
                        data: period === 'week'
                            ? Object.values(timeData).reverse()
                            : timeLabels.map(label => timeData[label]),
                        backgroundColor: theme.palette.primary.main,
                        borderColor: theme.palette.primary.dark,
                        borderWidth: 1
                    }
                ]
            }
        });
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

        // Apply stage filter (from dropdown or card)
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

    // Handle card click to filter applications by stage
    const handleCardClick = (stage) => {
        // If clicking the already active card, clear the filter
        if (activeCard === stage) {
            setActiveCard(null);
            setStageFilter('all');
        } else {
            // Otherwise, set the filter to the clicked card
            setActiveCard(stage);
            setStageFilter(stage);

            // Also reset any existing status filter
            setStatusFilter('all');
        }

        // Scroll to the table
        document.getElementById('applications-table')?.scrollIntoView({ behavior: 'smooth' });
    };

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

    // Handle time period change
    const handleTimePeriodChange = (event) => {
        setTimePeriod(event.target.value);
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
                            {chartData.statusDistribution.labels.length > 0 ? (
                                <Pie
                                    data={chartData.statusDistribution}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: {
                                                    color: theme.palette.text.primary,
                                                    font: {
                                                        size: 11
                                                    },
                                                    padding: 15
                                                }
                                            },
                                            tooltip: {
                                                bodyFont: {
                                                    size: 13
                                                },
                                                titleFont: {
                                                    size: 13
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Tidak ada data
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary }}>
                            {timePeriod === 'week' ? 'Tren Lamaran Mingguan' :
                                timePeriod === 'month' ? 'Tren Lamaran Bulanan' :
                                    'Tren Lamaran Tahunan'}
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            {chartData.applicationTrends.labels.length > 0 ? (
                                <Bar
                                    data={chartData.applicationTrends}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    color: theme.palette.text.secondary
                                                },
                                                grid: {
                                                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                }
                                            },
                                            x: {
                                                ticks: {
                                                    color: theme.palette.text.secondary
                                                },
                                                grid: {
                                                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                }
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                display: false
                                            },
                                            tooltip: {
                                                bodyFont: {
                                                    size: 13
                                                },
                                                titleFont: {
                                                    size: 13
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Tidak ada data
                                </Typography>
                            )}
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
                            onChange={(e) => {
                                setStageFilter(e.target.value);
                                setActiveCard(e.target.value === 'all' ? null : e.target.value);
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

                    <Grid item xs={12} sm={4} md={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: { xs: 2, md: 0 } }}
                            onClick={() => {
                                // Reset all filters
                                setSearchTerm('');
                                setStageFilter('all');
                                setStatusFilter('all');
                                setPositionFilter('all');
                                setActiveCard(null);
                            }}
                        >
                            Reset
                        </Button>
                    </Grid>
                </Grid>

                {activeCard && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="body2" color="primary">
                            Menampilkan kandidat di Tahap {activeCard} ({filteredApplications.length} kandidat)
                            <Button
                                size="small"
                                onClick={() => {
                                    setStageFilter('all');
                                    setActiveCard(null);
                                }}
                                sx={{ ml: 1 }}
                            >
                                Hapus Filter
                            </Button>
                        </Typography>
                    </Box>
                )}
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
                    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow
                                    sx={{
                                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f5f5f5',
                                    }}
                                >
                                    <TableCell>
                                        <Typography fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                            Nama
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                            Tahapan
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                            Posisi Kerja
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                            Tanggal Aplikasi
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                            Status
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                            Aksi
                                        </Typography>
                                    </TableCell>
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
                                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            mr: 2
                                                        }}
                                                    >
                                                        <Typography sx={{ color: theme.palette.text.primary }}>
                                                            {(app.candidateInfo?.name || app.nama_ktp || 'U').charAt(0).toUpperCase()}
                                                        </Typography>
                                                    </Box>
                                                    <Typography sx={{ color: theme.palette.text.primary }}>
                                                        {app.candidateInfo?.name || app.nama_ktp || 'Unknown'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ color: theme.palette.text.primary }}>
                                                    {getStageFromStatus(app.status)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>
                                                {app.jobPostingId?.jobPosition || app.posisi_dilamar || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>
                                                {formatDate(app.submissionDate)}
                                            </TableCell>
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
                                                    sx={{
                                                        fontWeight: 500,
                                                        // Custom styling for better readability in both light and dark mode
                                                        ...(theme.palette.mode === 'dark' && {
                                                            // In dark mode, use custom colors with better contrast
                                                            backgroundColor:
                                                                app.status === 'ACCEPTED' || app.status === 'ON_JOB' ? '#81c784' :
                                                                    app.status === 'REJECTED' ? '#f48fb1' :
                                                                        app.status === 'REVISION' ? '#ffcc80' :
                                                                            '#90caf9',
                                                            '& .MuiChip-label': {
                                                                color:
                                                                    app.status === 'ACCEPTED' || app.status === 'ON_JOB' ? '#1b5e20' :
                                                                        app.status === 'REJECTED' ? '#880e4f' :
                                                                            app.status === 'REVISION' ? '#e65100' :
                                                                                '#0d47a1'
                                                            }
                                                        }),
                                                        // Special handling for warning color in light mode
                                                        ...(theme.palette.mode === 'light' && app.status === 'REVISION' && {
                                                            '& .MuiChip-label': {
                                                                color: '#5f2800'
                                                            }
                                                        })
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleViewApplication(app.uuid, app.status)}
                                                    sx={{
                                                        borderRadius: 4,
                                                        color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                                                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                                                    }}
                                                >
                                                    Lihat
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography variant="body1" sx={{ py: 2, color: theme.palette.text.primary }}>
                                                Tidak ada data aplikasi
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </div>
        </Container>
    );
};

export default CandidatesPage; 