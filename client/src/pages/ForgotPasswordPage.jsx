import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { Box, Button, Container, IconButton, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import { useColorMode } from '../components/ThemeProvider';

const ForgotPasswordPage = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();

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

        {/* Forgot Password Title */}
        <Typography 
          component="h1" 
          variant="h5" 
          sx={{ 
            mb: 4, 
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}
        >
          Lupa Kata Sandi
        </Typography>

        {/* Placeholder content */}
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
          Halaman reset kata sandi sedang dalam pengembangan.
        </Typography>

        {/* Back to Login Button */}
        <Button
          component={Link}
          to="/login"
          variant="contained"
          sx={{ 
            mt: 2,
            backgroundColor: theme.palette.mode === 'light' ? '#3f51b5' : '#90caf9',
            color: theme.palette.mode === 'light' ? '#fff' : '#000',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'light' ? '#002984' : '#42a5f5',
            }
          }}
        >
          Kembali ke Halaman Login
        </Button>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage; 