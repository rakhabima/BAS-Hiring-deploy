import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import JobApplication from './models/jobApplicationModel.js';
import apiRoutes from './routes/index.js';
import { createInitialRolesAndUsers } from './services/authService.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Global query cache
global.queryCache = {};

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// API routes
app.use('/api', apiRoutes);

// Serve static frontend from build directory in production
if (process.env.NODE_ENV === 'production') {
  // Convert ESM __dirname equivalent
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Set static folder
  const staticPath = path.join(__dirname, '../client/dist');
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Create MongoDB indexes for performance optimization
const createIndexes = async () => {
  try {
    console.log('Creating MongoDB indexes for performance optimization...');
    
    // Create indexes for JobApplication collection
    await JobApplication.collection.createIndex({ submissionDate: -1 });
    await JobApplication.collection.createIndex({ status: 1 });
    await JobApplication.collection.createIndex({ candidateId: 1 });
    await JobApplication.collection.createIndex({ posisi_dilamar: 1 });
    await JobApplication.collection.createIndex({ nama_ktp: 'text' });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create indexes after successful connection
    await createIndexes();
    
    // Create initial roles and admin user
    try {
      await createInitialRolesAndUsers();
    } catch (err) {
      console.error('Error creating initial data:', err);
    }
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    process.exit(1);
  });

export default app; 