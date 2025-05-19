import Interview from '../models/interviewModel.js';
import JobApplication from '../models/jobApplicationModel.js';
import { v4 as uuidv4 } from 'uuid';

// Helper: Cek bentrok jadwal wawancara (±1 jam)
const checkSchedulingConflicts = async (interviewDate, excludeInterviewId = null) => {
  const allInterviews = await Interview.find();

  const newTime = new Date(interviewDate).getTime();

  return allInterviews.find(interview => {
    if (excludeInterviewId && interview.id === excludeInterviewId) return false;

    const existingTime = new Date(interview.interviewDate).getTime();
    return Math.abs(existingTime - newTime) < 3600000;
  });
};

// ✅ Create
export const createInterview = async (data) => {
  const application = await JobApplication.findOne({ uuid: data.applicationId });
  if (!application) throw new Error('Application not found');

  const conflict = await checkSchedulingConflicts(data.interviewDate);
  if (conflict) throw new Error('Scheduling conflict: Another interview is scheduled within 1 hour');

  const interview = new Interview({
    id: uuidv4(),
    ...data
  });

  const savedInterview = await interview.save();

  if (application.status !== 'INTERVIEW_SCHEDULED') {
    application.status = 'INTERVIEW_SCHEDULED';
    application.notes = 'Wawancara dijadwalkan';
    await application.save();
  }

  return savedInterview;
};

// ✅ Read - Get by ID
export const getInterviewById = async (id) => {
  return await Interview.findOne({ id });
};

// ✅ Read - Get by application ID
export const getInterviewByApplicationId = async (applicationId) => {
  const application = await JobApplication.findOne({ uuid: applicationId });
  if (!application) throw new Error('Application not found');

  return await Interview.findOne({ applicationId }).sort({ created_at: -1 });
};

// ✅ Read - All
export const getAllInterviews = async () => {
  return await Interview.find().sort({ interviewDate: -1 });
};

// ✅ Update
export const updateInterview = async (id, data) => {
  const interview = await Interview.findOne({ id });
  if (!interview) throw new Error('Interview not found');

  if (data.interviewDate) {
    const conflict = await checkSchedulingConflicts(data.interviewDate, id);
    if (conflict) throw new Error('Scheduling conflict: Another interview is scheduled within 1 hour');
  }

  return await Interview.findOneAndUpdate({ id }, { $set: data }, { new: true });
};

// ✅ Update candidate response
export const updateInterviewResponse = async (id, data) => {
  const interview = await Interview.findOne({ id });
  if (!interview) throw new Error('Interview not found');

  const fields = {};
  if (data.candidateAttendance !== undefined) fields.candidateAttendance = data.candidateAttendance;
  if (data.candidateResponse !== undefined) fields.candidateResponse = data.candidateResponse;
  if (data.rescheduleRequest !== undefined) fields.rescheduleRequest = data.rescheduleRequest;

  return await Interview.findOneAndUpdate({ id }, { $set: fields }, { new: true });
};

// ✅ Delete
export const deleteInterview = async (id) => {
  const interview = await Interview.findOne({ id });
  if (!interview) throw new Error('Interview not found');

  return await Interview.findOneAndDelete({ id });
};
