import express from "express";
import multer from "multer";
import { getApplicationByIdController, getCandidateApplicationsController, submitApplicationController } from "../controllers/jobApplicationController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Define fields for multiple file uploads
const uploadFields = [
  { name: 'foto_diri', maxCount: 1 },
  { name: 'foto_ktp', maxCount: 1 },
  { name: 'foto_sim', maxCount: 1 },
  { name: 'foto_stnk_hal_1', maxCount: 1 },
  { name: 'foto_stnk_hal_2', maxCount: 1 },
  { name: 'foto_ijazah', maxCount: 1 }
];

// Submit job application (requires authentication)
router.post("/submit", authenticateUser, upload.fields(uploadFields), submitApplicationController);

// Get candidate's applications (requires authentication)
router.get("/candidate", authenticateUser, getCandidateApplicationsController);

// Get application by ID (requires authentication)
router.get("/:uuid", authenticateUser, getApplicationByIdController);

export default router; 