import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

// Define application steps
const steps = ['Administrasi', 'Wawancara', 'Technical Test', 'On Job'];

// Helper function to convert backend status to step index
const getActiveStep = (status) => {
  switch (status) {
    case 'PENDING':
    case 'REVIEWING':
    case 'REVISION':
      return 0; // Administrasi
    case 'INTERVIEW_SCHEDULED':
      return 1; // Wawancara
    case 'TECHNICAL_TEST':
      return 2; // Technical Test
    case 'ACCEPTED':
    case 'ON_JOB':
      return 3; // On Job
    case 'REJECTED':
      return -1; // Not in the step flow
    default:
      return 0;
  }
};

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
      return isDark ? 'rgba(255, 193, 7, 0.2)' : '#fff3e0'; // Orange
    case 'REVISION':
      return isDark ? 'rgba(33, 150, 243, 0.2)' : '#e3f2fd'; // Blue
    case 'INTERVIEW_SCHEDULED':
    case 'TECHNICAL_TEST':
      return isDark ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9'; // Green
    case 'REJECTED':
      return isDark ? 'rgba(244, 67, 54, 0.2)' : '#ffebee'; // Red
    case 'ACCEPTED':
    case 'ON_JOB':
      return isDark ? 'rgba(33, 150, 243, 0.2)' : '#e6f0ff'; // Blue/green
    default:
      return isDark ? 'rgba(66, 66, 66, 0.5)' : '#f5f5f5'; // Grey
  }
};

// Helper function to get border color for status
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

// Helper function to get text color for status
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

