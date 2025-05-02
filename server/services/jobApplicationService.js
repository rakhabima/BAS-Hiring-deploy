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
    // Use MongoDB aggregation pipeline with $lookup to join collections in a single query
    const populatedApplications = await JobApplication.aggregate([
      { $sort: { submissionDate: -1 } },
      // Join with users collection to get candidate info
      {
        $lookup: {
          from: "users", // MongoDB collection name (usually lowercase model name + 's')
          let: { candidateId: "$candidateId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$uuid", "$$candidateId"] } } },
            { $project: { _id: 0, name: 1, email: 1 } }
          ],
          as: "candidateInfo"
        }
      },
      // Unwind the candidateInfo array (converts array to object)
      {
        $unwind: {
          path: "$candidateInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      // Join with job postings collection
      {
        $lookup: {
          from: "jobpostings", // MongoDB collection name
          let: { jobId: "$jobPostingId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$uuid", "$$jobId"] } } },
            { $project: { _id: 0, title: 1, jobPosition: 1, location: 1, salary: 1, deadline: 1 } }
          ],
          as: "jobInfo"
        }
      },
      // Unwind the jobInfo array
      {
        $unwind: {
          path: "$jobInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      // Reshape the result for consistency with the previous implementation
      {
        $project: {
          _id: 0,
          uuid: 1,
          candidateId: 1,
          submissionDate: 1,
          status: 1,
          notes: 1,
          statusHistory: 1,
          // Personal info fields
          nama_ktp: 1,
          jenis_kelamin: 1,
          nik: 1,
          tanggal_lahir: 1,
          // Other application fields
          email: 1, 
          no_hp: 1,
          posisi_dilamar: 1,
          // Nested fields from lookups
          candidateInfo: 1,
          jobPostingId: "$jobInfo", // Replace jobPostingId with the joined job data
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]).allowDiskUse(true);
    
    return populatedApplications;
  } catch (error) {
    console.error("Error getting all applications:", error);
    throw error;
  }
}; 