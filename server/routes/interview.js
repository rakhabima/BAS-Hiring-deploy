import express from 'express';
import {
  createInterviewController,
  deleteInterviewController,
  getAllInterviewsController,
  getInterviewByApplicationIdController,
  getInterviewByIdController,
  updateInterviewController,
  updateInterviewResponseController
} from '../controllers/interviewController.js';
import prisma from '../db/prisma.js';
import { authorize, ownsApplication, protect } from '../utils/authMiddleware.js';

const router = express.Router();

// Interview tidak menyimpan candidateId, hanya applicationId — jadi
// kepemilikannya ditelusuri lewat aplikasi yang menaunginya.
const applicationIdFromInterview = async (req) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.params.id },
    select: { applicationId: true }
  });
  return interview?.applicationId;
};

const staffOnly = [protect, authorize('RECRUITER', 'ADMIN')];

// Create a new interview (recruiter only)
router.post('/', ...staffOnly, createInterviewController);

// Get interview by ID.
// Sebelumnya checkInterviewAccess meloloskan SEMUA kandidat dengan catatan
// "we'll check in individual routes" — cek itu tidak pernah ada, jadi kandidat
// mana pun bisa membaca wawancara kandidat lain.
router.get('/:id', protect, ownsApplication(applicationIdFromInterview), getInterviewByIdController);

// Get interview by application ID.
// Cek kepemilikannya dulu dikomentari total. Kode lama juga membandingkan
// applicationId dengan req.user.uuid, yang memang tidak pernah cocok —
// yang benar adalah membandingkan candidateId milik aplikasinya.
router.get(
  '/application/:applicationId',
  protect,
  ownsApplication((req) => req.params.applicationId),
  getInterviewByApplicationIdController
);

// Update an interview (recruiter only)
router.put('/:id', ...staffOnly, updateInterviewController);

// Update candidate response.
// Kandidat hanya boleh menjawab wawancaranya sendiri; sebelumnya semua kandidat
// diloloskan ("we'll let candidates proceed").
router.put(
  '/:id/response',
  protect,
  ownsApplication(applicationIdFromInterview),
  updateInterviewResponseController
);

// Get all interviews (staff only)
router.get('/', protect, authorize('RECRUITER', 'ADMIN', 'GENERAL_MANAGER'), getAllInterviewsController);

// Delete an interview (recruiter only)
router.delete('/:id', ...staffOnly, deleteInterviewController);

export default router;
