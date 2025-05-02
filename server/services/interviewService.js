import * as interviewModel from '../models/interviewModel.js';
import JobApplication from '../models/jobApplicationModel.js';

// Helper function to check for scheduling conflicts with a 1-hour buffer
const checkSchedulingConflicts = async (interviewDate, excludeInterviewId = null) => {
  try {
    // Get all scheduled interviews
    const allInterviews = await interviewModel.getAllInterviews();
    
    // Convert the new interview time to milliseconds
    const newInterviewTime = new Date(interviewDate).getTime();
    
    // Check if any existing interview conflicts with the new one (1-hour buffer)
    const conflictingInterview = allInterviews.find(interview => {
      // Skip checking against the interview being updated
      if (excludeInterviewId && interview.id === excludeInterviewId) {
        return false;
      }
      
      const existingInterviewTime = new Date(interview.interviewDate).getTime();
      
      // Calculate time difference in milliseconds (1 hour = 3600000 milliseconds)
      const timeDifference = Math.abs(existingInterviewTime - newInterviewTime);
      
      // If the time difference is less than 1 hour, there is a conflict
      return timeDifference < 3600000;
    });
    
    return conflictingInterview;
  } catch (error) {
    console.error('Error checking scheduling conflicts:', error);
    throw error;
  }
};

// Create a new interview
export const createInterview = async (interviewData) => {
  try {
    // Check if application exists
    const application = await JobApplication.findOne({ uuid: interviewData.applicationId });
    if (!application) {
      throw new Error('Application not found');
    }

    // Check for scheduling conflicts
    const conflictingInterview = await checkSchedulingConflicts(interviewData.interviewDate);
    if (conflictingInterview) {
      throw new Error('Scheduling conflict: Another interview is scheduled within 1 hour of this time');
    }

    // Create interview
    const interview = await interviewModel.createInterview(interviewData);
    
    // Update application status if not already set
    if (application.status !== 'INTERVIEW_SCHEDULED') {
      application.status = 'INTERVIEW_SCHEDULED';
      application.notes = 'Wawancara dijadwalkan';
      await application.save();
    }
    
    return interview;
  } catch (error) {
    console.error('Error in createInterview service:', error);
    throw error;
  }
};

// Get interview by ID
export const getInterviewById = async (id) => {
  try {
    return await interviewModel.getInterviewById(id);
  } catch (error) {
    console.error('Error in getInterviewById service:', error);
    throw error;
  }
};

// Get interview by application ID
export const getInterviewByApplicationId = async (applicationId) => {
  try {
    // Check if application exists
    const application = await JobApplication.findOne({ uuid: applicationId });
    if (!application) {
      throw new Error('Application not found');
    }
    
    return await interviewModel.getInterviewByApplicationId(applicationId);
  } catch (error) {
    console.error('Error in getInterviewByApplicationId service:', error);
    throw error;
  }
};

// Update an existing interview
export const updateInterview = async (id, interviewData) => {
  try {
    // Check if interview exists
    const interview = await interviewModel.getInterviewById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    // If interview date is being updated, check for scheduling conflicts
    if (interviewData.interviewDate) {
      const conflictingInterview = await checkSchedulingConflicts(interviewData.interviewDate, id);
      if (conflictingInterview) {
        throw new Error('Scheduling conflict: Another interview is scheduled within 1 hour of this time');
      }
    }
    
    return await interviewModel.updateInterview(id, interviewData);
  } catch (error) {
    console.error('Error in updateInterview service:', error);
    throw error;
  }
};

// Update candidate response
export const updateInterviewResponse = async (id, responseData) => {
  try {
    // Check if interview exists
    const interview = await interviewModel.getInterviewById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    return await interviewModel.updateInterviewResponse(id, responseData);
  } catch (error) {
    console.error('Error in updateInterviewResponse service:', error);
    throw error;
  }
};

// Get all interviews
export const getAllInterviews = async () => {
  try {
    return await interviewModel.getAllInterviews();
  } catch (error) {
    console.error('Error in getAllInterviews service:', error);
    throw error;
  }
};

// Delete an interview
export const deleteInterview = async (id) => {
  try {
    // Check if interview exists
    const interview = await interviewModel.getInterviewById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    return await interviewModel.deleteInterview(id);
  } catch (error) {
    console.error('Error in deleteInterview service:', error);
    throw error;
  }
}; 