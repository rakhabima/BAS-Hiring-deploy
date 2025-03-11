import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const jobApplicationSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    candidateId: {
        type: String,
        ref: "User",
        required: true
    },
    jobPostingId: {
        type: String,
        ref: "JobPosting",
        required: true
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["PENDING", "REVIEWING", "INTERVIEW_SCHEDULED", "TECHNICAL_TEST", "REJECTED", "ACCEPTED", "ON_JOB"],
        default: "PENDING"
    },
    resume: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String
    },
    additionalDocuments: [{
        name: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

export default JobApplication; 