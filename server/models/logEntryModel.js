import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const logEntrySchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    activity: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        ref: "User"
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    level: {
        type: String,
        enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
        default: "INFO"
    }
}, {
    timestamps: true
});

logEntrySchema.statics.logActivity = function(activity, userId, details, level = "INFO", ipAddress = null, userAgent = null) {
    return this.create({
        activity,
        userId,
        details,
        level,
        ipAddress,
        userAgent
    });
};

const LogEntry = mongoose.model("LogEntry", logEntrySchema);

export default LogEntry; 