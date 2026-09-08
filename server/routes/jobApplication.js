import express from "express";
import {
  deleteEmployeeFromListController,
  getAllApplicationsController,
  getApplicationByIdController,
  getApplicationStageStatsController,
  getApplicationStatusDistributionController,
  getApplicationTrendsController,
  getCandidateApplicationsController,
  getEmployeeStatsController,
  hardDeleteApplicationController,
  submitApplicationController,
  updateApplicationController,
  updateApplicationStatusController,
  updateEmployeeByStaffController
} from "../controllers/jobApplicationController.js";
import { authenticateUser } from "../utils/authMiddleware.js";

const router = express.Router();

// Berkas tidak lagi melewati server ini: browser mengunggah langsung ke
// Cloudinary (lihat routes/upload.js) dan mengirimkan URL-nya sebagai JSON.
// Selain melewati limit body 4.5 MB milik Vercel, ini juga menghapus urutan
// middleware lama yang menjalankan multer SEBELUM authenticateUser — request
// tanpa login tetap mengunggah berkas dulu, baru ditolak.

router.post('/submit', authenticateUser, submitApplicationController);

router.get("/candidate", authenticateUser, getCandidateApplicationsController);
router.get("/all", authenticateUser, getAllApplicationsController);
router.get("/:uuid", authenticateUser, getApplicationByIdController);
router.put('/:uuid/update', authenticateUser, updateApplicationController);
router.put("/:uuid/update-status", authenticateUser, updateApplicationStatusController);
router.put("/:uuid/update-employee", authenticateUser, updateEmployeeByStaffController);
router.delete("/:uuid/delete", authenticateUser, hardDeleteApplicationController);
router.delete("/:uuid/delete-employee", authenticateUser, deleteEmployeeFromListController);
router.get("/stats/stages", authenticateUser, getApplicationStageStatsController);
router.get("/stats/status-distribution", authenticateUser, getApplicationStatusDistributionController);
router.get("/stats/trends", authenticateUser, getApplicationTrendsController);
router.get("/employee/stats", authenticateUser, getEmployeeStatsController);

// 🔥 Catch-all error handler (multer/file error misalnya)
router.use((err, req, res, next) => {
  console.error('❌ ERROR DI ROUTE JOB APPLICATION:', err);
  res.status(500).json({
    message: "Gagal memproses permintaan",
    error: err.message,
  });
});

export default router;
