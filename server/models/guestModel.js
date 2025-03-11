import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const guestSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically expire after 24 hours (in seconds)
    }
});

const Guest = mongoose.model("Guest", guestSchema);

export default Guest; 