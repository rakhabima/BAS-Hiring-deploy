import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const interviewScheduleSchema = new mongoose.Schema({
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
    interviewDate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
        default: "SCHEDULED"
    },
    notes: {
        type: String
    },
    feedback: {
        type: String
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    meetingLink: {
        type: String
    }
}, {
    timestamps: true
});

const InterviewSchedule = mongoose.model("InterviewSchedule", interviewScheduleSchema);

export default InterviewSchedule; 