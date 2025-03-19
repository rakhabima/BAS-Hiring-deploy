import { ArrowBack, CloudUpload } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Container,
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
import { useNavigate } from 'react-router-dom';
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

const CreateServicePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  // Check user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'GENERAL_MANAGER') {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For availabilityStatus, convert string 'true'/'false' to boolean
    if (name === 'availabilityStatus') {
      setFormData({
        ...formData,
        [name]: value === 'true',
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

    setLoading(true);

    try {
      // Add current user as creator
      const user = JSON.parse(localStorage.getItem('user'));
      const dataToSubmit = {
        ...formData,
        createdBy: user.uuid,
      };

      // Call API to create the service
      await outsourcingService.createOutsourcingService(dataToSubmit);
      navigate('/gm/service-publications');
    } catch (error) {
      console.error('Error creating service:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/gm/service-publications')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Publikasi Layanan
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
      </Paper>
    </Container>
  );
};

export default CreateServicePage; 