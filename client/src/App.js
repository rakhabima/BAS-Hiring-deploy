import { Box } from '@mui/material';
import React, { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import NotificationSnackbar from './components/NotificationSnackbar';
import ThemeProvider from './components/ThemeProvider';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CreateAccountPage from './pages/admin/CreateAccountPage';
import CreateServicePage from './pages/admin/CreateServicePage';
import EditServicePage from './pages/admin/EditServicePage';
import InternalStaffPage from './pages/admin/InternalStaffPage';
import ServiceDetailPage from './pages/admin/ServiceDetailPage';
import ServicePublicationsPage from './pages/admin/ServicePublicationsPage';
import UserDetailPage from './pages/admin/UserDetailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/gm/DashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfileUser from './pages/ProfileUser';
import ApplicationList from './pages/public/ApplicationList';
import DetailOnJob from './pages/public/DetailOnJob';
import DetailTechnicalTest from './pages/public/DetailTechnicalTest';
import DetailWawancara from './pages/public/DetailWawancara';
import JobApplicationEditForm from './pages/public/JobApplicationEditForm';
import JobApplicationForm from './pages/public/JobApplicationForm';
import OutsourcingRequestPage from './pages/public/OutsourcingRequestPage';
import PortalInformasi from './pages/public/PortalInformasi';
import PublicJobDetailPage from './pages/public/PublicJobDetailPage';
import PublicJobListPage from './pages/public/PublicJobListPage';
import RingkasanFormulir from './pages/public/RingkasanFormulir';
import PublicServiceDetailPage from './pages/PublicServiceDetailPage';
import PublicServiceListPage from './pages/PublicServiceListPage';
import CandidateDetailPage from './pages/recruiter/CandidateDetailPage';
import CandidateInterviewPage from './pages/recruiter/CandidateInterviewPage';
import CandidateInterviewPreview from './pages/recruiter/CandidateInterviewPreview';
import CandidatesPage from './pages/recruiter/CandidatesPage';
import CreateJobPage from './pages/recruiter/CreateJobPage';
import EditJobPage from './pages/recruiter/EditJobPage';
import JobDetailPage from './pages/recruiter/JobDetailPage';
import JobPublicationsPage from './pages/recruiter/JobPublicationsPage';
import SchedulingPage from './pages/recruiter/SchedulingPage';
import TechnicalTestForm from './pages/recruiter/TechnicalTestForm';
import TechnicalTestPreview from './pages/recruiter/TechnicalTestPreview';
import RegisterPage from './pages/RegisterPage';

// ScrollToTop component that handles URL hash fragments for scrolling to sections
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes without hash
    if (!hash) {
      window.scrollTo(0, 0);
    }
    // Handle hash fragment scrolling
    else {
      // First attempt with a longer delay to ensure DOM is ready
      const scrollToElement = () => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return true; // Element found and scrolled
        }
        return false; // Element not found
      };

      // Initial delay
      setTimeout(() => {
        // If first attempt fails, try a few more times with increasing delay
        if (!scrollToElement()) {
          // Try again after 300ms
          setTimeout(() => {
            if (!scrollToElement()) {
              // One final attempt after 600ms
              setTimeout(scrollToElement, 600);
            }
          }, 300);
        }
      }, 100);
    }
  }, [pathname, hash]);

  return null;
}

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

// GM Route component to check if user is authenticated and has GENERAL_MANAGER role
const GMRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  if (user.role !== 'GENERAL_MANAGER') {
    return <Navigate to="/home" />;
  }
  
  return element;
};

