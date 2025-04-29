import { getApplicationById, getCandidateApplications, submitApplication } from "../services/jobApplicationService.js";
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