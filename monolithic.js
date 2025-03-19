// Monolithic server for Railway deployment
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API routes
import connectDB from './server/db/connectDb.js';
import authRoute from './server/routes/auth.js';
import guestRoute from './server/routes/guest.js';
import jobVacancyRoute from './server/routes/jobVacancy.js';
import outsourceRoute from './server/routes/outsourcing.js';
import userRoute from './server/routes/user.js';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Health check route - responds before DB connection to ensure Railway healthcheck passes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'BAS Hiring Monolithic Application is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoute);
app.use('/api/guest', guestRoute);
app.use('/api/jobVacancy', jobVacancyRoute);
app.use('/api/outsource', outsourceRoute);
app.use('/api/user', userRoute);

// Connect to MongoDB
try {
  connectDB();
  console.log('MongoDB connected');
} catch (error) {
  console.error('MongoDB connection error:', error);
}

// Serve static frontend assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 