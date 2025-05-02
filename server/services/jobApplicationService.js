import JobApplication from "../models/jobApplicationModel.js";
import JobPosting from "../models/jobPostingModel.js";
import User from "../models/userModel.js";

/**
 * Submit a new job application
 * @param {Object} applicationData - The application data to save
 * @returns {Promise<Object>} - The saved application object
 */
export const submitApplication = async (applicationData) => {
  try {
    // Handle nullable date fields - convert string "null" to actual null
    const dateFields = ['masa_berlaku_sim', 'masa_berlaku_stnk', 'masa_berlaku_pajak_kendaraan'];
    dateFields.forEach(field => {
      if (applicationData[field] === "null" || applicationData[field] === "") {
        applicationData[field] = null;
      }
    });

    // Ensure tipe_sim has a valid enum value
    if (!applicationData.tipe_sim || applicationData.tipe_sim === "") {
      applicationData.tipe_sim = "Tidak Punya";
    }

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
    // Find all applications for this candidate
    const applications = await JobApplication.find({ candidateId })
      .sort({ submissionDate: -1 });
    
    // Process applications to properly populate job posting details
    const populatedApplications = [];
    
    for (const application of applications) {
      try {
        // Find the job posting by UUID
        const jobPosting = await JobPosting.findOne({ 
          uuid: application.jobPostingId 
        });
        
        // Create a copy of the application as a plain object
        const appObject = application.toObject();
        
        // Manually assign job posting if found
        if (jobPosting) {
          appObject.jobPostingId = {
            title: jobPosting.title,
            companyName: jobPosting.title, // Assuming company name is in title
            jobPosition: jobPosting.jobPosition,
            location: jobPosting.location,
            salary: jobPosting.salary,
            deadline: jobPosting.deadline
          };
        }
        
        populatedApplications.push(appObject);
      } catch (err) {
        console.error(`Error populating job posting for application ${application.uuid}:`, err);
        // Include the application even if population fails
        populatedApplications.push(application.toObject());
      }
    }
    
    return populatedApplications;
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
    // Find application by UUID
    const application = await JobApplication.findOne({ uuid });
    
    if (!application) {
      return null;
    }
    
    // Convert to plain object
    const appObject = application.toObject();
    
    // Find and manually populate job posting
    try {
      const jobPosting = await JobPosting.findOne({ 
        uuid: application.jobPostingId 
      });
      
      if (jobPosting) {
        appObject.jobPostingId = {
          title: jobPosting.title,
          companyName: jobPosting.title, // Assuming company name is in title
          jobPosition: jobPosting.jobPosition,
          location: jobPosting.location,
          salary: jobPosting.salary,
          deadline: jobPosting.deadline
        };
      }
    } catch (err) {
      console.error(`Error populating job posting for application ${uuid}:`, err);
    }
    
    return appObject;
  } catch (error) {
    console.error("Error getting application by ID:", error);
    throw error;
  }
};

/**
 * Update a job application
 * @param {String} uuid - The application UUID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - The updated job application object
 */
export const updateApplication = async (uuid, updateData) => {
  try {
    // Handle nullable date fields - convert string "null" to actual null
    const dateFields = ['masa_berlaku_sim', 'masa_berlaku_stnk', 'masa_berlaku_pajak_kendaraan'];
    dateFields.forEach(field => {
      if (updateData[field] === "null" || updateData[field] === "") {
        updateData[field] = null;
      }
    });
    
    // Ensure tipe_sim has a valid enum value
    if (!updateData.tipe_sim || updateData.tipe_sim === "") {
      updateData.tipe_sim = "Tidak Punya";
    }
    
    // Get the current application to check for status changes
    const currentApplication = await JobApplication.findOne({ uuid });
    
    if (!currentApplication) {
      return null;
    }

    // Determine if status is changing
    const isStatusChanging = updateData.status && updateData.status !== currentApplication.status;
    
    // If status is changing, add a new status history entry
    if (isStatusChanging) {
      // Create a new status history entry
      const statusEntry = {
        status: updateData.status,
        timestamp: new Date(),
        notes: updateData.notes || '',
        updatedBy: updateData.updatedBy
      };
      
      // Add the new status entry to the history
      updateData.statusHistory = [...(currentApplication.statusHistory || []), statusEntry];
    }
    
    // Find and update the application
    const updatedApplication = await JobApplication.findOneAndUpdate(
      { uuid },
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedApplication) {
      return null;
    }
    
    // If status is ACCEPTED or ON_JOB, update the user's employment status
    if (updateData.status === "ACCEPTED" || updateData.status === "ON_JOB") {
      await User.findOneAndUpdate(
        { uuid: updatedApplication.candidateId },
        { $set: { employmentStatus: "ON_JOB" } }
      );
    }
    
    // Convert to plain object
    const appObject = updatedApplication.toObject();
    
    // Find and manually populate job posting
    try {
      const jobPosting = await JobPosting.findOne({ 
        uuid: updatedApplication.jobPostingId 
      });
      
      if (jobPosting) {
        appObject.jobPostingId = {
          title: jobPosting.title,
          companyName: jobPosting.title, // Assuming company name is in title
          jobPosition: jobPosting.jobPosition,
          location: jobPosting.location,
          salary: jobPosting.salary,
          deadline: jobPosting.deadline
        };
      }
    } catch (err) {
      console.error(`Error populating job posting for updated application ${uuid}:`, err);
    }
    
    return appObject;
  } catch (error) {
    console.error("Error updating application:", error);
    throw error;
  }
};

/**
 * Get all job applications (for recruiters)
 * @returns {Promise<Array>} - Array of all job application objects
 */
export const getAllApplications = async () => {
  try {
    // Find all applications
    const applications = await JobApplication.find({})
      .sort({ submissionDate: -1 });
    
    // Process applications to properly populate job posting details
    const populatedApplications = [];
    
    for (const application of applications) {
      try {
        // Find the job posting by UUID
        const jobPosting = await JobPosting.findOne({ 
          uuid: application.jobPostingId 
        });
        
        // Find candidate details
        const candidate = await User.findOne({
          uuid: application.candidateId
        });
        
        // Create a copy of the application as a plain object
        const appObject = application.toObject();
        
        // Add candidate information
        if (candidate) {
          appObject.candidateInfo = {
            name: candidate.name,
            email: candidate.email
          };
        }
        
        // Manually assign job posting if found
        if (jobPosting) {
          appObject.jobPostingId = {
            title: jobPosting.title,
            companyName: jobPosting.title, // Assuming company name is in title
            jobPosition: jobPosting.jobPosition,
            location: jobPosting.location,
            salary: jobPosting.salary,
            deadline: jobPosting.deadline
          };
        }
        
        populatedApplications.push(appObject);
      } catch (err) {
        console.error(`Error populating job posting for application ${application.uuid}:`, err);
        // Include the application even if population fails
        populatedApplications.push(application.toObject());
      }
    }
    
    return populatedApplications;
  } catch (error) {
    console.error("Error getting all applications:", error);
    throw error;
  }
}; 