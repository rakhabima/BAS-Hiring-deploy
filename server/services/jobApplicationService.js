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

// Helper function to map UI stage filter to backend statuses
const getStatusesForStage = (stage) => {
  switch (stage) {
    case 'Administrasi':
      return ['PENDING', 'REVIEWING', 'REVISION'];
    case 'Wawancara':
      return ['INTERVIEW_SCHEDULED'];
    case 'Technical Test':
      return ['TECHNICAL_TEST'];
    case 'Diterima':
      return ['ACCEPTED', 'ON_JOB'];
    case 'Ditolak':
      return ['REJECTED'];
    default:
      return null; // No specific statuses for 'all' or invalid stage
  }
};

/**
 * Get all job applications (for recruiters) with filtering and pagination
 * @param {object} filters - Object containing filter criteria (searchTerm, stageFilter, statusFilter, positionFilter)
 * @param {number} page - The current page number (1-indexed)
 * @param {number} limit - The number of items per page
 * @returns {Promise<{applications: Array, totalCount: number}>} - Object containing applications and total count
 */
export const getAllApplications = async (filters = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const { searchTerm, stageFilter, statusFilter, positionFilter } = filters;

    // ---- Build the initial $match stage for filtering ----
    const matchStage = {};

    // Status filter (exact match)
    if (statusFilter && statusFilter !== 'all') {
      matchStage.status = statusFilter;
    }

    // Stage filter (maps to multiple statuses)
    if (stageFilter && stageFilter !== 'all') {
      const statuses = getStatusesForStage(stageFilter);
      if (statuses) {
        // If statusFilter is also applied, ensure it matches one of the stage statuses
        if (matchStage.status && !statuses.includes(matchStage.status)) {
           // Impossible condition, no results will match both stage and status
           matchStage._id = null; // Force no match
        } else if (!matchStage.status) {
           matchStage.status = { $in: statuses };
        }
      }
    }

    // Position filter (can be on jobPostingId or posisi_dilamar)
    // This needs to happen AFTER $lookup for jobInfo if filtering on jobPostingId.jobPosition
    // Or we can match on 'posisi_dilamar' field directly if available. Let's try that first.
    if (positionFilter && positionFilter !== 'all') {
       // Assuming 'posisi_dilamar' exists directly on JobApplication model
       matchStage.posisi_dilamar = positionFilter;
       // If not, we'll need to move this filter after the $lookup and $unwind for jobInfo
    }

    // Search Term Filter (on candidate name/email)
    // This needs to happen AFTER the $lookup for candidateInfo.
    const searchMatchStage = {};
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive regex
      searchMatchStage.$or = [
        { 'candidateInfo.name': searchRegex },
        { 'candidateInfo.email': searchRegex },
        // Add other searchable fields if needed, e.g., 'nama_ktp'
        { 'nama_ktp': searchRegex }
      ];
    }
    // ------------------------------------------------------


    const aggregationPipeline = [
      // ---- Initial Match (can be applied before lookups) ----
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      // ---------------------------------------------------------

      // Sorting (can stay early if needed, or moved after lookups if sorting on joined fields)
      { $sort: { submissionDate: -1 } },

      // Lookups (remain the same)
      { $lookup: { from: "users", let: { candidateId: "$candidateId" }, pipeline: [ { $match: { $expr: { $eq: ["$uuid", "$$candidateId"] } } }, { $project: { _id: 0, name: 1, email: 1 } } ], as: "candidateInfo" } },
      { $unwind: { path: "$candidateInfo", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "jobpostings", let: { jobId: "$jobPostingId" }, pipeline: [ { $match: { $expr: { $eq: ["$uuid", "$$jobId"] } } }, { $project: { _id: 0, title: 1, jobPosition: 1, location: 1, salary: 1, deadline: 1 } } ], as: "jobInfo" } },
      { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },

      // ---- Match Stage for Search Term (applied AFTER lookups) ----
       ...(Object.keys(searchMatchStage).length > 0 ? [{ $match: searchMatchStage }] : []),
      // ---- (Optional) Add match for positionFilter here if 'posisi_dilamar' doesn't exist ----
      /*
      ...(positionFilter && positionFilter !== 'all' ? [{
          $match: { 'jobInfo.jobPosition': positionFilter }
      }] : []),
      */
      // --------------------------------------------------------------

      // Final Projection (remains the same)
      {
        $project: {
          _id: 0,
          uuid: 1,
          candidateId: 1,
          submissionDate: 1,
          status: 1,
          notes: 1,
          statusHistory: 1,
          nama_ktp: 1,
          jenis_kelamin: 1,
          nik: 1,
          tanggal_lahir: 1,
          email: 1, 
          no_hp: 1,
          posisi_dilamar: 1,
          candidateInfo: 1,
          jobPostingId: "$jobInfo",
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];


    // Use $facet for pagination and count AFTER filtering
    const results = await JobApplication.aggregate([
      {
        $facet: {
          metadata: [
            ...aggregationPipeline, // Apply all filters/joins for counting
            { $count: "totalCount" }
          ],
          data: [
            ...aggregationPipeline, // Apply all filters/joins for data
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ]).allowDiskUse(true);

    const applications = results[0]?.data || [];
    const totalCount = results[0]?.metadata[0]?.totalCount || 0;

    return { applications, totalCount };

  } catch (error) {
    console.error("Error getting all applications:", error);
    throw error;
  }
};

/**
 * Get total counts for each main application stage.
 * @returns {Promise<object>} - Object with counts for each stage (pending, interview, technicalTest, accepted, rejected)
 */
export const getApplicationStageStats = async () => {
  try {
    console.log("Fetching application stage statistics...");
    // Aggregasi untuk menghitung jumlah dokumen per status
    const statusCountsResult = await JobApplication.aggregate([
      {
        $group: {
          _id: "$status", // Group by status field
          count: { $sum: 1 } // Count documents in each group
        }
      }
    ]);

    // Proses hasil agregasi ke dalam format yang diinginkan
    const counts = {
      PENDING: 0, REVIEWING: 0, REVISION: 0,
      INTERVIEW_SCHEDULED: 0, TECHNICAL_TEST: 0,
      ACCEPTED: 0, ON_JOB: 0, REJECTED: 0
    };

    statusCountsResult.forEach(item => {
      if (counts.hasOwnProperty(item._id)) {
        counts[item._id] = item.count;
      }
    });

    // Gabungkan hitungan berdasarkan tahapan UI
    const stageStats = {
      pending: counts.PENDING + counts.REVIEWING + counts.REVISION,
      interview: counts.INTERVIEW_SCHEDULED,
      technicalTest: counts.TECHNICAL_TEST,
      accepted: counts.ACCEPTED + counts.ON_JOB,
      rejected: counts.REJECTED // Sertakan jika perlu
    };

    console.log("Calculated stage stats:", stageStats);
    return stageStats;

  } catch (error) {
    console.error("Error getting application stage stats:", error);
    throw error;
  }
};

/**
 * Get application counts grouped by status, optionally filtered by time period.
 * @param {string} period - Time period ('week', 'month', 'year', or 'all')
 * @returns {Promise<object>} - Object where keys are statuses and values are counts.
 */
export const getApplicationStatusDistribution = async (period = 'all') => {
  try {
    console.log(`Fetching status distribution for period: ${period}`);
    const matchStage = {}; // Initialize match stage

    // Build time period filter
    if (period !== 'all') {
      const today = new Date();
      const startDate = new Date(today);
      if (period === 'week') startDate.setDate(today.getDate() - 7);
      else if (period === 'month') startDate.setMonth(today.getMonth() - 1);
      else if (period === 'year') startDate.setFullYear(today.getFullYear() - 1);
      // Only include applications submitted within the period
      matchStage.submissionDate = { $gte: startDate };
    }

    // Aggregation pipeline
    const statusCountsResult = await JobApplication.aggregate([
      // Apply time filter if present
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$status", // Group by status
          count: { $sum: 1 } // Count documents
        }
      },
      {
        $project: { // Reshape to { status: count }
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ]);

    // Convert array result to a simple key-value object
    const distribution = {};
    statusCountsResult.forEach(item => {
      distribution[item.status] = item.count;
    });

    console.log("Status distribution results:", distribution);
    return distribution;

  } catch (error) {
    console.error("Error getting application status distribution:", error);
    throw error;
  }
};

/**
 * Get application counts grouped by time unit (day, week, month) based on the period.
 * @param {string} period - Time period ('week', 'month', 'year')
 * @returns {Promise<object>} - Object where keys are time labels and values are counts.
 */
export const getApplicationTrends = async (period = 'week') => {
  try {
    console.log(`Fetching application trends for period: ${period}`);
    const today = new Date();
    const startDate = new Date(today);
    let groupByFormat = "%Y-%m-%d"; // Default: group by day (for weekly view)
    let dateField = "$submissionDate";

    if (period === 'week') {
      startDate.setDate(today.getDate() - 28); // Last 4 weeks
      groupByFormat = "%Y-W%U"; // Group by Year-WeekNumber (e.g., 2023-W45)
    } else if (period === 'month') {
      startDate.setMonth(today.getMonth() - 6); // Last 6 months
      groupByFormat = "%Y-%m"; // Group by Year-Month (e.g., 2023-11)
    } else if (period === 'year') {
      startDate.setFullYear(today.getFullYear() - 2); // Last 2 years
       groupByFormat = "%Y"; // Group by Year (e.g., 2023)
    }

    const matchStage = { submissionDate: { $gte: startDate } };

    const trendsResult = await JobApplication.aggregate([
      { $match: matchStage }, // Filter by date range first
      {
        $group: {
          _id: { // Group by the calculated time unit
            $dateToString: { format: groupByFormat, date: dateField, timezone: "+07:00" } // Use appropriate timezone
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }, // Sort by the time unit
       {
        $project: { // Reshape to { timeLabel: count }
          _id: 0,
          timeLabel: "$_id",
          count: 1
        }
      }
    ]);

     // Convert array result to a simple key-value object
    const trends = {};
    trendsResult.forEach(item => {
      trends[item.timeLabel] = item.count;
    });

    console.log("Application trends results:", trends);
    return trends;

  } catch (error) {
    console.error("Error getting application trends:", error);
    throw error;
  }
}; 