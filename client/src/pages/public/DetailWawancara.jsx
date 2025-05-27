import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { interviewService, jobApplicationService } from '../../services/api';

const DetailWawancara = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [interview, setInterview] = useState(null);
  const [attendance, setAttendance] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch application details
        const appResponse = await jobApplicationService.getApplicationById(uuid);
        if (appResponse?.data) {
          setApplication(appResponse.data);
        } else {
          throw new Error('Application not found');
        }
        
        // Fetch interview details
        try {
          const interviewResponse = await interviewService.getInterviewByApplicationId(uuid);
          if (interviewResponse?.data) {
            setInterview(interviewResponse.data);
            // If candidate already responded, set form values
            if (interviewResponse.data.candidateAttendance) {
              setAttendance(interviewResponse.data.candidateAttendance);
              if (interviewResponse.data.candidateAttendance === 'tidak_hadir' && 
                  interviewResponse.data.rescheduleRequest) {
                // Try to parse the reschedule date if it's a date string
                try {
                  const rescheduleInfo = JSON.parse(interviewResponse.data.rescheduleRequest);
                  if (rescheduleInfo.date) {
                    setRescheduleDate(new Date(rescheduleInfo.date));
                  }
                  if (rescheduleInfo.reason) {
                    setRescheduleReason(rescheduleInfo.reason);
                  }
                } catch (e) {
                  // If parsing fails, just set the text as reason
                  setRescheduleReason(interviewResponse.data.rescheduleRequest);
                }
              }
              setResponseSubmitted(true);
            }
          }
        } catch (interviewError) {
          console.error('No interview found for this application', interviewError);
          setError('Data wawancara tidak ditemukan');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Gagal memuat detail informasi wawancara. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    if (uuid) {
      fetchData();
    }
  }, [uuid]);

  const handleAttendanceChange = (event) => {
    setAttendance(event.target.value);
    if (event.target.value === 'hadir') {
      setRescheduleDate(null);
      setRescheduleReason('');
    }
  };

  const handleSubmitResponse = async () => {
    if (!attendance) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const responseData = {
        candidateAttendance: attendance,
        candidateResponse: true
      };
      
      // If not attending, include reschedule request
      if (attendance === 'tidak_hadir') {
        // Validate reschedule information
        if (!rescheduleDate && !rescheduleReason) {
          window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
            detail: { message: 'Mohon berikan alasan atau usulan tanggal untuk penjadwalan ulang', severity: 'error' }
          }));
          setSubmitting(false);
          return;
        }
        
        // Structure the reschedule request
        const rescheduleInfo = {
          date: rescheduleDate ? rescheduleDate.toISOString() : null,
          reason: rescheduleReason
        };
        
        responseData.rescheduleRequest = JSON.stringify(rescheduleInfo);
      }
      
      await interviewService.updateInterviewResponse(interview.id, responseData);
      
      window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
        detail: { message: 'Konfirmasi kehadiran berhasil dikirim', severity: 'success' }
      }));
      
      setResponseSubmitted(true);
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting response:', error);
      window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
        detail: { message: 'Gagal mengirim konfirmasi. Silakan coba lagi.', severity: 'error' }
      }));
      setSubmitting(false);
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
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
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
          variant="contained" 
          sx={{ mt: 3 }} 
          onClick={() => navigate('/candidate/portal-informasi')}
        >
          Kembali
        </Button>
      </Box>
    );
  }

  if (!interview) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
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
          Jadwal wawancara belum ditentukan
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 3 }} 
          onClick={() => navigate('/candidate/portal-informasi')}
        >
          Kembali
        </Button>
      </Box>
    );
  }

  const interviewDate = new Date(interview.interviewDate);
  const formattedTime = format(interviewDate, 'HH.mm') + ' WIB';

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography 
        variant="h4" 
        fontWeight="bold" 
        mb={3}
        sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
      >
        Detail Pelaksanaan Wawancara
      </Typography>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : undefined,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
        }}
      >
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Tanggal: {format(interviewDate, 'dd MMMM yyyy')}
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Waktu: {formattedTime}
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Lokasi: {interview.isOnline ? 'Online Meeting' : interview.location}
        </Typography>
        
        {interview.isOnline && (
          <Typography 
            variant="body2"
            sx={{ 
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
              mt: 1
            }}
          >
            Link Meeting: <br />
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.palette.primary.main,
                textDecoration: 'underline'
              }}
            >
              {interview.meetingLink}
            </a>
          </Typography>
        )}
        
        {interview.notes && (
          <>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              sx={{ 
                mt: 2,
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined 
              }}
            >
              Catatan dari Recruiter
            </Typography>
            <Typography 
              variant="body2"
              sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
            >
              {interview.notes}
            </Typography>
          </>
        )}
        
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          sx={{ 
            mt: 2,
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined 
          }}
        >
          Catatan Penting
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Harap diperhatikan:
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          - Gunakan pakaian yang rapih
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          - Hadir 5 menit sebelum wawancara dimulai
        </Typography>
        <Typography 
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          - Siapkan CV dan dokumen pendukung lainnya
        </Typography>
        
        {responseSubmitted ? (
          <Box mt={3}>
            <Alert 
              severity={attendance === 'hadir' ? 'success' : 'info'}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" fontWeight="bold">
                Anda telah mengkonfirmasi: {attendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
              </Typography>
              
              {attendance === 'tidak_hadir' && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Permintaan penjadwalan ulang Anda telah terkirim.
                </Typography>
              )}
            </Alert>
            
            <Button
              variant="outlined"
              onClick={() => setResponseSubmitted(false)}
              sx={{ mt: 1 }}
            >
              Ubah Konfirmasi
            </Button>
          </Box>
        ) : (
          <>
            <FormControl 
              fullWidth 
              sx={{ 
                mt: 3,
                '& .MuiInputLabel-root': {
                  color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
                  }
                }
              }}
            >
              <InputLabel id="attendance-label">Konfirmasi Kehadiran</InputLabel>
              <Select
                labelId="attendance-label"
                value={attendance}
                label="Konfirmasi Kehadiran"
                onChange={handleAttendanceChange}
                sx={{
                  color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                }}
              >
                <MenuItem value="hadir">Hadir</MenuItem>
                <MenuItem value="tidak_hadir">Tidak Hadir</MenuItem>
              </Select>
            </FormControl>
            
            {attendance === 'tidak_hadir' && (
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  Permintaan Penjadwalan Ulang
                </Typography>
                
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                  <DatePicker
                    label="Tanggal yang diusulkan"
                    value={rescheduleDate}
                    onChange={(newDate) => setRescheduleDate(newDate)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                        variant: 'outlined'
                      }
                    }}
                  />
                </LocalizationProvider>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Alasan/Keterangan"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Jelaskan alasan Anda tidak dapat hadir pada jadwal tersebut"
                  margin="normal"
                  variant="outlined"
                />
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitResponse}
                disabled={!attendance || submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Kirim Konfirmasi'}
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Button 
        variant="outlined" 
        sx={{ mt: 3 }} 
        onClick={() => navigate(`/candidate/portal-informasi/${uuid}`)}
      >
        Kembali
      </Button>
    </Box>
  );
};

export default DetailWawancara;