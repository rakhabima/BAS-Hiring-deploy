// Monolithic server for Railway deployment
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Import API routes
import authRoute from './server/routes/auth.js';
import guestRoute from './server/routes/guest.js';
import interviewRoute from './server/routes/interview.js';
import jobApplicationRoute from './server/routes/jobApplication.js';
import jobVacancyRoute from './server/routes/jobVacancy.js';
import notificationRoute from './server/routes/notification.js';
import outsourceRoute from './server/routes/outsourcing.js';
import technicalTestRoute from './server/routes/technicalTest.js';
import uploadRoute from './server/routes/upload.js';
import userRoute from './server/routes/user.js';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5555;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: '*', // Allow any origin for API access
  credentials: true
}));

// Health check route - responds before DB connection to ensure Railway healthcheck passes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'BAS Hiring Monolithic Application is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - all prefixed with /api
app.use('/api/auth', authRoute);
app.use('/api/guest', guestRoute);
app.use('/api/jobVacancy', jobVacancyRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/outsource', outsourceRoute);
app.use('/api/user', userRoute);
app.use('/api/jobApplication', jobApplicationRoute);
app.use('/api/interviews', interviewRoute);
app.use('/api/technicalTest', technicalTestRoute);
app.use('/api/upload', uploadRoute);

// API root for checking connectivity
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'BAS Hiring API is available',
    time: new Date().toISOString()
  });
});

// Check if frontend build exists
const frontendBuildPath = path.join(__dirname, 'client/build');
const frontendExists = fs.existsSync(frontendBuildPath) && 
                      fs.existsSync(path.join(frontendBuildPath, 'index.html'));

// Serve static frontend assets if they exist
if (frontendExists) {
  console.log('Frontend build detected, serving static files');
  app.use(express.static(frontendBuildPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    // Skip API routes (already handled)
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    }
  });
} else {
  console.log('Frontend build not found, serving API only');
  // Serve a simple HTML page for the root
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BAS Hiring API</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; }
            .container { max-width: 800px; margin: 0 auto; }
            .info { background: #f4f4f4; padding: 20px; border-radius: 5px; }
            .success { color: green; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>BAS Hiring API Server</h1>
            <div class="info">
              <p class="success">✅ API Server Running</p>
              <p>The API is available at <code>/api</code> endpoints.</p>
              <p>Frontend build was not found. Please ensure client build completes successfully.</p>
            </div>
          </div>
        </body>
      </html>
    `);
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

// listen() hanya kalau file ini dijalankan langsung (`node monolithic.js`).
// Saat diimpor — oleh api/index.js di Vercel, atau oleh security.check.js yang
// menyalakan servernya sendiri di port acak — app cukup diekspor, karena
// listener kedua akan menahan proses tetap hidup selamanya.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}


export default app; 