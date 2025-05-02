import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, LocationOn, Search as SearchIcon, Work as WorkIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
import { outsourcingService } from '../../services/api';
const defaultImage = '/assets/baslogo.png';

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

const ActionButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '10px',
  zIndex: 1,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.background.default,
  },
}));

const ServicePublicationsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  
  // Check user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'GENERAL_MANAGER') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await outsourcingService.getAllOutsourcingServices();
        setServices(response.outsource || []);
        
        // Extract unique locations and service types for filters
        const uniqueLocations = [...new Set(response.outsource.map(service => service.location))];
        const uniqueServiceTypes = [...new Set(response.outsource.map(service => 
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

  const handleDeleteClick = (serviceId) => {
    setConfirmDelete(serviceId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    
    try {
      await outsourcingService.deleteOutsourcingService(confirmDelete);
      // Remove deleted service from the list
      setServices(services.filter(service => service.uuid !== confirmDelete));
    } catch (err) {
      console.error('Error deleting service:', err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCreateNew = () => {
    navigate('/gm/service-publications/create');
  };

  const handleEditService = (serviceId) => {
    navigate(`/gm/service-publications/edit/${serviceId}`);
  };

  const handleViewDetails = (serviceId) => {
    navigate(`/gm/service-publications/detail/${serviceId}`);
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

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Publikasi Ketersediaan Layanan
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Publikasi
        </Button>
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
          
          <Button 
            variant="contained"
            onClick={() => {
              setSearchQuery('');
              setLocationFilter('');
              setServiceTypeFilter('');
            }}
            sx={{ height: 56 }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {/* Service Cards */}
      <Grid container spacing={3}>
        {filteredServices.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service.uuid}>
            <StyledCard>
              <ActionButton
                aria-label="edit"
                sx={{ right: '50px' }}
                onClick={() => handleEditService(service.uuid)}
              >
                <EditIcon />
              </ActionButton>
              <ActionButton
                aria-label="delete"
                sx={{ right: '10px' }}
                onClick={() => handleDeleteClick(service.uuid)}
              >
                <DeleteIcon />
              </ActionButton>
              
              <CardMedia
                component="img"
                height="200"
                image={service.imageUrl || defaultImage}
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
                
                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">
                    <strong>Diungah:</strong> {formatDate(service.createdAt)}
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => handleViewDetails(service.uuid)}
                  >
                    Detail
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
      
      {/* Empty state */}
      {filteredServices.length === 0 && (
        <Box textAlign="center" my={5}>
          <Typography variant="h6">Tidak ada publikasi layanan yang ditemukan</Typography>
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Batal</Button>
          <Button onClick={handleDeleteConfirm} color="error">Hapus</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServicePublicationsPage; 