import JobApplication from "../models/jobApplicationModel.js";

/**
 * Submit a new job application
 * @param {Object} applicationData - The application data to save
 * @returns {Promise<Object>} - The saved application object
 */
export const submitApplication = async (applicationData) => {
  try {
    // Create a new job application with all the explicit fields
    const newApplication = new JobApplication(applicationData);

    // Save the application
    return await newApplication.save();
  } catch (error) {
    console.error("Error submitting application:", error);
    throw error;
  }
};

/**
 * Get job applications for a candidate
 * @param {String} candidateId - The ID of the candidate
 * @returns {Promise<Array>} - Array of job application objects
 */
export const getCandidateApplications = async (candidateId) => {
  try {
    // Find all applications for this candidate, populate job posting details
    const applications = await JobApplication.find({ candidateId })
      .populate({
        path: 'jobPostingId',
        select: 'title companyName jobPosition location salary deadline'
      })
      .sort({ submissionDate: -1 });
    
    return applications;
  } catch (error) {
    console.error("Error getting candidate applications:", error);
    throw error;
  }
};

/**
 * Get a job application by ID
 * @param {String} uuid - The application UUID
 * @returns {Promise<Object>} - The job application object
 */
export const getApplicationById = async (uuid) => {
  try {
    // Find application by UUID, populate job posting details
    const application = await JobApplication.findOne({ uuid })
      .populate({
        path: 'jobPostingId',
        select: 'title companyName jobPosition location salary deadline'
      });
    
    return application;
  } catch (error) {
    console.error("Error getting application by ID:", error);
    throw error;
  }
}; 