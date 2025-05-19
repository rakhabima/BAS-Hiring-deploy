import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const interviewSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  applicationId: { type: String, required: true, ref: "JobApplication" },
  interviewDate: { type: Date, required: true },
  location: { type: String, required: true },
  isOnline: { type: Boolean, default: false },
  meetingLink: { type: String },
  status: {
    type: String,
    enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
    default: "SCHEDULED"
  },
  notes: { type: String },
  candidateAttendance: {
    type: String,
    enum: ["hadir", "tidak_hadir", ""],
    default: ""
  },
  candidateResponse: { type: Boolean, default: false },
  rescheduleRequest: { type: String }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

export default mongoose.model("Interview", interviewSchema);
