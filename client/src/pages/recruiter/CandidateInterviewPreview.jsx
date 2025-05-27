import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    Paper,
    Step,
    StepLabel,
    Stepper,
    Typography,
    useTheme
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { interviewService, jobApplicationService } from '../../services/api';

// Steps for the progress bar
const steps = ['Administrasi', 'Wawancara', 'Technical Test', 'On Job'];

const CandidateInterviewPreview = () => {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [interview, setInterview] = useState(null);
  const theme = useTheme(); 

  // Set to Wawancara stage (index 1)
  const activeStep = 1;

  useEffect(() => {
    const fetchData = async () => {
      if (!candidateId) {
        navigate('/recruiter/dashboard');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch application data
        const appResponse = await jobApplicationService.getApplicationById(candidateId);
        if (appResponse && appResponse.data) {
          setApplication(appResponse.data);
        } else {
          throw new Error('Failed to fetch application data');
        }
        
        // Fetch interview data
        try {
          const interviewResponse = await interviewService.getInterviewByApplicationId(candidateId);
          if (interviewResponse && interviewResponse.data) {
            setInterview(interviewResponse.data);
          }
        } catch (interviewError) {
          // This is expected if no interview has been scheduled yet
          console.log('No interview found for this application');
          // Not a fatal error, as the UI will show a button to schedule an interview
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Gagal memuat data. Silakan coba lagi.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [candidateId, navigate]);

  const handleScheduleInterview = () => {
    navigate(`/recruiter/candidate-interview/${candidateId}`);
  };

  const handleEditSchedule = () => {
    navigate(`/recruiter/candidate-interview/${candidateId}`);
  };

  const handleBackToCandidates = () => {
    navigate('/recruiter/dashboard');
  };

  const handleViewCalendar = () => {
    navigate('/recruiter/scheduling');
  };

  const handleProceedToTechnicalTest = async () => {
    try {
      // Update application status to TECHNICAL_TEST
      await jobApplicationService.updateApplicationStatus(candidateId, {
        status: 'TECHNICAL_TEST',
        notes: 'Kandidat telah menyelesaikan tahap wawancara'
      });
      
      window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
        detail: { message: 'Status berhasil diperbarui ke Technical Test', severity: 'success' }
      }));
      
      // Navigate to technical test preview
      navigate(`/recruiter/technical-test-preview/${candidateId}`);
    } catch (error) {
      console.error('Error updating status:', error);
      window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
        detail: { message: 'Gagal memperbarui status', severity: 'error' }
      }));
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'HH.mm') + ' WIB';
    } catch (error) {
      return '';
    }
  };

  // Add a helper function to parse and format the reschedule request
  const formatRescheduleRequest = (rescheduleRequestJson) => {
    try {
      const rescheduleInfo = JSON.parse(rescheduleRequestJson);
      
      let result = '';
      
      // Format the preferred date if available
      if (rescheduleInfo.date) {
        const preferredDate = new Date(rescheduleInfo.date);
        result += `Tanggal yang diusulkan: ${format(preferredDate, 'dd MMMM yyyy')}`;
      }
      
      // Add the reason if available
      if (rescheduleInfo.reason) {
        if (result) result += '\n';
        result += `Alasan: ${rescheduleInfo.reason}`;
      }
      
      return result || rescheduleRequestJson; // Fall back to original if no fields found
    } catch (error) {
      // If parsing fails, return the original string
      return rescheduleRequestJson;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="contained" onClick={handleBackToCandidates}>
          Kembali ke Daftar Kandidat
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Progress Stepper */}
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Detail Wawancara Kandidat
        </Typography>
        
        {/* Candidate Info Card */}
        <Paper elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#182f5d', color: 'white', p: 2 }}>
            <Grid container>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" fontWeight="bold">
                  {application?.candidateInfo?.name || application?.nama_ktp || 'Nama Kandidat'}
                </Typography>
                <Typography variant="body2">
                  {application?.jobPostingId?.jobPosition || application?.posisi_dilamar || 'Posisi'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 1, md: 0 } }}>
                <Chip 
                  label={application?.status === 'INTERVIEW_SCHEDULED' ? 'Wawancara' : application?.status} 
                  color="primary" 
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Grid>
            </Grid>
          </Box>
          
          <Box p={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body2" gutterBottom>
                  {application?.email || application?.candidateInfo?.email || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Nomor Telepon</Typography>
                <Typography variant="body2" gutterBottom>
                  {application?.no_hp || application?.candidateInfo?.phone || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        {/* Interview Schedule Card */}
        {interview ? (
          <Paper elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
            <Box p={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Jadwal Wawancara
                </Typography>
                <Box>
                  <Button 
                    startIcon={<CalendarMonthIcon />} 
                    onClick={handleViewCalendar}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Cek Jadwal/Kalender
                  </Button>
                  <Button 
                    startIcon={<EditIcon />} 
                    onClick={handleEditSchedule}
                    size="small"
                  >
                    Edit
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">Tanggal</Typography>
                      <Typography variant="body2">{formatDateTime(interview.interviewDate)}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">Waktu</Typography>
                      <Typography variant="body2">{formatTimeOnly(interview.interviewDate)}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocationOnIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {interview.isOnline ? 'Link Meeting' : 'Lokasi'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: 'break-all',
                          overflowWrap: 'break-word',
                          lineHeight: 1.4
                        }}
                      >
                        {interview.isOnline ? (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              textDecoration: 'underline',
                              wordBreak: 'break-all',
                              color: theme.palette.primary.main,
                            }}
                          >
                            {interview.meetingLink}
                          </a>
                        ) : (
                          interview.location || '-'
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              {interview.candidateResponse && (
                <Box sx={{ mt: 3 }}>
                  <Alert 
                    severity={interview.candidateAttendance === 'hadir' ? 'success' : 'warning'}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      Konfirmasi Kehadiran: {interview.candidateAttendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                    </Typography>
                  </Alert>
                  
                  {interview.candidateAttendance !== 'hadir' && interview.rescheduleRequest && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5', 
                      borderRadius: 1 
                    }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        Permintaan Penjadwalan Ulang:
                      </Typography>
                      
                      {(() => {
                        try {
                          const rescheduleInfo = JSON.parse(interview.rescheduleRequest);
                          return (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              {rescheduleInfo.date && (
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <EventIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">Tanggal yang Diusulkan</Typography>
                                      <Typography variant="body2">
                                        {format(new Date(rescheduleInfo.date), 'dd MMMM yyyy')}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              )}
                              
                              {rescheduleInfo.reason && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" fontWeight="bold">Alasan:</Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mt: 0.5, 
                                      p: 1, 
                                      bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'white', 
                                      borderRadius: 1,
                                      border: theme => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
                                    }}
                                  >
                                    {rescheduleInfo.reason}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          );
                        } catch (error) {
                          // Fall back to the original string if parsing fails
                          return <Typography variant="body2">{interview.rescheduleRequest}</Typography>;
                        }
                      })()}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
            <Box p={3} sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Belum Ada Jadwal Wawancara
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Kandidat ini belum memiliki jadwal wawancara. Silakan buat jadwal wawancara baru.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleScheduleInterview}
              >
                Jadwalkan Wawancara
              </Button>
            </Box>
          </Paper>
        )}
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            variant="outlined" 
            onClick={handleBackToCandidates}
          >
            Kembali
          </Button>
          
          {interview && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleProceedToTechnicalTest}
            >
              Lanjut ke Technical Test
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default CandidateInterviewPreview; 