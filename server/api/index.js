// Vercel-compatible serverless handler
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import serverless from 'serverless-http';

// Import routes
import authRoute from '../routes/auth.js';
import guestRoute from '../routes/guest.js';
import jobVacancyRoute from '../routes/jobVacancy.js';
import outsourceRoute from '../routes/outsourcing.js';
import userRoute from '../routes/user.js';

// Import database connection
import connectDB from '../db/connectDb.js';

// Initialize
dotenv.config();
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check route - no DB connection needed
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "BAS Hiring API is running" });
});

// DB middleware for routes that need database access
const dbMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
};

// Routes with database connection
app.use("/auth", dbMiddleware, authRoute);
app.use("/guest", dbMiddleware, guestRoute);
app.use("/jobVacancy", dbMiddleware, jobVacancyRoute);
app.use("/outsource", dbMiddleware, outsourceRoute);
app.use("/user", dbMiddleware, userRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Use serverless handler for Vercel
const handler = serverless(app);
export default handler; 