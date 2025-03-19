import { ArrowBack, Business, Delete as DeleteIcon, Edit as EditIcon, LocationOn, MonetizationOn, People, Work as WorkIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    IconButton,
    Paper,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { outsourcingService } from '../../services/api';

const ServiceDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Check user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'GENERAL_MANAGER') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch service data
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setLoading(true);
        const response = await outsourcingService.getAllOutsourcingServices();
        const serviceData = response.outsource.find(s => s.uuid === id);
        
        if (!serviceData) {
          setError('Layanan tidak ditemukan');
          return;
        }
        
        setService(serviceData);
      } catch (error) {
        setError('Gagal memuat data layanan');
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchServiceData();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/gm/service-publications/edit/${id}`);
  };

  const handleDelete = async () => {
    try {
      await outsourcingService.deleteOutsourcingService(id);
      navigate('/gm/service-publications');
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
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

  if (error || !service) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography color="error">{error || 'Layanan tidak ditemukan'}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/gm/service-publications')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Detail Publikasi Layanan
          </Typography>
          <Box ml="auto" display="flex" gap={1}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
            >
              Hapus
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box 
              component="img"
              src={service.imageUrl || '/assets/baslogo.png'}
              alt={service.serviceName}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 400,
                objectFit: 'contain',
                borderRadius: 1,
                mb: 2,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {service.serviceName}
            </Typography>

            <Box display="flex" alignItems="center" mb={2}>
              <LocationOn color="primary" />
              <Typography variant="body1" ml={1}>
                {service.location}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" mb={2}>
              <WorkIcon color="primary" />
              <Typography variant="body1" ml={1}>
                Tipe Layanan: {service.serviceType || service.serviceName}
              </Typography>
            </Box>

            {service.capacity && (
              <Box display="flex" alignItems="center" mb={2}>
                <People color="primary" />
                <Typography variant="body1" ml={1}>
                  Kapasitas: {service.capacity} orang
                </Typography>
              </Box>
            )}

            {service.price && (
              <Box display="flex" alignItems="center" mb={2}>
                <MonetizationOn color="primary" />
                <Typography variant="body1" ml={1}>
                  Harga: Rp {service.price.toLocaleString('id-ID')}
                </Typography>
              </Box>
            )}

            <Box display="flex" alignItems="center" mb={2}>
              <Business color="primary" />
              <Typography variant="body1" ml={1}>
                Status: <Chip label={service.availabilityStatus ? 'Tersedia' : 'Tidak Tersedia'} color={service.availabilityStatus ? 'success' : 'error'} size="small" />
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Dipublikasikan pada: {formatDate(service.createdAt)}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Deskripsi
            </Typography>
            <Typography variant="body1" paragraph>
              {service.description}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Konfirmasi Penghapusan
            </Typography>
            <Typography variant="body1" mb={3}>
              Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.
            </Typography>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={() => setConfirmDelete(false)}>
                Batal
              </Button>
              <Button onClick={handleDelete} color="error" variant="contained">
                Hapus
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default ServiceDetailPage; 