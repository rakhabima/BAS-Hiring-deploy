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
import { authenticateUser } from '../middleware/authMiddleware.js';
import { upload } from '../utils/multer-storage-cloudinary.js';

const router = express.Router();

// Single file upload middleware for test submissions
const uploadSubmission = upload.single('submissionFile');

// Create technical test for an application
router.post('/:applicationId', authenticateUser, createTechnicalTestController);

// Get technical test by application ID
router.get('/application/:applicationId', authenticateUser, getTechnicalTestByApplicationIdController);

// Get technical test by UUID
router.get('/:uuid', authenticateUser, getTechnicalTestByIdController);

// Update technical test
router.put('/:uuid', authenticateUser, updateTechnicalTestController);

// Submit technical test result (with file upload)
router.post('/:applicationId/submit', authenticateUser, uploadSubmission, submitTechnicalTestResultController);

// Mark technical test as completed
router.post('/:applicationId/complete', authenticateUser, markTechnicalTestCompletedController);

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