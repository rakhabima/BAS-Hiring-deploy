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

const LoginPage = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(true);
      setErrorMessage('Email dan kata sandi harus diisi');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use the auth service to login
      const response = await authService.login({ email, password });
      
      // Store user info in localStorage if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem('userEmail', email);
      } else {
        localStorage.removeItem('userEmail');
      }
      
      // Redirect based on user role
      const { role } = response.user;
      
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'RECRUITER') {
        navigate('/recruiter/dashboard');
      } else if (role === 'GENERAL_MANAGER') {
        navigate('/gm/dashboard');
      } else if (role === 'CANDIDATE') {
        navigate('/candidate/dashboard');
      } else if (role === 'KOORDINATOR_LAPANGAN') {
        navigate('/korlap/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(true);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Akun belum terdaftar pada sistem');
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

        {/* Login Title */}
        <Typography 
          component="h1" 
          variant="h5" 
          sx={{ 
            mb: 4, 
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}
        >
          Masuk ke Akun Anda
        </Typography>

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ 
              mb: 2,
              mt: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
              }
            }}
          />

          {/* Password Field */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              component="label" 
              htmlFor="password" 
              sx={{ fontWeight: 'medium' }}
            >
              Kata sandi<span style={{ color: 'red' }}>*</span>
            </Typography>
            <MuiLink 
              component={Link} 
              to="/forgot-password" 
              variant="body2"
              sx={{ 
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Lupa kata sandi?
            </MuiLink>
          </Box>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            placeholder="Masukkan kata sandi"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

          {/* Remember Me Checkbox */}
          <FormControlLabel
            control={
              <Checkbox 
                value="remember" 
                color="primary" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label="Ingat saya"
            sx={{ mb: 2 }}
          />

          {/* Login Button */}
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
            Masuk
          </Button>

          {/* Register Link */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Belum punya akun BAS?{' '}
              <MuiLink 
                component={Link} 
                to="/register" 
                sx={{ 
                  fontWeight: 'medium',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Daftar
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

export default LoginPage; 