import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route LandingPage */}
        <Route path="/" element={<LandingPage />} />
        {/* dll */}
      </Routes>
    </Router>
  );
}

export default App;
