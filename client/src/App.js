import { Box } from '@mui/material';
import React from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThemeProvider from './components/ThemeProvider';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Wrapper component to conditionally render Navbar
const AppContent = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/register', '/forgot-password'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {shouldShowNavbar && <Navbar />}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          {/* Default route LandingPage */}
          <Route path="/" element={<LandingPage />} />
          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />
          {/* Register route */}
          <Route path="/register" element={<RegisterPage />} />
          {/* Forgot Password route */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {/* dll */}
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
