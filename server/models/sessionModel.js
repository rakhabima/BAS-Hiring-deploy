import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const sessionSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    userId: {
        type: String,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Index to automatically expire sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.statics.createSession = function(userId, token, expiresAt, ipAddress, userAgent) {
    return this.create({
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent
    });
};

sessionSchema.methods.invalidateSession = function() {
    this.isActive = false;
    return this.save();
};

const Session = mongoose.model("Session", sessionSchema);

export default Session; 