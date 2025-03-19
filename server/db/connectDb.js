import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log("Using existing MongoDB connection");
        return;
    }

    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
        console.error("MongoDB URI not found in environment variables");
        return;
    }

    try {
        await mongoose.connect(mongoURI, {
            maxPoolSize: 10, // Increased for Railway's persistent environment
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 30000,
        });
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        // Don't throw here, let the request continue even if DB connection fails
    }
};

export default connectDB;