const PortalInformasi = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [statusHistory, setStatusHistory] = useState([]);
  const theme = useTheme();
  
  useEffect(() => {
    const fetchApplicationDetail = async () => {
      try {
        setLoading(true);
        const response = await jobApplicationService.getApplicationById(uuid);
        setApplication(response.data);
        setActiveStep(getActiveStep(response.data.status));
        
        // Create status history (dummy data - nanti akan diimplementasikan dari API)
        const history = [
          {
            id: 1, 
            date: response.data.submissionDate,
            status: 'PENDING',
            notes: 'Dokumen lamaran terkirim, menunggu verifikasi'
          }
        ];
        
        // Add additional status entries based on current status
        if (['REVIEWING', 'REVISION', 'INTERVIEW_SCHEDULED', 'TECHNICAL_TEST', 'REJECTED', 'ACCEPTED', 'ON_JOB'].includes(response.data.status)) {
          history.push({
            id: 2,
            date: new Date(new Date(response.data.submissionDate).getTime() + 86400000), // +1 day
            status: response.data.status === 'REVISION' ? 'REVISION' : 'REVIEWING',
            notes: response.data.status === 'REVISION' 
              ? 'Dokumen perlu perbaikan'
              : 'Dokumen sedang dalam proses review'
          });
        }
        
        if (['INTERVIEW_SCHEDULED', 'TECHNICAL_TEST', 'REJECTED', 'ACCEPTED', 'ON_JOB'].includes(response.data.status)) {
          history.push({
            id: 3,
            date: new Date(new Date(response.data.submissionDate).getTime() + 172800000), // +2 days
            status: 'INTERVIEW_SCHEDULED',
            notes: 'Jadwal wawancara telah ditentukan'
          });
        }
        
        if (['TECHNICAL_TEST', 'ACCEPTED', 'ON_JOB'].includes(response.data.status)) {
          history.push({
            id: 4,
            date: new Date(new Date(response.data.submissionDate).getTime() + 259200000), // +3 days
            status: 'TECHNICAL_TEST',
            notes: 'Technical test akan dilaksanakan'
          });
        }
        
        if (['ACCEPTED', 'ON_JOB'].includes(response.data.status)) {
          history.push({
            id: 5,
            date: new Date(new Date(response.data.submissionDate).getTime() + 345600000), // +4 days
            status: 'ACCEPTED',
            notes: 'Anda diterima sebagai karyawan'
          });
        }
        
        if (response.data.status === 'ON_JOB') {
          history.push({
            id: 6,
            date: new Date(new Date(response.data.submissionDate).getTime() + 432000000), // +5 days
            status: 'ON_JOB',
            notes: 'Anda aktif bekerja'
          });
        }
        
        if (response.data.status === 'REJECTED') {
          history.push({
            id: 3,
            date: new Date(new Date(response.data.submissionDate).getTime() + 172800000), // +2 days
            status: 'REJECTED',
            notes: 'Maaf, Anda tidak lolos ke tahap selanjutnya'
          });
        }
        
        setStatusHistory(history);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Gagal memuat detail lamaran. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };
    
    fetchApplicationDetail();
  }, [uuid]);
  
  const handleBackToList = () => {
    navigate('/candidate/portal-informasi');
  };
  
  // Fungsi untuk cek apakah tombol aksi harus bisa diklik
  const isActionEnabled = (status) => {
    if (status === 'PENDING') return true;
    if (status === 'REVISION' && application.status === 'REVISION') return true;
    if (status === 'INTERVIEW_SCHEDULED' && application.status === 'INTERVIEW_SCHEDULED') return true;
    if (status === 'TECHNICAL_TEST' && application.status === 'TECHNICAL_TEST') return true;
    if (status === 'ON_JOB' && application.status === 'ON_JOB') return true;
    return false;
  };
  
  const handleStatusAction = (status) => {
    // Action based on status
    switch (status) {
      case 'PENDING':
        navigate(`/candidate/portal-informasi/ringkasan-formulir/${uuid}`);
        break;
      case 'REVISION':
        navigate(`/candidate/portal-informasi/edit-formulir/${uuid}`);
        break;
      case 'INTERVIEW_SCHEDULED':
        navigate(`/candidate/portal-informasi/detail-wawancara/${uuid}`);
        break;
      case 'TECHNICAL_TEST':
        navigate(`/candidate/portal-informasi/detail-technical-test/${uuid}`);
        break;
      case 'ON_JOB':
        navigate(`/candidate/portal-informasi/detail-on-job/${uuid}`);
        break;
      default:
        // No specific action
        break;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, px: 2 }}>
        <Alert 
          severity="error"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : undefined,
            color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined,
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined
            }
          }}
        >
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToList}
          sx={{ 
            mt: 2,
            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined 
          }}
        >
          Kembali ke Daftar Lamaran
        </Button>
      </Box>
    );
  }

  if (!application) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, px: 2 }}>
        <Alert 
          severity="warning"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.15)' : undefined,
            color: theme.palette.mode === 'dark' ? theme.palette.warning.light : undefined,
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? theme.palette.warning.light : undefined
            }
          }}
        >
          Detail lamaran tidak ditemukan
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToList}
          sx={{ 
            mt: 2,
            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined 
          }}
        >
          Kembali ke Daftar Lamaran
        </Button>
      </Box>
    );
  }
  
  const isRejected = application.status === 'REJECTED';
  const isCompleted = ['ACCEPTED', 'ON_JOB'].includes(application.status);
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, px: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToList}
        sx={{ mb: 3 }}
      >
        Kembali ke Daftar Lamaran
      </Button>
      
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Detail Lamaran Pekerjaan
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          {application.jobPostingId?.jobPosition || 'Tidak tersedia'}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body1">
            <strong>Tanggal Aplikasi:</strong> {format(new Date(application.submissionDate), 'dd MMMM yyyy')}
          </Typography>
          <Box
            component="span"
            sx={{
              backgroundColor: getStatusColor(application.status, theme),
              border: `1px solid ${getStatusBorderColor(application.status, theme)}`,
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '0.9rem',
              color: getStatusTextColor(application.status, theme)
            }}
          >
            {getApplicationStatus(application.status)}
          </Box>
        </Box>
        
        {isRejected ? (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : undefined,
              color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined,
              '& .MuiAlert-icon': {
                color: theme.palette.mode === 'dark' ? theme.palette.error.light : undefined
              }
            }}
          >
            Maaf, lamaran Anda tidak lolos ke tahap selanjutnya. Tetap semangat untuk mencoba kesempatan lain!
          </Alert>
        ) : isCompleted ? (
          <Alert 
            severity="success" 
            sx={{ 
              mt: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : undefined,
              color: theme.palette.mode === 'dark' ? theme.palette.success.light : undefined,
              '& .MuiAlert-icon': {
                color: theme.palette.mode === 'dark' ? theme.palette.success.light : undefined
              }
            }}
          >
            Selamat! Anda diterima di PT. Biro Administrasi Sejahtera. Kami akan menghubungi Anda untuk langkah selanjutnya.
          </Alert>
        ) : null}
      </Paper>

      {!isRejected && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Progress Lamaran
          </Typography>
          
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            sx={{ 
              mb: 4,
              '& .MuiStepLabel-root .Mui-completed': {
                color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.main, // customize color for completed steps
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main, // customize color for active step
              },
              '& .MuiStepLabel-label': {
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary, // ensure label text is visible
              }
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ mt: 3 }}>
            <Typography 
              variant="body1" 
              fontWeight="bold"
              sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit' }}
            >
              Status Saat Ini: {getApplicationStatus(application.status)}
            </Typography>
            
            {application.status === 'PENDING' && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(66, 66, 66, 0.9)'  // Darker background for dark mode
                    : '#f9f9f9', 
                  borderRadius: 1, 
                  border: `1px solid ${theme.palette.mode === 'dark' 
                    ? theme.palette.primary.dark
                    : '#e0e0e0'}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? `0 0 8px rgba(0, 0, 0, 0.5)` 
                    : 'none',
                  color: theme.palette.mode === 'dark'
                    ? '#ffffff'
                    : 'inherit'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? theme.palette.primary.light 
                      : theme.palette.primary.main 
                  }}
                >
                  Dokumen Anda sedang menunggu verifikasi
                </Typography>
                <Typography 
                  variant="body2" 
                  paragraph
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? '#ffffff' 
                      : 'text.secondary' 
                  }}
                >
                  Anda dapat melihat detail dokumen yang telah diunggah dengan menekan tombol di bawah ini.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/candidate/portal-informasi/ringkasan-formulir/${uuid}`)}
                >
                  Lihat Detail Dokumen
                </Button>
              </Box>
            )}
            
            {application.status === 'REVISION' && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(66, 66, 66, 0.9)'
                    : '#f9f9f9', 
                  borderRadius: 1, 
                  border: `1px solid ${theme.palette.mode === 'dark' 
                    ? theme.palette.error.dark
                    : '#e0e0e0'}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? `0 0 8px rgba(0, 0, 0, 0.5)` 
                    : 'none',
                  color: theme.palette.mode === 'dark'
                    ? '#ffffff'
                    : 'inherit'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{ 
                    color: theme.palette.error.main
                  }}
                >
                  Perlu Perbaikan
                </Typography>
                <Typography 
                  variant="body2" 
                  paragraph
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? '#ffffff' 
                      : 'text.secondary' 
                  }}
                >
                  {application.notes || "Mohon lengkapi atau perbaiki dokumen lamaran Anda sesuai dengan permintaan tim rekrutmen."}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleStatusAction('REVISION')}
                >
                  Perbaiki Lamaran
                </Button>
              </Box>
            )}
            
            {application.status === 'INTERVIEW_SCHEDULED' && (
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => handleStatusAction(application.status)}
              >
                Lihat Jadwal Wawancara
              </Button>
            )}
            
            {application.status === 'TECHNICAL_TEST' && (
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => handleStatusAction(application.status)}
              >
                Mulai Technical Test
              </Button>
            )}
          </Box>
        </Paper>
      )}
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HistoryIcon sx={{ mr: 1, color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit' }} />
          <Typography variant="h6" fontWeight="bold">
            Riwayat Status
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit', fontWeight: 'bold' }}>Tanggal</TableCell>
                <TableCell sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit', fontWeight: 'bold' }}>Catatan</TableCell>
                <TableCell align="center" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit', fontWeight: 'bold' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statusHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit' }}>
                    {format(new Date(item.date), 'dd MMMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        backgroundColor: getStatusColor(item.status, theme),
                        border: `1px solid ${getStatusBorderColor(item.status, theme)}`,
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.85rem',
                        color: getStatusTextColor(item.status, theme)
                      }}
                    >
                      {getApplicationStatus(item.status)}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit' }}>
                    {item.notes}
                  </TableCell>
                  <TableCell align="center">
                    {item.status === 'PENDING' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleStatusAction(item.status)}
                        disabled={!isActionEnabled(item.status)}
                        sx={{
                          opacity: isActionEnabled(item.status) ? 1 : 0.5,
                        }}
                      >
                        Lihat Detail
                      </Button>
                    )}
                    {item.status === 'REVISION' && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleStatusAction(item.status)}
                        disabled={!isActionEnabled(item.status)}
                        sx={{
                          opacity: isActionEnabled(item.status) ? 1 : 0.5,
                        }}
                      >
                        Perbaiki Lamaran
                      </Button>
                    )}
                    {item.status === 'INTERVIEW_SCHEDULED' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleStatusAction(item.status)}
                        disabled={!isActionEnabled(item.status)}
                        sx={{
                          opacity: isActionEnabled(item.status) ? 1 : 0.5,
                        }}
                      >
                        Lihat Jadwal
                      </Button>
                    )}
                    {item.status === 'TECHNICAL_TEST' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleStatusAction(item.status)}
                        disabled={!isActionEnabled(item.status)}
                        sx={{
                          opacity: isActionEnabled(item.status) ? 1 : 0.5,
                        }}
                      >
                        Lihat Test
                      </Button>
                    )}
                    {item.status === 'ON_JOB' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleStatusAction(item.status)}
                        disabled={!isActionEnabled(item.status)}
                        sx={{
                          opacity: isActionEnabled(item.status) ? 1 : 0.5,
                        }}
                      >
                        Info Karyawan
                      </Button>
                    )}
                    {(item.status === 'REVIEWING' || item.status === 'REJECTED' || item.status === 'ACCEPTED') && (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled
                        sx={{ opacity: 0.5 }}
                      >
                        Tidak Ada Aksi
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PortalInformasi;
