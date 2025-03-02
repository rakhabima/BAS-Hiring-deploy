import { Box } from '@mui/material';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThemeProvider from './components/ThemeProvider';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              {/* Default route LandingPage */}
              <Route path="/" element={<LandingPage />} />
              {/* dll */}
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
