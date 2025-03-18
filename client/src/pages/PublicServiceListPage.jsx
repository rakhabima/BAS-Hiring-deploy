import { Delete as DeleteIcon, LocationOn, Search as SearchIcon, Work as WorkIcon } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { outsourcingService } from '../services/api';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  position: 'relative',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
}));

const PublicServiceListPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  
  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await outsourcingService.getAllOutsourcingServices();
        
        // Only show available services
        const availableServices = response.outsource.filter(service => service.availabilityStatus !== false);
        setServices(availableServices || []);
        
        // Extract unique locations and service types for filters
        const uniqueLocations = [...new Set(availableServices.map(service => service.location))];
        const uniqueServiceTypes = [...new Set(availableServices.map(service => 
          service.serviceType || service.serviceName).filter(Boolean))];
        
        setLocations(uniqueLocations);
        setServiceTypes(uniqueServiceTypes);
      } catch (err) {
        setError('Failed to load services');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleViewDetails = (serviceId) => {
    navigate(`/layanan/${serviceId}`);
  };

  // Filter services based on search query and filters
  const filteredServices = services.filter(service => {
    const matchesQuery = searchQuery === '' || 
      service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLocation = locationFilter === '' || service.location === locationFilter;
    const matchesType = serviceTypeFilter === '' || 
      (service.serviceType && service.serviceType === serviceTypeFilter) || 
      (!service.serviceType && service.serviceName === serviceTypeFilter);
    
    return matchesQuery && matchesLocation && matchesType;
  });

  // Loading state
  if (loading) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Layanan Outsourcing Tersedia
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Lihat berbagai layanan outsourcing yang kami sediakan untuk memenuhi kebutuhan bisnis Anda
        </Typography>
      </Box>

      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 4, backgroundColor: theme.palette.background.paper }}>
        <Box display="flex" flexDirection="row" gap={2} alignItems="flex-end">
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="Cari"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ bgcolor: theme.palette.background.default, borderRadius: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Lokasi
            </Typography>
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              displayEmpty
              size="medium"
              sx={{ width: '100%', bgcolor: theme.palette.background.default, borderRadius: 1 }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Semua Lokasi</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location} value={location}>{location}</MenuItem>
              ))}
            </Select>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Posisi Kerja
            </Typography>
            <Select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              displayEmpty
              size="medium"
              sx={{ width: '100%', bgcolor: theme.palette.background.default, borderRadius: 1 }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Semua Posisi</MenuItem>
              {serviceTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Paper>

      {/* Service Cards */}
      <Grid container spacing={3}>
        {filteredServices.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service.uuid}>
            <StyledCard>
              <CardActionArea onClick={() => handleViewDetails(service.uuid)}>
                <CardMedia
                  component="img"
                  height="200"
                  image={service.imageUrl || '/assets/baslogo.png'}
                  alt={service.serviceName}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div" fontWeight="bold">
                    {service.serviceName}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn color="primary" fontSize="small" />
                    <Typography variant="body2" color="text.secondary" ml={0.5}>
                      {service.location}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <WorkIcon color="primary" fontSize="small" />
                    <Typography variant="body2" color="text.secondary" ml={0.5}>
                      Tipe Layanan: {service.serviceType || service.serviceName}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Deskripsi: </strong>
                    {service.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
      
      {/* Empty state */}
      {filteredServices.length === 0 && (
        <Box textAlign="center" my={5}>
          <Typography variant="h6">Tidak ada layanan yang ditemukan</Typography>
        </Box>
      )}
    </Container>
  );
};

export default PublicServiceListPage; 