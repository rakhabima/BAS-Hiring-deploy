import { Alert, Box, Button, CircularProgress, Paper, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

const DetailOnJob = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
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

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
        sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
      >
        Detail On Job
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
          variant="subtitle1"
          fontWeight="bold"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Informasi Penempatan
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Nama: {application.nama_ktp}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Posisi: {application.jobPostingId?.jobPosition || 'Tidak tersedia'}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Lokasi Kerja: {application.jobPostingId?.location || 'Jakarta'}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Status: Aktif Bekerja
        </Typography>

        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{
            mt: 3,
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
          }}
        >
          Catatan Penting
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          Selamat, Anda telah resmi menjadi bagian dari tim PT Barokah Amanah Sentosa.
          Untuk informasi lebih lanjut tentang orientasi dan pelatihan, silakan hubungi departemen HR.
        </Typography>
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

export default DetailOnJob;