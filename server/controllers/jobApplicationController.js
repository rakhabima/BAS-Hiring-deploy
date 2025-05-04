import JobApplication from "../models/jobApplicationModel.js";
import { getAllApplications, getApplicationById, getApplicationStageStats, getApplicationStatusDistribution, getApplicationTrends, getCandidateApplications, submitApplication, updateApplication } from "../services/jobApplicationService.js";
import { checkUserRole } from "../utils/roleValidator.js";

// Controller for submitting a job application
export const submitApplicationController = async (req, res) => {
  try {
    // Ensure user is a candidate
    if (!checkUserRole(req.user, ["CANDIDATE"])) {
      return res.status(403).json({ message: "Unauthorized: Only candidates can apply for jobs" });
    }

    const applicationData = { ...req.body };
    applicationData.candidateId = req.user.uuid;

    // Check if candidate has already applied for this job
    const existingApplication = await JobApplication.findOne({
      candidateId: applicationData.candidateId,
      jobPostingId: applicationData.jobPostingId
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "Lamaran hanya dapat dilakukan sekali, Anda sudah melamar pekerjaan ini"
      });
    }

    // Handle file uploads
    if (req.files) {
      // Process each uploaded file
      for (const fieldName in req.files) {
        const file = req.files[fieldName][0];
        applicationData[fieldName] = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    }

    // Create a new job application with all fields explicitly set
    const newApplication = await submitApplication(applicationData);

    res.status(201).json({
      message: "Lamaran berhasil dikirim",
      data: {
        uuid: newApplication.uuid,
        submissionDate: newApplication.submissionDate,
        status: newApplication.status
      }
    });
  } catch (error) {
    console.error("Error submitting job application:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for getting candidate applications
export const getCandidateApplicationsController = async (req, res) => {
  try {
    // Ensure user is a candidate or has permission to view applications
    if (!checkUserRole(req.user, ["CANDIDATE", "RECRUITER", "GENERAL_MANAGER"])) {
      return res.status(403).json({
        message: "Unauthorized: You don't have permission to view these applications"
      });
    }

    // Get candidate ID - either the logged in user (if candidate) or from query param (if staff)
    let candidateId = req.user.uuid;
    if (checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"]) && req.query.candidateId) {
      candidateId = req.query.candidateId;
    }

    // Get applications
    const applications = await getCandidateApplications(candidateId);
    
    res.status(200).json({
      data: applications
    });
  } catch (error) {
    console.error("Error getting candidate applications:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for getting application by ID
export const getApplicationByIdController = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Get the application
    const application = await getApplicationById(uuid);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Ensure user has permission to view this application
    const isOwner = application.candidateId === req.user.uuid;
    const isStaff = checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"]);
    
    if (!isOwner && !isStaff) {
      return res.status(403).json({
        message: "Unauthorized: You don't have permission to view this application"
      });
    }
    
    res.status(200).json({
      data: application
    });
  } catch (error) {
    console.error("Error getting application by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for updating a job application (for revision)
export const updateApplicationController = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Get the application
    const application = await getApplicationById(uuid);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Ensure user is the owner of this application
    if (application.candidateId !== req.user.uuid) {
      return res.status(403).json({
        message: "Unauthorized: You don't have permission to update this application"
      });
    }
    
    // Ensure application is in REVISION status
    if (application.status !== "REVISION") {
      return res.status(400).json({
        message: "Cannot update application: Application is not in revision status"
      });
    }
    
    const updateData = { ...req.body };
    
    // Handle file uploads
    if (req.files) {
      // Process each uploaded file
      for (const fieldName in req.files) {
        const file = req.files[fieldName][0];
        updateData[fieldName] = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    }
    
    // Update the application
    const updatedApplication = await updateApplication(uuid, updateData);
    
    res.status(200).json({
      message: "Lamaran berhasil diperbarui",
      data: {
        uuid: updatedApplication.uuid,
        submissionDate: updatedApplication.submissionDate,
        status: updatedApplication.status
      }
    });
  } catch (error) {
    console.error("Error updating job application:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for updating application status (for recruiters)
export const updateApplicationStatusController = async (req, res) => {
  try {
    // Ensure user is a recruiter or general manager
    if (!checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"])) {
      return res.status(403).json({
        message: "Unauthorized: Only recruiters can update application status"
      });
    }

    const { uuid } = req.params;
    const { status, notes } = req.body;
    
    // Get the application
    const application = await getApplicationById(uuid);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Update the application status
    const updatedApplication = await updateApplication(uuid, { 
      status, 
      notes,
      updatedBy: req.user.uuid
    });
    
    res.status(200).json({
      message: "Status aplikasi berhasil diperbarui",
      data: {
        uuid: updatedApplication.uuid,
        status: updatedApplication.status
      }
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for getting all applications (for recruiters)
export const getAllApplicationsController = async (req, res) => {
  try {
    if (!checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"])) {
      return res.status(403).json({ 
        message: "Unauthorized: Only recruiters can view all applications"
      });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Filter parameters from query string
    const filters = {
      searchTerm: req.query.searchTerm || '',
      stageFilter: req.query.stageFilter || 'all',
      statusFilter: req.query.statusFilter || 'all',
      positionFilter: req.query.positionFilter || 'all'
    };

    // Get filtered and paginated applications
    const { applications, totalCount } = await getAllApplications(filters, page, limit); // Pass filters

    // Return optimized response to reduce payload size
    res.status(200).json({
      data: applications.map(app => ({
        uuid: app.uuid,
        candidateId: app.candidateId,
        status: app.status,
        submissionDate: app.submissionDate,
        posisi_dilamar: app.posisi_dilamar,
        nama_ktp: app.nama_ktp,
        candidateInfo: app.candidateInfo ? {
          name: app.candidateInfo.name,
          email: app.candidateInfo.email
        } : null,
        jobPostingId: app.jobPostingId ? {
          jobPosition: app.jobPostingId.jobPosition,
          title: app.jobPostingId.title
        } : null
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        limit: limit
      }
    });
  } catch (error) {
    console.error("Error getting all applications:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for getting application stage statistics
export const getApplicationStageStatsController = async (req, res) => {
  try {
    // Optional: Tambahkan pengecekan role jika diperlukan
    if (!checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"])) {
      return res.status(403).json({
        message: "Unauthorized: Access denied"
      });
    }

    const stats = await getApplicationStageStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error in getApplicationStageStatsController:", error);
    res.status(500).json({ success: false, message: "Failed to get application statistics" });
  }
};

// Controller for getting status distribution
export const getApplicationStatusDistributionController = async (req, res) => {
  try {
     if (!checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"])) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const period = req.query.period || 'all'; // Get period from query
    const distribution = await getApplicationStatusDistribution(period);
    res.status(200).json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get status distribution" });
  }
};

// Controller for getting application trends
export const getApplicationTrendsController = async (req, res) => {
  try {
     if (!checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"])) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const period = req.query.period || 'week'; // Default to week if not specified
    const trends = await getApplicationTrends(period);
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get application trends" });
  }
}; 