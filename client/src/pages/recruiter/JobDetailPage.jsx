import { ArrowBack, Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobVacancyService } from '../../services/api';
import { formatDate } from '../../utils/formatDate';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Check user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'RECRUITER') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const response = await jobVacancyService.getJobVacancyById(id);
        setJob(response.data);
      } catch (err) {
        console.error('Error fetching job data:', err);
        setError('Failed to fetch job data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobData();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/recruiter/job-publications/edit/${id}`);
  };

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleDelete = async () => {
    try {
      await jobVacancyService.deleteJobVacancy(id);
      navigate('/recruiter/job-publications');
    } catch (err) {
      console.error('Error deleting job vacancy:', err);
      setError('Failed to delete job vacancy. Please try again later.');
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success.main';
      case 'CLOSED':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

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
            Job vacancy not found.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/recruiter/job-publications')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Detail Lowongan Kerja
          </Typography>
          <Box>
            <Button
              startIcon={<Edit />}
              variant="contained"
              color="primary"
              onClick={handleEdit}
              sx={{ mr: 2 }}
            >
              Edit
            </Button>
            <Button
              startIcon={<Delete />}
              variant="outlined"
              color="error"
              onClick={handleOpenDeleteDialog}
            >
              Hapus
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {job.imageUrl && (
            <Grid item xs={12} md={6}>
              <img
                src={job.imageUrl}
                alt={job.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
            </Grid>
          )}

          <Grid item xs={12} md={job.imageUrl ? 6 : 12}>
            <Box mb={3}>
              <Typography variant="h5" gutterBottom>
                {job.title}
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography
                  variant="subtitle1"
                  component="span"
                  sx={{
                    color: getStatusColor(job.status),
                    fontWeight: 'bold',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '4px',
                    bgcolor: `${getStatusColor(job.status)}15`
                  }}
                >
                  {job.status === 'ACTIVE' ? 'Aktif' : 'Tutup'}
                </Typography>
                <Typography
                  variant="subtitle1"
                  component="span"
                  sx={{ ml: 2, fontWeight: 'medium' }}
                >
                  {getJobTypeText(job.jobType)}
                </Typography>
              </Box>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                <strong>Posisi:</strong> {job.jobPosition}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                <strong>Lokasi:</strong> {job.location}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                <strong>Tanggal Penutupan:</strong> {formatDate(job.deadline)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Deskripsi Pekerjaan
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {job.description}
            </Typography>
          </Grid>
        </Grid>

        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Hapus Lowongan Kerja?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Apakah Anda yakin ingin menghapus lowongan kerja ini? Tindakan ini tidak dapat dibatalkan.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} color="primary">
              Batal
            </Button>
            <Button onClick={handleDelete} color="error" autoFocus>
              Hapus
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default JobDetailPage; 