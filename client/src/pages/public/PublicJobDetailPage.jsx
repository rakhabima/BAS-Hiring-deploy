import { ArrowBack, Close, LocationOn, Schedule, Work, ZoomIn, ZoomOut } from '@mui/icons-material';
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

const PublicJobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const response = await jobVacancyService.getJobVacancyById(id);
        const jobData = response.data;
        
        // Check if job data exists
        if (!jobData) {
          setError('Lowongan pekerjaan tidak ditemukan.');
          setLoading(false);
          return;
        }
        
        // Check if job is active, if not redirect to jobs list
        if (jobData.status !== 'ACTIVE') {
          navigate('/lowongan');
          return;
        }
        
        setJob(jobData);
      } catch (err) {
        console.error('Error fetching job data:', err);
        setError('Gagal mengambil detail lowongan kerja. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobData();
    }
  }, [id, navigate]);

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
    // For demonstration purposes, just prompt the user
    // In a real application, this could navigate to an application form
    alert('Untuk melamar pekerjaan ini, silakan hubungi kami melalui email atau telepon yang tertera di website.');
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
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
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
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {job.title}
            </Typography>
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
            >
              Lamar Sekarang
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
              >
                Lamar Sekarang
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