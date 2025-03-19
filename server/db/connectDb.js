import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log("Using existing MongoDB connection");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 30000,
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        // Don't throw here, let the request continue even if DB connection fails
    }
};

export default connectDB;
