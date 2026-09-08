import express from "express";
import multer from "multer";
import { createJobVacancyController, deleteJobVacancyController, getAllJobVacanciesController, getJobVacancyByIdController, updateJobVacancyController } from "../controllers/jobVacancyController.js";
import { authorize, protect } from "../utils/authMiddleware.js";

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

// Publik: dipakai portal lowongan tanpa login (PublicJobListPage,
// PublicJobDetailPage), jadi sengaja tidak digate.
router.get("/all", getAllJobVacanciesController);
router.get("/:uuid", getJobVacancyByIdController);

// Mutasi hanya untuk staff. Sebelumnya siapa pun bisa membuat, mengubah, dan
// menghapus lowongan tanpa login.
const staffOnly = [protect, authorize("RECRUITER", "ADMIN")];

// Create a new job vacancy
router.post("/create", ...staffOnly, upload.single('imageUrl'), createJobVacancyController);

// Update an existing job vacancy
router.put("/update/:uuid", ...staffOnly, upload.single('imageUrl'), updateJobVacancyController);

// Delete a job vacancy (soft delete)
router.delete("/delete/:uuid", ...staffOnly, deleteJobVacancyController);

export default router;
