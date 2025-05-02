import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const interviewSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true
  },
  applicationId: {
    type: String,
    required: true,
    ref: "JobApplication"
  },
  interviewDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String
  },
  status: {
    type: String,
    enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
    default: "SCHEDULED"
  },
  notes: {
    type: String
  },
  candidateAttendance: {
    type: String,
    enum: ["hadir", "tidak_hadir", ""],
    default: ""
  },
  candidateResponse: {
    type: Boolean,
    default: false
  },
  rescheduleRequest: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Interview = mongoose.model("Interview", interviewSchema);

// Get interview by ID
export const getInterviewById = async (id) => {
  try {
    return await Interview.findOne({ id });
  } catch (error) {
    console.error('Error getting interview by ID:', error);
    throw error;
  }
};

// Get interview by application ID
export const getInterviewByApplicationId = async (applicationId) => {
  try {
    return await Interview.findOne({ applicationId }).sort({ created_at: -1 });
  } catch (error) {
    console.error('Error getting interview by application ID:', error);
    throw error;
  }
};

// Create a new interview
export const createInterview = async (interviewData) => {
  try {
    const interview = new Interview({
      id: uuidv4(),
      applicationId: interviewData.applicationId,
      interviewDate: interviewData.interviewDate,
      location: interviewData.location,
      isOnline: interviewData.isOnline,
      meetingLink: interviewData.meetingLink,
      status: interviewData.status,
      notes: interviewData.notes
    });
    
    return await interview.save();
  } catch (error) {
    console.error('Error creating interview:', error);
    throw error;
  }
};

// Update an existing interview
export const updateInterview = async (id, interviewData) => {
  try {
    const updateData = {};
    
    if (interviewData.interviewDate !== undefined) updateData.interviewDate = interviewData.interviewDate;
    if (interviewData.location !== undefined) updateData.location = interviewData.location;
    if (interviewData.isOnline !== undefined) updateData.isOnline = interviewData.isOnline;
    if (interviewData.meetingLink !== undefined) updateData.meetingLink = interviewData.meetingLink;
    if (interviewData.status !== undefined) updateData.status = interviewData.status;
    if (interviewData.notes !== undefined) updateData.notes = interviewData.notes;
    
    return await Interview.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating interview:', error);
    throw error;
  }
};

// Update candidate response (attendance confirmation)
export const updateInterviewResponse = async (id, responseData) => {
  try {
    const updateData = {};
    
    if (responseData.candidateAttendance !== undefined) updateData.candidateAttendance = responseData.candidateAttendance;
    if (responseData.candidateResponse !== undefined) updateData.candidateResponse = responseData.candidateResponse;
    if (responseData.rescheduleRequest !== undefined) updateData.rescheduleRequest = responseData.rescheduleRequest;
    
    return await Interview.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating interview response:', error);
    throw error;
  }
};

// Delete an interview
export const deleteInterview = async (id) => {
  try {
    return await Interview.findOneAndDelete({ id });
  } catch (error) {
    console.error('Error deleting interview:', error);
    throw error;
  }
};

// Get all interviews
export const getAllInterviews = async () => {
  try {
    return await Interview.find().sort({ interviewDate: -1 });
  } catch (error) {
    console.error('Error getting all interviews:', error);
    throw error;
  }
}; 