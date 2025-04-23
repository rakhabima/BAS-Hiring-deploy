import { Call, CheckCircle, Email, LocationOn } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  keyframes
} from '@mui/material';
import { styled } from '@mui/system';
import React, { useState } from 'react';
import { outsourcingService } from '../../services/api';

// Success animation keyframes
const checkAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const circleAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  40% {
    transform: scale(1.1);
  }
  60% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Styled components for animation
const AnimatedSuccessIcon = styled(CheckCircle)(({ theme }) => ({
  fontSize: 100,
  color: theme.palette.success.main,
  animation: `${checkAnimation} 0.8s ease-in-out forwards`,
}));

const AnimatedCircle = styled(Box)(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.light,
  opacity: 0.2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${circleAnimation} 0.6s ease-in-out forwards`,
}));

// Service categories
const SERVICE_CATEGORIES = [
  'E-Commerce',
  'Distributor',
  'Retail',
  'Manufaktur',
  'Teknologi Informasi',
  'Jasa Keuangan',
  'Pendidikan',
  'Kesehatan',
  'Logistik',
  'Hospitality',
  'Food & Beverage',
  'Perbankan',
  'Media & Komunikasi',
  'Properti',
  'Lainnya'
];

// Country codes for phone
const COUNTRY_CODES = [
  { code: '+62', country: 'Indonesia' },
  { code: '+60', country: 'Malaysia' },
  { code: '+65', country: 'Singapura' },
  { code: '+66', country: 'Thailand' },
  { code: '+63', country: 'Filipina' },
  { code: '+84', country: 'Vietnam' },
  { code: '+1', country: 'Amerika Serikat' },
  { code: '+44', country: 'Inggris' },
  { code: '+61', country: 'Australia' },
  { code: '+81', country: 'Jepang' },
  { code: '+82', country: 'Korea Selatan' },
  { code: '+86', country: 'China' },
];

const OutsourcingRequestPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    phoneNumber: '',
    countryCode: '+62',
    email: '',
    address: '',
    serviceCategory: '',
    message: ''
  });

  // Error state for form validation
  const [errors, setErrors] = useState({});
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  
  // Loading state
  const [loading, setLoading] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Check company name
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nama perusahaan wajib diisi';
    }
    
    // Check phone number
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Nomor telepon wajib diisi';
    } else if (!/^\d+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Nomor telepon hanya boleh berisi angka';
    }
    
    // Check email
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Format email tidak valid';
    }
    
    // Check address
    if (!formData.address.trim()) {
      newErrors.address = 'Alamat wajib diisi';
    }
    
    // Check service category
    if (!formData.serviceCategory) {
      newErrors.serviceCategory = 'Kategori layanan wajib dipilih';
    }
    
    // Check message
    if (!formData.message.trim()) {
      newErrors.message = 'Pesan wajib diisi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open confirmation dialog
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setConfirmDialogOpen(true);
    }
  };

  // Close confirmation dialog
  const handleCancelSubmit = () => {
    setConfirmDialogOpen(false);
  };

  // Submit form after confirmation
  const handleConfirmSubmit = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    
    try {
      // Prepare data for API - match field names with the backend model
      const requestData = {
        vendorName: formData.companyName,
        contactInfo: `${formData.countryCode}${formData.phoneNumber}`,
        email: formData.email,
        location: formData.address,
        serviceType: formData.serviceCategory,
        message: formData.message,
        quantity: 1, // Adding required field from the model
        submission: new Date().toISOString() // Set submission date to current date
      };
      
      // Submit to API
      await outsourcingService.submitOutsourcingRequest(requestData);
      
      // Show success dialog
      setSuccessDialogOpen(true);
      
      // Reset form
      setFormData({
        companyName: '',
        phoneNumber: '',
        countryCode: '+62',
        email: '',
        address: '',
        serviceCategory: '',
        message: ''
      });
    } catch (error) {
      console.error('Failed to submit request:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close success dialog
  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header Image */}
      <Box 
        sx={{ 
          height: { xs: '200px', md: '300px' },
          width: '100%',
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("/assets/building_business.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 6
        }}
      >
        <Typography 
          variant="h3" 
          color="white" 
          align="center"
          fontWeight="bold"
          sx={{ 
            px: 2,
            textShadow: '1px 1px 4px rgba(0,0,0,0.8)'
          }}
        >
          Formulir Permintaan Layanan
        </Typography>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Mari Terhubung dengan Kami
              </Typography>
              
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                Terima kasih atas ketertarikan Anda dengan PT Barokah Amanah Sentosa. Baik Anda klien, pencari kerja, atau investor, Anda dapat menemukan cara terbaik untuk menghubungi kami melalui telepon atau email dibawah ini.
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                PT Barokah Amanah Sentosa
              </Typography>
              
              <Box display="flex" alignItems="center" mt={2}>
                <Call color="primary" sx={{ mr: 2 }} />
                <Typography variant="body1">
                  +62 812 8032 2191
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mt={2}>
                <Email color="primary" sx={{ mr: 2 }} />
                <Typography variant="body1">
                  office@bas-indonesia.com
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="flex-start" mt={2}>
                <LocationOn color="primary" sx={{ mr: 2, mt: 0.5 }} />
                <Typography variant="body1">
                  GRAHA PRATAMA BUILDING, Jl. Letjen M.T. Haryono No.KAV15, RT.11/RW.5, Tebet Bar., Kec. Tebet, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12810
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Request Form */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Ajukan Permintaan Layanan
              </Typography>
              
              <Typography variant="body1" paragraph>
                Silakan isi formulir di bawah ini untuk mengajukan permintaan layanan outsourcing. Tim kami akan menghubungi Anda dalam waktu 1-2 hari kerja.
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} noValidate mt={3}>
                <Grid container spacing={3}>
                  {/* Company Name */}
                  <Grid item xs={12}>
                    <TextField
                      name="companyName"
                      label="Nama Perusahaan"
                      fullWidth
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      error={!!errors.companyName}
                      helperText={errors.companyName}
                      disabled={loading}
                    />
                  </Grid>
                  
                  {/* Phone Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="phoneNumber"
                      label="Nomor Telepon"
                      fullWidth
                      required
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Select
                              value={formData.countryCode}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                countryCode: e.target.value
                              }))}
                              variant="standard"
                              disableUnderline
                              sx={{ mr: 1, minWidth: '120px' }}
                              disabled={loading}
                              renderValue={(value) => {
                                const country = COUNTRY_CODES.find(option => option.code === value);
                                return value;
                              }}
                            >
                              {COUNTRY_CODES.map(option => (
                                <MenuItem key={option.code} value={option.code}>
                                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 'bold', width: '45px' }}>
                                      {option.code}
                                    </Typography>
                                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                                      {option.country}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="email"
                      label="Email Bisnis"
                      type="email"
                      fullWidth
                      required
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      disabled={loading}
                    />
                  </Grid>
                  
                  {/* Address */}
                  <Grid item xs={12}>
                    <TextField
                      name="address"
                      label="Alamat Bisnis"
                      fullWidth
                      required
                      multiline
                      rows={2}
                      value={formData.address}
                      onChange={handleChange}
                      error={!!errors.address}
                      helperText={errors.address}
                      disabled={loading}
                    />
                  </Grid>
                  
                  {/* Service Category */}
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.serviceCategory} disabled={loading}>
                      <InputLabel id="service-category-label">Kategori Layanan</InputLabel>
                      <Select
                        labelId="service-category-label"
                        name="serviceCategory"
                        value={formData.serviceCategory}
                        onChange={handleChange}
                        label="Kategori Layanan *"
                        required
                      >
                        {SERVICE_CATEGORIES.map(category => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.serviceCategory && (
                        <FormHelperText>{errors.serviceCategory}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  {/* Message */}
                  <Grid item xs={12}>
                    <TextField
                      name="message"
                      label="Pesan"
                      fullWidth
                      required
                      multiline
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      error={!!errors.message}
                      helperText={errors.message}
                      placeholder="Tuliskan detail kebutuhan layanan Anda"
                      disabled={loading}
                    />
                  </Grid>
                  
                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      disabled={loading}
                    >
                      {loading ? 'Mengirim...' : 'Kirim'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelSubmit}>
        <DialogTitle>Konfirmasi Pengiriman</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Pastikan semua data yang Anda masukkan sudah benar. Kirim permintaan layanan?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSubmit} color="inherit">
            Batal
          </Button>
          <Button onClick={handleConfirmSubmit} color="primary" variant="contained">
            Kirim
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={handleCloseSuccessDialog}>
        <DialogTitle>Permintaan Berhasil Dikirim</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" mb={3} mt={1} sx={{ position: 'relative', height: 120 }}>
            <AnimatedCircle />
            <Box sx={{ position: 'absolute' }}>
              <AnimatedSuccessIcon />
            </Box>
          </Box>
          <DialogContentText align="center">
            Terima kasih! Permintaan layanan Anda telah berhasil dikirim. Tim kami akan menghubungi Anda dalam waktu 1-2 hari kerja.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} color="primary" variant="contained">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OutsourcingRequestPage; 