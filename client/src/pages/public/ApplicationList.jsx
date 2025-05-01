import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkIcon from '@mui/icons-material/Work';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

// Helper function to convert backend status to UI status
const getApplicationStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return 'Menunggu Verifikasi';
    case 'REVIEWING':
      return 'Sedang Ditinjau';
    case 'REVISION':
      return 'Perlu Revisi';
    case 'INTERVIEW_SCHEDULED':
      return 'Jadwal Wawancara';
    case 'TECHNICAL_TEST':
      return 'Menunggu Pelaksanaan';
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

// Helper function to get status color
const getStatusColor = (status, theme) => {
  const isDark = theme.palette.mode === 'dark';

  switch (status) {
    case 'PENDING':
    case 'REVIEWING':
      return isDark ? 'rgba(255, 193, 7, 0.2)' : '#fff3e0'; // Light orange
    case 'REVISION':
      return isDark ? 'rgba(33, 150, 243, 0.2)' : '#e3f2fd'; // Light blue
    case 'INTERVIEW_SCHEDULED':
    case 'TECHNICAL_TEST':
      return isDark ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9'; // Light green
    case 'REJECTED':
      return isDark ? 'rgba(244, 67, 54, 0.2)' : '#ffebee'; // Light red
    case 'ACCEPTED':
    case 'ON_JOB':
      return isDark ? 'rgba(33, 150, 243, 0.2)' : '#e6f0ff'; // Light blue/green
    default:
      return isDark ? 'rgba(66, 66, 66, 0.5)' : '#f5f5f5'; // Grey
  }
};

// Helper function to get status border color
const getStatusBorderColor = (status, theme) => {
  const isDark = theme.palette.mode === 'dark';

  switch (status) {
    case 'REJECTED':
      return isDark ? theme.palette.error.main : '#ef5350';
    case 'ACCEPTED':
    case 'ON_JOB':
      return isDark ? theme.palette.success.main : '#26a69a';
    default:
      return isDark ? theme.palette.warning.main : '#ff9800';
  }
};

// Helper function to get status text color
const getStatusTextColor = (status, theme) => {
  const isDark = theme.palette.mode === 'dark';

  switch (status) {
    case 'PENDING':
    case 'REVIEWING':
      return isDark ? theme.palette.warning.light : theme.palette.warning.dark;
    case 'REVISION':
      return isDark ? theme.palette.info.light : theme.palette.info.dark;
    case 'INTERVIEW_SCHEDULED':
    case 'TECHNICAL_TEST':
      return isDark ? theme.palette.success.light : theme.palette.success.dark;
    case 'REJECTED':
      return isDark ? theme.palette.error.light : theme.palette.error.dark;
    case 'ACCEPTED':
    case 'ON_JOB':
      return isDark ? theme.palette.primary.light : theme.palette.primary.dark;
    default:
      return isDark ? theme.palette.text.primary : theme.palette.text.secondary;
  }
};

const ApplicationList = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await jobApplicationService.getCandidateApplications();
        setApplications(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Gagal memuat daftar lamaran. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleViewDetail = (applicationId) => {
    navigate(`/candidate/portal-informasi/${applicationId}`);
  };

  const handleApplyNewJob = () => {
    navigate('/lowongan');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, px: 2 }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        mb={3}
        sx={{
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
        }}
      >
        Daftar Lamaran Saya
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : undefined,
            color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined,
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined
            }
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyNewJob}
          startIcon={<WorkIcon />}
        >
          Lamar Pekerjaan Baru
        </Button>
      </Box>

      {applications.length === 0 && !error ? (
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : undefined,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <AssignmentIcon sx={{
              fontSize: 80,
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'text.secondary',
              opacity: 0.7,
              mb: 2
            }} />
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
              }}
            >
              Anda belum memiliki lamaran pekerjaan
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'text.secondary',
                maxWidth: '600px'
              }}
            >
              Silakan lihat daftar lowongan yang tersedia dan mulai melamar untuk melihat progres lamaran Anda di halaman ini
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleApplyNewJob}
              startIcon={<WorkIcon />}
            >
              Lihat Lowongan
            </Button>
          </Box>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : undefined,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{
                  color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
                  fontWeight: 'bold'
                }}>
                  Posisi
                </TableCell>
                <TableCell sx={{
                  color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
                  fontWeight: 'bold'
                }}>
                  Tanggal
                </TableCell>
                <TableCell sx={{
                  color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
                  fontWeight: 'bold'
                }}>
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
                    fontWeight: 'bold'
                  }}
                >
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.uuid}>
                  <TableCell sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>
                    {application.jobPostingId?.jobPosition || 'Tidak tersedia'}
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}>
                    {format(new Date(application.submissionDate), 'dd MMMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        backgroundColor: getStatusColor(application.status, theme),
                        border: `1px solid ${getStatusBorderColor(application.status, theme)}`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.85rem',
                        color: getStatusTextColor(application.status, theme)
                      }}
                    >
                      {getApplicationStatus(application.status)}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetail(application.uuid)}
                      sx={{
                        color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
                        '&:hover': {
                          borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined,
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : undefined
                        }
                      }}
                    >
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ApplicationList; 