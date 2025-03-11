import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["ADMIN", "RECRUITER", "GENERAL_MANAGER", "CANDIDATE", "KOORDINATOR_LAPANGAN", "VENDOR", "GUEST"],
        default: "GUEST"
    },
    status: {
        type: Boolean,
        default: true
    }
});

const User = mongoose.model("User", userSchema);

export default User;
