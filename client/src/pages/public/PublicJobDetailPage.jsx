import { ArrowBack, Close, LocationOn, Refresh, Schedule, Work, ZoomIn, ZoomOut } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobVacancyService } from '../../services/api';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';

// Komponen untuk memungkinkan pengguna mencoba ulang jika terjadi error
const RetryButton = ({ onClick }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<Refresh />}
      onClick={onClick}
      sx={{ mt: 2 }}
    >
      Coba Lagi
    </Button>
  );
};

const PublicJobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Menambahkan function retry untuk memuat ulang data
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchJobData();
  };

  // Function fetchJobData sebagai fungsi bernama agar dapat digunakan kembali
  const fetchJobData = async () => {
    try {
      setLoading(true);
      const response = await jobVacancyService.getJobVacancyById(id);
      setJob(response.data);
    } catch (err) {
      console.error('Error fetching job data:', err);
      setError('Gagal mengambil detail lowongan kerja. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // Use effect to fetch job data
  useEffect(() => {
    if (id) {
      fetchJobData();
    }
  }, [id]); // Dependensi hanya pada ID

  const getJobTypeText = (type) => {
    switch (type) {
      case 'FULL_TIME':
        return 'Full Time';
      case 'PART_TIME':
        return 'Part Time';
      case 'CONTRACT':
        return 'Contract';
      default:
        return type;
    }
  };

  const handleApply = () => {
    // Redirect to job application form with job ID
    navigate(`/lowongan/${id}/apply`);
  };

  const handleOpenImageDialog = () => {
    setImageDialogOpen(true);
    setZoomLevel(1);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  // Add a status badge component
  const getStatusBadge = (status) => {
    return (
      <Box 
        component="span" 
        sx={{ 
          backgroundColor: status === 'ACTIVE' ? '#e6f4ea' : '#fce8e6',
          color: status === 'ACTIVE' ? '#137333' : '#c5221f',
          fontWeight: 'medium',
          px: 2,
          py: 0.5,
          borderRadius: '16px',
          fontSize: '0.875rem',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {status === 'ACTIVE' ? 'Aktif' : 'Tutup'}
      </Box>
    );
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ my: 4 }}>
            <Typography variant="h5" color="error" gutterBottom>
              {error}
            </Typography>
            <Typography color="text.secondary" paragraph>
              Mohon maaf atas ketidaknyamanan ini. Anda dapat mencoba memuat ulang halaman atau kembali ke daftar lowongan.
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/lowongan')}
                startIcon={<ArrowBack />}
              >
                Kembali ke Daftar Lowongan
              </Button>
              <RetryButton onClick={handleRetry} />
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" align="center">
            Lowongan pekerjaan tidak ditemukan.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const isDeadlineNear = () => {
    const deadline = new Date(job.deadline);
    const now = new Date();
    const diffInDays = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7 && diffInDays >= 0;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate('/lowongan')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="body2" component="span" color="text.secondary">
            Kembali ke daftar lowongan
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {job.imageUrl && (
            <Grid item xs={12} md={6}>
              <Box
                component="div"
                onClick={handleOpenImageDialog}
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    '&::after': {
                      content: '"Klik untuk memperbesar"',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: '8px',
                      textAlign: 'center',
                      borderBottomLeftRadius: '8px',
                      borderBottomRightRadius: '8px',
                    }
                  }
                }}
              >
                <img
                  src={job.imageUrl}
                  alt={job.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>
            </Grid>
          )}

          <Grid item xs={12} md={job.imageUrl ? 6 : 12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {job.title}
              </Typography>
              {getStatusBadge(job.status)}
            </Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {job.jobPosition}
            </Typography>

            <Box sx={{ my: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center">
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {job.location}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center">
                    <Work sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {getJobTypeText(job.jobType)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center">
                    <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      Deadline: {formatDate(job.deadline)}
                      {isDeadlineNear() && (
                        <Typography
                          component="span"
                          sx={{
                            ml: 1,
                            color: 'error.main',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          (Segera berakhir!)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleApply}
              sx={{ mt: 2, mb: 3 }}
              disabled={job.status !== 'ACTIVE'}
            >
              {job.status === 'ACTIVE' ? 'Lamar Sekarang' : 'Lowongan Ditutup'}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Deskripsi Pekerjaan
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {job.description}
            </Typography>

            <Box sx={{ mt: 4, bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Lowongan dibuka {formatRelativeTime(job.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Diperbarui {formatRelativeTime(job.updatedAt)}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => navigate('/lowongan')}
                sx={{ mr: 2 }}
              >
                Lihat Lowongan Lainnya
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleApply}
                disabled={job.status !== 'ACTIVE'}
              >
                {job.status === 'ACTIVE' ? 'Lamar Sekarang' : 'Lowongan Ditutup'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Image Zoom Dialog */}
        <Dialog
          open={imageDialogOpen}
          onClose={handleCloseImageDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ position: 'relative', p: 0, overflow: 'hidden' }}>
            <IconButton 
              onClick={handleCloseImageDialog}
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <Close />
            </IconButton>
            
            <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={handleZoomOut}
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.5)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <ZoomOut />
              </IconButton>
              <IconButton 
                onClick={handleZoomIn}
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.5)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <ZoomIn />
              </IconButton>
            </Box>
            
            <Box 
              sx={{ 
                width: '100%', 
                height: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto'
              }}
            >
              <img
                src={job.imageUrl}
                alt={job.title}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.3s ease',
                  transformOrigin: 'center center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </DialogContent>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default PublicJobDetailPage; 