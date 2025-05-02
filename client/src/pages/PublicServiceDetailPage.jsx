import { ArrowBack, Business, LocationOn, MonetizationOn, People, Work as WorkIcon } from '@mui/icons-material';
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
import { outsourcingService } from '../services/api';

const PublicServiceDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Check if service is available
        if (serviceData.availabilityStatus === false) {
          setError('Layanan ini tidak tersedia saat ini');
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

  // Format price to Indonesian Rupiah
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
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
          <IconButton onClick={() => navigate('/layanan')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Detail Layanan
          </Typography>
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
                  Harga: {formatPrice(service.price)}
                </Typography>
              </Box>
            )}

            <Box display="flex" alignItems="center" mb={2}>
              <Business color="primary" />
              <Typography variant="body1" ml={1}>
                Status: <Chip label="Tersedia" color="success" size="small" />
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Deskripsi
            </Typography>
            <Typography variant="body1" paragraph>
              {service.description}
            </Typography>

            <Box mt={3}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                fullWidth
                onClick={() => navigate('/layanan/request')}
              >
                Hubungi Kami
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PublicServiceDetailPage; 