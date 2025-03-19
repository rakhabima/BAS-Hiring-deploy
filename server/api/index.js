// CommonJS serverless handler for Vercel
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');

// Initialize
require('dotenv').config();
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

// Simple fallback routes to avoid errors
app.use("/auth", (req, res) => {
  res.status(200).json({ message: "Auth endpoint ready" });
});

app.use("/guest", (req, res) => {
  res.status(200).json({ message: "Guest endpoint ready" });
});

app.use("/jobVacancy", (req, res) => {
  res.status(200).json({ message: "Job Vacancy endpoint ready" });
});

app.use("/outsource", (req, res) => {
  res.status(200).json({ message: "Outsource endpoint ready" });
});

app.use("/user", (req, res) => {
  res.status(200).json({ message: "User endpoint ready" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Export as serverless handler
module.exports = serverless(app); 