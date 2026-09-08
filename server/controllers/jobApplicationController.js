import prisma from "../db/prisma.js";
import { getAllApplications, getApplicationById, getApplicationStageStats, getApplicationStatusDistribution, getApplicationTrends, getCandidateApplications, hardDeleteApplication, submitApplication, updateApplication } from "../services/jobApplicationService.js";
import { checkUserRole } from "../utils/roleValidator.js";
import { sendNotification } from "../utils/notificationService.js";


// Controller for submitting a job application
export const submitApplicationController = async (req, res) => {
  try {
    if (!checkUserRole(req.user, ["CANDIDATE"])) {
      return res.status(403).json({ message: "Unauthorized: Only candidates can apply for jobs" });
    }
    console.log("INI MASUK KE CONTROLLER SUBMIT APPLICATION 1");

    const applicationData = { ...req.body };
    applicationData.candidateId = req.user.uuid;

    console.log("INI MASUK KE CONTROLLER SUBMIT APPLICATION 2");

    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        candidateId: applicationData.candidateId,
        jobPostingId: applicationData.jobPostingId
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "Lamaran hanya dapat dilakukan sekali, Anda sudah melamar pekerjaan ini"
      });
    }

    if (req.files) {
      for (const fieldName in req.files) {
        const file = req.files[fieldName][0];
        applicationData[fieldName] = file.path;
      }
    }

    console.log("🧾 Final applicationData:", applicationData);


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
    const isStaff = checkUserRole(req.user, ["RECRUITER", "KOORDINATOR_LAPANGAN", "GENERAL_MANAGER"]);
    
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

    const application = await getApplicationById(uuid);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.candidateId !== req.user.uuid) {
      return res.status(403).json({
        message: "Unauthorized: You don't have permission to update this application"
      });
    }

    if (application.status !== "REVISION") {
      return res.status(400).json({
        message: "Cannot update application: Application is not in revision status"
      });
    }

    const updateData = { ...req.body };

    // ✅ Ambil URL file hasil upload dari Cloudinary (via multer)
    if (req.files) {
      for (const fieldName in req.files) {
        const file = req.files[fieldName][0];
        updateData[fieldName] = file.path; // URL langsung dari Cloudinary
      }
    }

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

    // Define messages based on application status
    let statusMessage = '';
    let recruiterMessage = notes || '';

    switch (status) {
      case 'REVISION':
        statusMessage = 'Lamaran Anda memerlukan revisi.';
        break;
      case 'INTERVIEW_SCHEDULED':
        statusMessage = 'Waktu wawancara lamaran Anda sudah dijadwalkan, mohon lakukan konfirmasi kehadiran.';
        break;
      case 'TECHNICAL_TEST':
        statusMessage = 'Tes sudah diberikan.';
        break;
      case 'ACCEPTED':
        statusMessage = 'Selamat! Anda diterima.';
        break;
      case 'REJECTED':
        statusMessage = 'Maaf! Anda belum diterima di pekerjaan yang Anda lamar.';
        break;
      case 'ON_JOB':
        statusMessage = 'Selamat, Anda sudah mulai bekerja.';
        break;
      case 'PENDING':
      case 'REVIEWING':
        statusMessage = 'Lamaran Anda sedang dalam proses review.';
        break;
      default:
        statusMessage = 'Status lamaran Anda diperbarui.';
    }

    // Only append recruiter message if it's not empty
    const fullMessage = recruiterMessage ? `${statusMessage} Pesan recruiter: ${recruiterMessage}` : statusMessage;

    // Send notification after the status is updated
    await sendNotification(
      updatedApplication.candidateId,  // Send notification to the candidate
      fullMessage,  // Notification message
      "APPLICATION_STATUS",  // Notification type
      {
        relatedId: updatedApplication.uuid,
        relatedModel: "JobApplication"
      }
    );
    
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
    if (!checkUserRole(req.user, ["RECRUITER", "KOORDINATOR_LAPANGAN", "GENERAL_MANAGER"])) {
      return res.status(403).json({ 
        message: "Unauthorized: Only recruiters and koordinator lapangan can view all applications"
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
    if (!checkUserRole(req.user, ["RECRUITER", "KOORDINATOR_LAPANGAN", "GENERAL_MANAGER"])) {
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
     if (!checkUserRole(req.user, ["RECRUITER", "KOORDINATOR_LAPANGAN", "GENERAL_MANAGER"])) {
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
     if (!checkUserRole(req.user, ["RECRUITER", "KOORDINATOR_LAPANGAN", "GENERAL_MANAGER"])) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const period = req.query.period || 'week'; // Default to week if not specified
    const trends = await getApplicationTrends(period);
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get application trends" });
  }
};

// Controller for hard-deleting an application (debug only)
export const hardDeleteApplicationController = async (req, res) => {
  try {
    // Ensure user is a recruiter or general manager
    if (!checkUserRole(req.user, ["RECRUITER", "GENERAL_MANAGER"])) {
      return res.status(403).json({
        message: "Unauthorized: Only recruiters can delete applications"
      });
    }

    const { uuid } = req.params;
    
    // Hard delete the application
    const result = await hardDeleteApplication(uuid);
    
    if (!result) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    res.status(200).json({
      message: "Application permanently deleted",
      uuid
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for updating employee data by staff (Recruiter/Korlap)
export const updateEmployeeByStaffController = async (req, res) => {
  try {
    // Ensure user is a recruiter, korlap, or general manager
    if (!checkUserRole(req.user, ["RECRUITER", "KOORDINATOR_LAPANGAN", "GENERAL_MANAGER"])) {
      return res.status(403).json({
        message: "Unauthorized: Only staff can update employee data"
      });
    }

    const { uuid } = req.params;
    const updateData = { ...req.body };
    
    // Add file paths if files were uploaded
    if (req.files) {
      for (const fieldName in req.files) {
        const file = req.files[fieldName][0];
        updateData[fieldName] = file.path;
      }
    }
    
    // Add updatedBy information
    updateData.updatedBy = req.user.uuid;
    
    // IMPORTANT: Remove statusHistory from updateData to prevent casting issues
    // This field is automatically handled by the pre-save middleware
    delete updateData.statusHistory;
    
    // Update the application
    const updatedApplication = await updateApplication(uuid, updateData);
    
    if (!updatedApplication) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.status(200).json({
      message: "Data karyawan berhasil diperbarui",
      data: updatedApplication
    });
  } catch (error) {
    console.error("Error updating employee data:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for soft deleting employee from list (Recruiter only)
export const deleteEmployeeFromListController = async (req, res) => {
  try {
    // Ensure user is a recruiter only (not korlap)
    if (!checkUserRole(req.user, ["RECRUITER"])) {
      return res.status(403).json({
        message: "Unauthorized: Only recruiters can delete employees from list"
      });
    }

    const { uuid } = req.params;
    
    // Get the application to ensure it exists
    const application = await getApplicationById(uuid);
    
    if (!application) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    // Check if employee is already in ON_JOB or ACCEPTED status
    if (application.status !== 'ON_JOB' && application.status !== 'ACCEPTED') {
      return res.status(400).json({ 
        message: "Only employees with status ON_JOB or ACCEPTED can be deleted from list" 
      });
    }
    
    // Perform soft delete by updating specific fields
    const updateData = {
      hidden_from_employee_list: true,
      deleted_from_employee_list_by: req.user.uuid,
      deleted_from_employee_list_at: new Date()
    };
    
    // Update the application
    const updatedApplication = await updateApplication(uuid, updateData);
    
    res.status(200).json({
      message: "Karyawan berhasil dihapus dari daftar",
      data: {
        uuid: updatedApplication.uuid,
        hidden_from_employee_list: updatedApplication.hidden_from_employee_list
      }
    });
  } catch (error) {
    console.error("Error deleting employee from list:", error);
    res.status(500).json({ message: error.message });
  }
};

// Controller for getting employee statistics
export const getEmployeeStatsController = async (req, res) => {
  try {
    if (!checkUserRole(req.user, ["RECRUITER", "KOORDINATOR_LAPANGAN", "GENERAL_MANAGER"])) {
      return res.status(403).json({
        message: "Unauthorized: Only staff can view employee statistics"
      });
    }
    
    // Get employee counts (accepted and on-job candidates). Dulu semua baris
    // ditarik ke memori lalu di-filter; sekarang dihitung di database.
    const grouped = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        status: { in: ['ACCEPTED', 'ON_JOB'] },
        hidden_from_employee_list: false // Don't count hidden employees
      },
      _count: { _all: true }
    });

    const countFor = (status) => grouped.find(g => g.status === status)?._count._all || 0;
    const active = countFor('ON_JOB');
    const inactive = countFor('ACCEPTED');
    const total = active + inactive;
    
    res.status(200).json({
      data: { total, active, inactive }
    });
  } catch (error) {
    console.error("Error getting employee statistics:", error);
    res.status(500).json({ message: error.message });
  }
}; 