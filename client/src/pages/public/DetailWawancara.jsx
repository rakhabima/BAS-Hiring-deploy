import { Alert, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

const DetailWawancara = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  const [attendance, setAttendance] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const response = await jobApplicationService.getApplicationById(uuid);
        setApplication(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Gagal memuat detail lamaran. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    if (uuid) {
      fetchApplicationDetails();
    }
  }, [uuid]);

  const handleAttendanceChange = (event) => {
    setAttendance(event.target.value);
    // Note: This would typically send data to the backend to update attendance
    // For now, we're just updating the local state
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

  if (!application) {
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
          Data aplikasi tidak ditemukan
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

  // In a real implementation, you would fetch interview details from a related model
  // For now, we'll just use some placeholder data
  const interviewDate = new Date();
  interviewDate.setDate(interviewDate.getDate() + 7); // Set to 7 days from now as example

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
          Waktu: 45 Menit
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Lokasi: Zoom Meeting (Daring)
        </Typography>
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
          - Segera konfirmasi kehadiran
        </Typography>

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
      </Paper>

      <Button
        variant="contained"
        sx={{ mt: 3 }}
        onClick={() => navigate('/candidate/portal-informasi')}
      >
        Kembali
      </Button>
    </Box>
  );
};

export default DetailWawancara;