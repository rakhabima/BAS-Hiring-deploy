import { Alert, Box, Button, CircularProgress, Paper, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

const DetailTechnicalTest = () => {
  const [file, setFile] = useState(null);
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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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

  // In a real implementation, you would fetch technical test details from a related model
  // For now, we'll just use some placeholder data
  const testDescription = "Buatlah sebuah program sederhana untuk menyelesaikan masalah pengiriman barang. Sistem harus dapat menerima input berupa jarak dan berat barang, kemudian menghitung biaya pengiriman.";
  const testInstructions = "Kerjakan dalam 2 hari. Kirimkan solusi dalam bentuk file .zip yang berisi kode sumber dan dokumentasi singkat.";

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
        sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
      >
        Detail Technical Test
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
          Deskripsi Test
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          {testDescription}
        </Typography>

        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{
            mt: 2,
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
          }}
        >
          Instruksi
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
        >
          {testInstructions}
        </Typography>

        <Button
          variant="outlined"
          component="label"
          sx={{
            mt: 3,
            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
            borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : undefined,
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : undefined
            }
          }}
        >
          Upload Jawaban
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        {file && (
          <Typography
            variant="body2"
            mt={1}
            sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined }}
          >
            File: {file.name}
          </Typography>
        )}
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

export default DetailTechnicalTest;