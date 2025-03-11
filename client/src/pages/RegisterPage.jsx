import { Visibility, VisibilityOff } from '@mui/icons-material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Snackbar,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useColorMode } from '../components/ThemeProvider';
import { authService } from '../services/api';

const RegisterPage = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Check if all fields are filled
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(true);
      setErrorMessage('Semua field harus diisi');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(true);
      setErrorMessage('Format email tidak valid');
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(true);
      setErrorMessage('Kata sandi dan konfirmasi kata sandi tidak cocok');
      return false;
    }

    // Check if password is at least 6 characters
    if (formData.password.length < 6) {
      setError(true);
      setErrorMessage('Kata sandi harus minimal 6 karakter');
      return false;
    }

    // Check if user agreed to terms
    if (!agreeToTerms) {
      setError(true);
      setErrorMessage('Anda harus menyetujui Syarat dan Ketentuan');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the auth service to register
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Registration successful, redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setError(true);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setError(false);
  };

  return (
    <Container 
      maxWidth="xs" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Theme toggle button */}
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        sx={{ 
          position: 'absolute',
          top: 16,
          right: 16
        }}
      >
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>

      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          width: '100%'
        }}
      >
        {/* BAS Logo */}
        <Box sx={{ mb: 2 }}>
          <img 
            src="/assets/baslogo.png" 
            alt="BAS Logo" 
            style={{ 
              width: 120, 
              height: 'auto',
              filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none'
            }} 
          />
        </Box>

        {/* Register Title */}
        <Typography 
          component="h1" 
          variant="h5" 
          sx={{ 
            mb: 4, 
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}
        >
          Silahkan isi form di bawah ini.
        </Typography>

        {/* Register Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {/* Full Name Field */}
          <Typography 
            component="label" 
            htmlFor="name" 
            sx={{ 
              fontWeight: 'medium',
              display: 'block',
              mb: 1
            }}
          >
            Nama Lengkap<span style={{ color: 'red' }}>*</span>
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            placeholder="Masukkan nama lengkap"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            sx={{ 
              mb: 2,
              mt: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
              }
            }}
          />

          {/* Email Field */}
          <Typography 
            component="label" 
            htmlFor="email" 
            sx={{ 
              fontWeight: 'medium',
              display: 'block',
              mb: 1
            }}
          >
            Alamat email<span style={{ color: 'red' }}>*</span>
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            placeholder="Masukkan alamat email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ 
              mb: 2,
              mt: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
              }
            }}
          />

          {/* Password Field */}
          <Typography 
            component="label" 
            htmlFor="password" 
            sx={{ 
              fontWeight: 'medium',
              display: 'block',
              mb: 1
            }}
          >
            Kata sandi<span style={{ color: 'red' }}>*</span>
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            placeholder="Masukkan kata sandi"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
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
              ),
            }}
            sx={{ 
              mb: 2,
              mt: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
              }
            }}
          />

          {/* Confirm Password Field */}
          <Typography 
            component="label" 
            htmlFor="confirmPassword" 
            sx={{ 
              fontWeight: 'medium',
              display: 'block',
              mb: 1
            }}
          >
            Konfirmasi kata sandi<span style={{ color: 'red' }}>*</span>
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            placeholder="Masukkan kata sandi"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 2,
              mt: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
              }
            }}
          />

          {/* Terms and Conditions Checkbox */}
          <FormControlLabel
            control={
              <Checkbox 
                value="agree" 
                color="primary" 
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                Saya menyatakan memahami dan setuju dengan Syarat dan Ketentuan & Kebijakan Privasi PT Barokah Amanah Sentosa
              </Typography>
            }
            sx={{ mb: 2 }}
          />

          {/* Register Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            sx={{ 
              py: 1.5,
              mb: 2,
              backgroundColor: theme.palette.mode === 'light' ? '#3f51b5' : '#90caf9',
              color: theme.palette.mode === 'light' ? '#fff' : '#000',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'light' ? '#002984' : '#42a5f5',
              }
            }}
          >
            Daftar
          </Button>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Sudah memiliki akun?{' '}
              <MuiLink 
                component={Link} 
                to="/login" 
                sx={{ 
                  fontWeight: 'medium',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Masuk
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar open={error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RegisterPage; 