// Recruiter Route component to check if user is authenticated and has RECRUITER role
const RecruiterRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  if (user.role !== 'RECRUITER') {
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
      <ScrollToTop />
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

          {/* Public Service pages - accessible to all users */}
          <Route path="/layanan/request" element={<OutsourcingRequestPage />} />
          <Route path="/layanan/:id" element={<PublicServiceDetailPage />} />
          <Route path="/layanan" element={<PublicServiceListPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Profile route - accessible to all authenticated users */}
          <Route path="/profil" element={<ProtectedRoute element={<ProfileUser />} />} />
          
          {/* Admin routes */}
          <Route path="/admin/internal-staff" element={<AdminRoute element={<InternalStaffPage />} />} />
          <Route path="/admin/create-account" element={<AdminRoute element={<CreateAccountPage />} />} />
          <Route path="/admin/staff/:uuid" element={<AdminRoute element={<UserDetailPage />} />} />
          
          {/* Protected Dashboard routes */}
          <Route path="/admin/dashboard" element={<AdminRoute element={<AdminDashboardPage />} />} />
          <Route path="/recruiter/dashboard" element={<RecruiterRoute element={<CandidatesPage />} />} />
          <Route path="/gm/dashboard" element={<GMRoute element={<DashboardPage />} />} />
          
          {/* GM Routes - Service Publications */}
          <Route path="/gm/service-publications" element={<GMRoute element={<ServicePublicationsPage />} />} />
          <Route path="/gm/service-publications/create" element={<GMRoute element={<CreateServicePage />} />} />
          <Route path="/gm/service-publications/edit/:id" element={<GMRoute element={<EditServicePage />} />} />
          <Route path="/gm/service-publications/detail/:id" element={<GMRoute element={<ServiceDetailPage />} />} />
          
          <Route path="/candidate/dashboard" element={<ProtectedRoute element={<div>Candidate Dashboard</div>} />} />
          <Route path="/korlap/dashboard" element={<ProtectedRoute element={<div>Koordinator Lapangan Dashboard</div>} />} />
          
          {/* Recruiter Routes */}
          <Route path="/recruiter/candidate-detail/:candidateId" element={<RecruiterRoute element={<CandidateDetailPage />} />} />
          <Route path="/recruiter/candidate-interview/:candidateId" element={<RecruiterRoute element={<CandidateInterviewPage />} />} />
          <Route path="/recruiter/candidate-interview-preview/:candidateId" element={<RecruiterRoute element={<CandidateInterviewPreview />} />} />
          <Route path="/recruiter/technical-test/:applicationId" element={<RecruiterRoute element={<TechnicalTestForm />} />} />
          <Route path="/recruiter/technical-test-preview/:applicationId" element={<RecruiterRoute element={<TechnicalTestPreview />} />} />
          <Route path="/recruiter/service-form" element={<RecruiterRoute element={<div>Outsourcing Service Form</div>} />} />
          <Route path="/recruiter/scheduling" element={<RecruiterRoute element={<SchedulingPage />} />} />
          
          {/* Job Vacancy Routes */}
          <Route path="/recruiter/job-publications" element={<RecruiterRoute element={<JobPublicationsPage />} />} />
          <Route path="/recruiter/job-publications/create" element={<RecruiterRoute element={<CreateJobPage />} />} />
          <Route path="/recruiter/job-publications/edit/:id" element={<RecruiterRoute element={<EditJobPage />} />} />
          <Route path="/recruiter/job-publications/:id" element={<RecruiterRoute element={<JobDetailPage />} />} />
          
          {/* Public Job Vacancy Routes */}
          <Route path="/lowongan" element={<PublicJobListPage />} />
          <Route path="/lowongan/:id" element={<PublicJobDetailPage />} />
          <Route path="/lowongan/:id/apply" element={<ProtectedRoute element={<JobApplicationForm />} />} />
          
          {/* Candidate Routes - Job Application Information Portal */}
          <Route path="/candidate/portal-informasi" element={<ProtectedRoute element={<ApplicationList />} />} />
          <Route path="/candidate/portal-informasi/:uuid" element={<ProtectedRoute element={<PortalInformasi />} />} />
          <Route path="/candidate/portal-informasi/ringkasan-formulir/:uuid" element={<ProtectedRoute element={<RingkasanFormulir />} />} />
          <Route path="/candidate/portal-informasi/detail-wawancara/:uuid" element={<ProtectedRoute element={<DetailWawancara />} />} />
          <Route path="/candidate/portal-informasi/detail-technical-test/:uuid" element={<ProtectedRoute element={<DetailTechnicalTest />} />} />
          <Route path="/candidate/portal-informasi/detail-on-job/:uuid" element={<ProtectedRoute element={<DetailOnJob />} />} />
          <Route path="/candidate/portal-informasi/edit-formulir/:uuid" element={<ProtectedRoute element={<JobApplicationEditForm />} />} />
          
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
      <NotificationSnackbar />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
