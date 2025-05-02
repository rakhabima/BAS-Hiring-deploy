import { ArrowBack, CloudUpload } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { outsourcingService } from '../../services/api';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImagePreview = styled('img')(({ theme }) => ({
  width: '100%',
  height: 300,
  objectFit: 'contain',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(2),
}));

const EditServicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceType: '',
    description: '',
    location: '',
    imageUrl: null,
    capacity: '',
    price: '',
    availabilityStatus: true,
  });
  const [imagePreview, setImagePreview] = useState('/assets/baslogo.png');
  const [errors, setErrors] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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
        setLoadingData(true);
        const response = await outsourcingService.getAllOutsourcingServices();
        const service = response.outsource.find(s => s.uuid === id);
        
        if (!service) {
          navigate('/gm/service-publications');
          return;
        }
        
        setFormData({
          serviceName: service.serviceName || '',
          serviceType: service.serviceType || service.serviceName || '',
          description: service.description || '',
          location: service.location || '',
          capacity: service.capacity || '',
          price: service.price || '',
          availabilityStatus: service.availabilityStatus !== undefined ? service.availabilityStatus : true,
        });
        
        if (service.imageUrl) {
          setImagePreview(service.imageUrl);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      fetchServiceData();
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For availabilityStatus, convert string 'true'/'false' to boolean
    if (name === 'availabilityStatus') {
      const boolValue = value === 'true' || value === true;
      console.log(`Changing availability status: ${value} (${typeof value}) -> ${boolValue} (${typeof boolValue})`);
      
      setFormData({
        ...formData,
        [name]: boolValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageUrl: file,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceName.trim()) {
      newErrors.serviceName = 'Judul harus diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi harus diisi';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Lokasi harus diisi';
    }
    
    if (!formData.serviceType.trim()) {
      newErrors.serviceType = 'Tipe layanan harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Open confirmation dialog instead of saving immediately
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);

    try {
      // Call API to update the service
      await outsourcingService.updateOutsourcingService(id, formData);
      navigate('/gm/service-publications');
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  if (loadingData) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
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
            Perbarui Publikasi Layanan
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Judul"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                error={Boolean(errors.serviceName)}
                helperText={errors.serviceName}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deskripsi"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                error={Boolean(errors.description)}
                helperText={errors.description}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.location)}>
                <InputLabel id="location-label">Lokasi</InputLabel>
                <Select
                  labelId="location-label"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  label="Lokasi"
                  required
                >
                  <MenuItem value="Jakarta">Jakarta</MenuItem>
                  <MenuItem value="Bandung">Bandung</MenuItem>
                  <MenuItem value="Surabaya">Surabaya</MenuItem>
                  <MenuItem value="Medan">Medan</MenuItem>
                  <MenuItem value="Makassar">Makassar</MenuItem>
                  <MenuItem value="Bali">Bali</MenuItem>
                </Select>
                {errors.location && (
                  <Typography variant="caption" color="error">
                    {errors.location}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.serviceType)}>
                <InputLabel id="tipe-layanan-label">Tipe Layanan</InputLabel>
                <Select
                  labelId="tipe-layanan-label"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  label="Tipe Layanan"
                  required
                >
                  <MenuItem value="Kurir">Kurir</MenuItem>
                  <MenuItem value="Office Boy">Office Boy</MenuItem>
                  <MenuItem value="Security">Security</MenuItem>
                  <MenuItem value="Receptionist">Receptionist</MenuItem>
                  <MenuItem value="Driver">Driver</MenuItem>
                </Select>
                {errors.serviceType && (
                  <Typography variant="caption" color="error">
                    {errors.serviceType}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kapasitas"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Harga"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="availability-status-label">Status</InputLabel>
                <Select
                  labelId="availability-status-label"
                  name="availabilityStatus"
                  value={formData.availabilityStatus}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value={true}>Tersedia</MenuItem>
                  <MenuItem value={false}>Tidak Tersedia</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Unggah Gambar
              </Typography>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUpload />}
              >
                Pilih File
                <VisuallyHiddenInput type="file" accept="image/*" onChange={handleImageChange} />
              </Button>
              <ImagePreview src={imagePreview} alt="Preview" />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ minWidth: 150 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Simpan'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          aria-labelledby="confirm-dialog-title"
        >
          <DialogTitle id="confirm-dialog-title">
            Konfirmasi Perubahan
          </DialogTitle>
          <DialogContent>
            <Typography>
              Apakah Anda yakin ingin menyimpan perubahan pada layanan ini?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
              Batal
            </Button>
            <Button onClick={handleConfirmSave} color="primary" variant="contained" autoFocus>
              Simpan Perubahan
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default EditServicePage; 