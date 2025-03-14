import { Box } from '@mui/material';
import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThemeProvider from './components/ThemeProvider';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateAccountPage from './pages/admin/CreateAccountPage';
import InternalStaffPage from './pages/admin/InternalStaffPage';

// Protected Route component to check if user is authenticated
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  return isAuthenticated ? element : <Navigate to="/login" />;
};

// Admin Route component to check if user is authenticated and has ADMIN role
const AdminRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  if (user.role !== 'ADMIN') {
    return <Navigate to="/home" />;
  }
  
  return element;
};

// Wrapper component to conditionally render Navbar
const AppContent = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/register', '/forgot-password'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
    }}>
      {shouldShowNavbar && <Navbar />}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Routes>
          {/* Default route LandingPage */}
          <Route path="/" element={<LandingPage />} />

          {/* Section routes that redirect to LandingPage with appropriate section IDs */}
          <Route path="/home" element={<LandingPage section="home" />} />
          <Route path="/about" element={<LandingPage section="about" />} />
          <Route path="/services" element={<LandingPage section="services" />} />
          <Route path="/careers" element={<LandingPage section="prinsip" />} />
          <Route path="/contact" element={<LandingPage section="contact" />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Admin routes */}
          <Route path="/admin/internal-staff" element={<AdminRoute element={<InternalStaffPage />} />} />
          <Route path="/admin/create-account" element={<AdminRoute element={<CreateAccountPage />} />} />
          
          {/* Protected Dashboard routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute element={<div>Admin Dashboard</div>} />} />
          <Route path="/recruiter/dashboard" element={<ProtectedRoute element={<div>Recruiter Dashboard</div>} />} />
          <Route path="/gm/dashboard" element={<ProtectedRoute element={<div>General Manager Dashboard</div>} />} />
          <Route path="/candidate/dashboard" element={<ProtectedRoute element={<div>Candidate Dashboard</div>} />} />
          <Route path="/korlap/dashboard" element={<ProtectedRoute element={<div>Koordinator Lapangan Dashboard</div>} />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
