import express from "express";
import { createJobVacancyController, deleteJobVacancyController, getAllJobVacanciesController, getJobVacancyByIdController, updateJobVacancyController } from "../controllers/jobVacancyController.js";
import { authorize, protect } from "../utils/authMiddleware.js";

const router = express.Router();

// Gambar diunggah langsung dari browser ke Cloudinary; route ini hanya
// menerima URL-nya di body (lihat routes/upload.js).

// Publik: dipakai portal lowongan tanpa login (PublicJobListPage,
// PublicJobDetailPage), jadi sengaja tidak digate.
router.get("/all", getAllJobVacanciesController);
router.get("/:uuid", getJobVacancyByIdController);

// Mutasi hanya untuk staff. Sebelumnya siapa pun bisa membuat, mengubah, dan
// menghapus lowongan tanpa login.
const staffOnly = [protect, authorize("RECRUITER", "ADMIN")];

// Create a new job vacancy
router.post("/create", ...staffOnly, createJobVacancyController);

// Update an existing job vacancy
router.put("/update/:uuid", ...staffOnly, updateJobVacancyController);

// Delete a job vacancy (soft delete)
router.delete("/delete/:uuid", ...staffOnly, deleteJobVacancyController);

export default router;
