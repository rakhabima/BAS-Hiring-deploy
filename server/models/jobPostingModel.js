import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const jobPostingSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    datePosted: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["ACTIVE", "CLOSED", "DRAFT"],
        default: "DRAFT"
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        enum: ["FULL_TIME", "PART_TIME", "CONTRACT"],
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    createdBy: {
        type: String,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);

export default JobPosting; 