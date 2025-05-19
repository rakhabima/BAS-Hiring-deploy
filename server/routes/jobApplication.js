import express from "express";
import { upload } from "../utils/multer-storage-cloudinary.js";
import {
  getAllApplicationsController,
  getApplicationByIdController,
  getApplicationStageStatsController,
  getApplicationStatusDistributionController,
  getApplicationTrendsController,
  getCandidateApplicationsController,
  submitApplicationController,
  updateApplicationController,
  updateApplicationStatusController
} from "../controllers/jobApplicationController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

const uploadFields = upload.fields([
  { name: 'foto_diri' },
  { name: 'foto_ktp' },
  { name: 'foto_sim' },
  { name: 'foto_stnk_hal_1' },
  { name: 'foto_stnk_hal_2' },
  { name: 'foto_ijazah' }
]);

router.post('/submit', uploadFields, authenticateUser, submitApplicationController);

router.get("/candidate", authenticateUser, getCandidateApplicationsController);
router.get("/all", authenticateUser, getAllApplicationsController);
router.get("/:uuid", authenticateUser, getApplicationByIdController);
router.put('/:uuid/update', uploadFields, authenticateUser, updateApplicationController);
router.put("/:uuid/update-status", authenticateUser, updateApplicationStatusController);
router.get("/stats/stages", authenticateUser, getApplicationStageStatsController);
router.get("/stats/status-distribution", authenticateUser, getApplicationStatusDistributionController);
router.get("/stats/trends", authenticateUser, getApplicationTrendsController);

// 🔥 Catch-all error handler (multer/file error misalnya)
router.use((err, req, res, next) => {
  console.error('❌ ERROR DI ROUTE JOB APPLICATION:', err);
  res.status(500).json({
    message: "Gagal memproses permintaan",
    error: err.message,
  });
});

export default router;
