import express from "express";
import multer from "multer";
import { createJobVacancyController, deleteJobVacancyController, getAllJobVacanciesController, getJobVacancyByIdController, updateJobVacancyController } from "../controllers/jobVacancyController.js";

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

// Create a new job vacancy
router.post("/create", upload.single('imageUrl'), createJobVacancyController);

// Update an existing job vacancy
router.put("/update/:uuid", upload.single('imageUrl'), updateJobVacancyController);

// Get all job vacancies
router.get("/all", getAllJobVacanciesController);

// Get a specific job vacancy by ID
router.get("/:uuid", getJobVacancyByIdController);

// Delete a job vacancy (soft delete)
router.delete("/delete/:uuid", deleteJobVacancyController);

export default router;
