import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const technicalTestSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    applicationId: {
        type: String,
        ref: "JobApplication",
        required: true
    },
    recruiterId: {
        type: String,
        ref: "User",
        required: true
    },
    candidateId: {
        type: String,
        ref: "User",
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dateScheduled: {
        type: Date,
        required: true
    },
    result: {
        type: String,
        enum: ["PENDING", "PASSED", "FAILED"],
        default: "PENDING"
    },
    testLink: {
        type: String
    },
    instructions: {
        type: String
    },
    score: {
        type: Number
    },
    feedback: {
        type: String
    },
    submissionDate: {
        type: Date
    },
    submissionFile: {
        type: String
    },
    submissionNotes: {
        type: String
    },
    candidateHasCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const TechnicalTest = mongoose.model("TechnicalTest", technicalTestSchema);

export default TechnicalTest; 