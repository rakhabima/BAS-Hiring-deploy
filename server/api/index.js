// Vercel Serverless Function handler
import serverless from 'serverless-http';
import app from '../server.js';

// Simple health check for faster response
const isHealthCheck = (req) => req.method === 'GET' && (req.url === '/' || req.url === '/api');

// Optimized handler for Vercel
export default async function handler(req, res) {
  // Quick response for health checks to avoid MongoDB connection
  if (isHealthCheck(req)) {
    return res.status(200).json({ status: 'ok', message: 'BAS Hiring API is running' });
  }
  
  // Use serverless for all other routes
  const serverlessHandler = serverless(app);
  return serverlessHandler(req, res);
} 