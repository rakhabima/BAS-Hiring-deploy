import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const CreateAccountPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Form validation
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = () => {
    let valid = true;

    // Name validation
    if (!name.trim()) {
      setNameError('Nama tidak boleh kosong');
      valid = false;
    } else {
      setNameError('');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email tidak boleh kosong');
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Format email tidak valid');
      valid = false;
    } else {
      setEmailError('');
    }

    // Role validation
    if (!role) {
      setRoleError('Posisi tidak boleh kosong');
      valid = false;
    } else {
      setRoleError('');
    }

    // Password validation
    if (!password) {
      setPasswordError('Kata sandi tidak boleh kosong');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Kata sandi minimal 8 karakter');
      valid = false;
    } else {
      setPasswordError('');
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Konfirmasi kata sandi tidak boleh kosong');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Konfirmasi kata sandi tidak cocok');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API to create a new account
      console.log('Submitting form data:', { name, email, role, password });
      
      // Get the admin user info from localStorage
      const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      
      const response = await authService.createAccount({
        name,
        email,
        role,
        password,
        // Add additional fields that might be required by the backend
        isPublicRegistration: false,
        createdBy: currentUser?.uuid || 'admin',
        isInternalStaff: true
      });
      
      console.log('Account creation successful:', response);

      // Show success message
      setSuccess(true);
      
      // Reset form
      setName('');
      setEmail('');
      setRole('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect back to internal staff page after a delay
      setTimeout(() => {
        navigate('/admin/internal-staff');
      }, 2000);
    } catch (error) {
      console.error('Create account error:', error);
      setError(true);
      
      // Provide more detailed error message for debugging
      let errorMsg = 'Terjadi kesalahan. Silakan coba lagi.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
        
        if (error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.status === 409) {
          errorMsg = 'Email sudah terdaftar. Silakan gunakan email lain.';
        } else if (error.response.status === 400) {
          errorMsg = 'Data tidak valid. Pastikan semua field diisi dengan benar.';
        } else if (error.response.status === 403) {
          errorMsg = 'Anda tidak memiliki izin untuk membuat akun.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMsg = 'Tidak ada respons dari server. Periksa koneksi internet Anda.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMsg = `Error: ${error.message}`;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setError(false);
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  const roleOptions = [
    { value: 'RECRUITER', label: 'Recruiter' },
    { value: 'GENERAL_MANAGER', label: 'General Manager' },
    { value: 'KOORDINATOR_LAPANGAN', label: 'Koordinator Lapangan' },
    { value: 'KARYAWAN', label: 'Karyawan' }
  ];

  // Development helper function to reset mock data (hidden in production)
  const resetMockData = () => {
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('mockStaffList');
      console.log('Mock staff list has been reset');
      // Show success message
      setError(true);
      setErrorMessage('Mock staff list has been reset for development');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Buat Akun Staf Internal
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Isi formulir di bawah untuk membuat akun staf internal baru.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Name Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="name"
                label="Nama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!nameError}
                helperText={nameError}
                required
              />
            </Grid>

            {/* Email Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                required
              />
            </Grid>

            {/* Role Field */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!roleError} required>
                <InputLabel id="role-label">Posisi</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  value={role}
                  label="Posisi"
                  onChange={(e) => setRole(e.target.value)}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {roleError && <FormHelperText>{roleError}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Password Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="password"
                label="Kata Sandi"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Confirm Password Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="confirmPassword"
                label="Konfirmasi Kata Sandi"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  component={Link}
                  to="/admin/internal-staff"
                  variant="outlined"
                  color="secondary"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Error Snackbar */}
      <Snackbar 
        open={error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar 
        open={success} 
        autoHideDuration={2000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          Akun berhasil dibuat! Pengalihan halaman...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateAccountPage; 