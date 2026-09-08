import express from 'express';
import {
  createTechnicalTestController,
  deleteTechnicalTestController,
  getAllTechnicalTestsController,
  getTechnicalTestByApplicationIdController,
  getTechnicalTestByIdController,
  markTechnicalTestCompletedController,
  submitTechnicalTestResultController,
  updateTechnicalTestController
} from '../controllers/technicalTestController.js';
import prisma from '../db/prisma.js';
import { authenticateUser, ownsApplication } from '../utils/authMiddleware.js';
import { upload } from '../utils/multer-storage-cloudinary.js';

const router = express.Router();

// Single file upload middleware for test submissions
const uploadSubmission = upload.single('submissionFile');

// TechnicalTest menyimpan applicationId; untuk route yang hanya tahu uuid test,
// kepemilikan ditelusuri lewat aplikasi yang menaunginya.
const applicationIdFromTest = async (req) => {
  const test = await prisma.technicalTest.findUnique({
    where: { uuid: req.params.uuid },
    select: { applicationId: true }
  });
  return test?.applicationId;
};
const applicationIdFromParams = (req) => req.params.applicationId;

// Create technical test for an application
router.post('/:applicationId', authenticateUser, createTechnicalTestController);

// Get technical test by application ID
router.get('/application/:applicationId', authenticateUser, ownsApplication(applicationIdFromParams), getTechnicalTestByApplicationIdController);

// Get technical test by UUID
router.get('/:uuid', authenticateUser, ownsApplication(applicationIdFromTest), getTechnicalTestByIdController);

// Update technical test
router.put('/:uuid', authenticateUser, updateTechnicalTestController);

// Submit technical test result (with file upload)
router.post('/:applicationId/submit', authenticateUser, ownsApplication(applicationIdFromParams), uploadSubmission, submitTechnicalTestResultController);

// Mark technical test as completed
router.post('/:applicationId/complete', authenticateUser, ownsApplication(applicationIdFromParams), markTechnicalTestCompletedController);

// Get all technical tests
router.get('/', authenticateUser, getAllTechnicalTestsController);

// Delete technical test
router.delete('/:uuid', authenticateUser, deleteTechnicalTestController);

// Error handler for file upload issues
router.use((err, req, res, next) => {
  console.error('ERROR IN TECHNICAL TEST ROUTES:', err);
  res.status(500).json({
    message: 'Failed to process request',
    error: err.message
  });
});

export default router; 