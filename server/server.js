import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config"; // Menggantikan require('dotenv').config()
import express from "express";

// Import dari file lain
import connectDB from "./db/connectDb.js";
import authRoute from "./routes/auth.js";
import guestRoute from "./routes/guest.js";
import jobVacancyRoute from "./routes/jobVacancy.js";


const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS untuk semua route
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

// Koneksi ke MongoDB
connectDB();

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "BAS Hiring API is running" });
});

// Routes
app.use("/auth", authRoute);
app.use("/guest", guestRoute);
app.use("/jobVacancy", jobVacancyRoute);


// Middleware penanganan error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Jalankan app.listen hanya jika tidak dalam produksi
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
