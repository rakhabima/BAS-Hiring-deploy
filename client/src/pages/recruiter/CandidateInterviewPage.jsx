import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckIcon from '@mui/icons-material/Check';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { interviewService, jobApplicationService } from '../../services/api';

// Steps for the progress bar
const steps = ['Administrasi', 'Wawancara', 'Technical Test', 'On Job'];

const CandidateInterviewPage = () => {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const [application, setApplication] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [date, setDate] = useState(null);
  const [timeHour, setTimeHour] = useState('');
  const [timeMinute, setTimeMinute] = useState('');
  const [method, setMethod] = useState('Daring');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({
    date: '',
    timeHour: '',
    timeMinute: '',
    method: '',
    location: ''
  });

  // Set to Wawancara stage (index 1)
  const activeStep = 1;

  // Fetch application and interview data
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
        
        // Try to fetch existing interview data
        try {
          const interviewResponse = await interviewService.getInterviewByApplicationId(candidateId);
          if (interviewResponse && interviewResponse.data) {
            setInterview(interviewResponse.data);
            
            // Pre-fill form with existing data
            const interviewDate = new Date(interviewResponse.data.interviewDate);
            setDate(interviewDate);
            setTimeHour(interviewDate.getHours().toString().padStart(2, '0'));
            setTimeMinute(interviewDate.getMinutes().toString().padStart(2, '0'));
            setMethod(interviewResponse.data.isOnline ? 'Daring' : 'Luring');
            setLocation(interviewResponse.data.isOnline ? 
              interviewResponse.data.meetingLink : 
              interviewResponse.data.location
            );
            setNotes(interviewResponse.data.notes || '');
          }
        } catch (interviewError) {
          // No existing interview found - this is expected for new interviews
          console.log('No existing interview found, creating new one');
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

  // Validate form fields
  const validateForm = () => {
    const newErrors = {
      date: !date ? 'Tanggal wajib diisi' : '',
      timeHour: !timeHour ? 'Jam wajib diisi' : '',
      timeMinute: !timeMinute ? 'Menit wajib diisi' : '',
      method: !method ? 'Metode wajib diisi' : '',
      location: !location ? 'Detail lokasi wajib diisi' : ''
    };
    
    // Check if date is in the past
    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(timeHour ? parseInt(timeHour, 10) : 0, timeMinute ? parseInt(timeMinute, 10) : 0);
      const now = new Date();
      
      if (selectedDate < now) {
        newErrors.date = 'Jadwal interview tidak boleh di masa lalu';
      }
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form save
  const handleSaveForm = () => {
    if (validateForm()) {
      setFormCompleted(true);
      window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
        detail: { message: 'Data tersimpan. Klik Selanjutnya untuk menyelesaikan.', severity: 'success' }
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create interview datetime
      const interviewDate = new Date(date);
      interviewDate.setHours(parseInt(timeHour, 10), parseInt(timeMinute, 10), 0, 0);
      
      const interviewData = {
        applicationId: candidateId,
        interviewDate: interviewDate,
        location: method === 'Luring' ? location : 'Online Meeting',
        isOnline: method === 'Daring',
        meetingLink: method === 'Daring' ? location : '',
        status: 'SCHEDULED',
        notes: notes
      };
      
      console.log('Submitting interview data:', interviewData);
      
      let result;
      if (interview && interview.id) {
        // Update existing interview
        console.log('Updating existing interview with ID:', interview.id);
        result = await interviewService.updateInterview(interview.id, interviewData);
        console.log('Interview update response:', result);
      } else {
        // Create new interview
        console.log('Creating new interview');
        result = await interviewService.createInterview(interviewData);
        console.log('Interview creation response:', result);
      }
      
      // Show success notification
      window.dispatchEvent(new CustomEvent('SHOW_NOTIFICATION', {
        detail: { message: 'Jadwal wawancara berhasil disimpan', severity: 'success' }
      }));
      
      // Navigate back to the interview preview page
      navigate(`/recruiter/candidate-interview-preview/${candidateId}`);
    } catch (error) {
      console.error('Error scheduling interview:', error);
      console.error('Error details:', {
        message: error.message,
        responseData: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Check different possible error response structures for scheduling conflict
      const isSchedulingConflict = 
        (error.response?.data?.error && error.response.data.error.includes('Scheduling conflict')) ||
        (error.response?.data?.message && error.response.data.message.includes('Scheduling conflict')) ||
        (error.message && error.message.includes('Scheduling conflict'));
      
      const isAuthError = error.response?.status === 401 || error.response?.status === 403;
      const isServerError = error.response?.status === 500;
      const isNetworkError = !error.response;
      
      if (isSchedulingConflict) {
        setError('Interview bentrok, harus dijadwalkan dengan jarak 1 jam sebelum atau sesudah jadwal interview lainnya');
      } else if (isAuthError) {
        setError('Anda tidak memiliki akses untuk menjadwalkan wawancara. Silakan login kembali.');
      } else if (isServerError) {
        setError('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      } else if (isNetworkError) {
        setError('Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.');
      } else {
        // Get the most specific error message available
        const errorMessage = 
          error.response?.data?.message || 
          error.response?.data?.error || 
          error.message || 
          'Gagal menyimpan jadwal wawancara. Silakan coba lagi.';
        
        setError(errorMessage);
      }
      
      setSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate(`/recruiter/candidate-interview-preview/${candidateId}`);
  };

  const handleViewCalendar = () => {
    navigate('/recruiter/scheduling');
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
        <Box sx={{ textAlign: 'center' }}>
          <Typography color="error" variant="h6" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate(`/recruiter/candidate-interview-preview/${candidateId}`)}
          >
            Kembali
          </Button>
        </Box>
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
      
      {/* Interview Form Card */}
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ bgcolor: '#182f5d', color: 'white', p: 2 }}>
            <Grid container>
              <Grid item xs={8}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">Nama</Typography>
                  <Typography variant="body2">
                    {application?.candidateInfo?.name || application?.nama_ktp || '-'}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant="subtitle1" fontWeight="bold">Posisi Kerja</Typography>
                  <Typography variant="body2">
                    {application?.jobPostingId?.jobPosition || application?.posisi_dilamar || '-'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">Status</Typography>
                  <Box sx={{ 
                    display: 'inline-block',
                    bgcolor: '#182f5d', 
                    color: 'white', 
                    py: 0.5, 
                    px: 2,
                    borderRadius: 1,
                    mt: 0.5,
                    border: '1px solid white'
                  }}>
                    <Typography variant="body2">
                      {interview?.candidateAttendance === 'hadir' ? 'Hadir' : 
                       interview?.candidateAttendance === 'tidak_hadir' ? 'Tidak Hadir' : 
                       'Belum Konfirmasi'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {/* Form Content */}
          <Box p={3}>
            <Grid container spacing={2}>
              {/* Left column */}
              <Grid item xs={12} md={6}>
                {/* Tanggal */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tanggal</Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={date}
                      onChange={(newDate) => {
                        console.log('Selected date:', newDate);
                        setDate(newDate);
                        setErrors({...errors, date: ''});
                      }}
                      minDate={new Date()}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          variant="outlined"
                          error={!!errors.date}
                          helperText={errors.date || 'Pilih tanggal untuk wawancara'}
                          placeholder="DD/MM/YYYY"
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Box>
              
                {/* Metode */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Metode</Typography>
                  <TextField
                    select
                    fullWidth
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value);
                      setErrors({...errors, method: ''});
                      // Reset location when changing method
                      setLocation('');
                    }}
                    error={!!errors.method}
                    helperText={errors.method}
                    variant="outlined"
                  >
                    <MenuItem value="Daring">Daring</MenuItem>
                    <MenuItem value="Luring">Luring</MenuItem>
                  </TextField>
                </Box>
              </Grid>
              
              {/* Right column */}
              <Grid item xs={12} md={6}>
                {/* Detail Lokasi */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {method === 'Daring' ? 'Link Meeting' : 'Alamat Lokasi'}
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder={method === 'Daring' ? 'Tulis link disini' : 'Tulis alamat lokasi'}
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setErrors({...errors, location: ''});
                    }}
                    error={!!errors.location}
                    helperText={errors.location || `Masukkan ${method === 'Daring' ? 'link meeting' : 'alamat lokasi'} wawancara`}
                    variant="outlined"
                  />
                </Box>
              
                {/* Waktu */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Waktu</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        placeholder="Jam"
                        label="Jam"
                        type="number"
                        value={timeHour}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 23)) {
                            setTimeHour(value);
                            setErrors({...errors, timeHour: ''});
                          }
                        }}
                        error={!!errors.timeHour}
                        helperText={errors.timeHour}
                        InputProps={{
                          inputProps: { min: 0, max: 23 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        placeholder="Menit"
                        label="Menit"
                        type="number"
                        value={timeMinute}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value, 10) >= 0 && parseInt(value, 10) <= 59)) {
                            setTimeMinute(value);
                            setErrors({...errors, timeMinute: ''});
                          }
                        }}
                        error={!!errors.timeMinute}
                        helperText={errors.timeMinute}
                        InputProps={{
                          inputProps: { min: 0, max: 59 }
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Format: 24 jam (00-23)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Save Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="contained" 
                color={formCompleted ? "success" : "primary"}
                onClick={handleSaveForm}
                sx={{ px: 4 }}
                startIcon={formCompleted ? <CheckIcon /> : null}
              >
                {formCompleted ? "Tersimpan" : "Simpan"}
              </Button>
            </Box>
          </Box>
        </Paper>
        
        {/* Notes section outside card */}
        <Paper 
          elevation={3} 
          sx={{ 
            mt: 3, 
            p: 3, 
            borderRadius: 2,
            position: 'relative',
            border: formCompleted ? '1px solid #4caf50' : 'none'
          }}
        >
          {formCompleted && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -12, 
                left: 20, 
                bgcolor: '#4caf50', 
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              Formulir Lengkap
            </Box>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Keterangan (Opsional)</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Tambahkan catatan atau instruksi untuk kandidat"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
            />
          </Box>
          
          {/* Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <Button 
                variant="outlined" 
                onClick={handleCancel}
                sx={{ mr: 2 }}
              >
                Kembali
              </Button>
              <Button
                variant="outlined"
                onClick={handleViewCalendar}
                startIcon={<CalendarMonthIcon />}
              >
                Cek Jadwal/Kalender
              </Button>
            </Box>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSubmit}
              disabled={!formCompleted || submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Simpan & Lanjutkan'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CandidateInterviewPage; 