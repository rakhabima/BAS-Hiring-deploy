import {
    createTechnicalTest,
    deleteTechnicalTest,
    getAllTechnicalTests,
    getTechnicalTestByApplicationId,
    getTechnicalTestById,
    submitTechnicalTestResult,
    updateTechnicalTest
} from '../services/technicalTestService.js';

/**
 * Create a new technical test
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const createTechnicalTestController = async (req, res) => {
  try {
    // Get user info from the session
    const user = req.user;
    
    // Validate user role - only recruiters and managers can create technical tests
    if (!user || (user.role !== 'RECRUITER' && user.role !== 'MANAGER')) {
      return res.status(403).json({
        message: 'Forbidden: Only recruiters and managers can create technical tests'
      });
    }

    // Get application ID from request parameters
    const { applicationId } = req.params;
    
    // Prepare technical test data from request body
    const technicalTestData = {
      applicationId,
      recruiterId: user.uuid,
      candidateId: req.body.candidateId,
      description: req.body.description,
      dateScheduled: new Date(req.body.dateScheduled),
      testLink: req.body.testLink,
      instructions: req.body.instructions
    };

    // Create technical test
    const technicalTest = await createTechnicalTest(technicalTestData);

    // Return success response
    res.status(201).json({
      message: 'Technical test created successfully',
      data: technicalTest
    });
  } catch (error) {
    console.error('Error in createTechnicalTestController:', error);
    
    // Return appropriate error response
    if (error.message === 'Application not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({
      message: 'Failed to create technical test',
      error: error.message
    });
  }
};

/**
 * Get technical test by application ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getTechnicalTestByApplicationIdController = async (req, res) => {
  try {
    // Get application ID from request parameters
    const { applicationId } = req.params;
    
    // Get technical test
    const technicalTest = await getTechnicalTestByApplicationId(applicationId);
    
    // Return appropriate response
    if (!technicalTest) {
      return res.status(404).json({
        message: 'Technical test not found for this application'
      });
    }
    
    res.status(200).json({
      message: 'Technical test found',
      data: technicalTest
    });
  } catch (error) {
    console.error('Error in getTechnicalTestByApplicationIdController:', error);
    
    // Return appropriate error response
    if (error.message === 'Application not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({
      message: 'Failed to get technical test',
      error: error.message
    });
  }
};

/**
 * Get technical test by UUID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getTechnicalTestByIdController = async (req, res) => {
  try {
    // Get UUID from request parameters
    const { uuid } = req.params;
    
    // Get technical test
    const technicalTest = await getTechnicalTestById(uuid);
    
    // Return appropriate response
    if (!technicalTest) {
      return res.status(404).json({
        message: 'Technical test not found'
      });
    }
    
    res.status(200).json({
      message: 'Technical test found',
      data: technicalTest
    });
  } catch (error) {
    console.error('Error in getTechnicalTestByIdController:', error);
    
    res.status(500).json({
      message: 'Failed to get technical test',
      error: error.message
    });
  }
};

/**
 * Update technical test
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const updateTechnicalTestController = async (req, res) => {
  try {
    // Get user info from the session
    const user = req.user;
    
    // Validate user role - only recruiters and managers can update technical tests
    if (!user || (user.role !== 'RECRUITER' && user.role !== 'MANAGER')) {
      return res.status(403).json({
        message: 'Forbidden: Only recruiters and managers can update technical tests'
      });
    }
    
    // Get UUID from request parameters
    const { uuid } = req.params;
    
    // Prepare update data
    const updateData = { ...req.body };
    
    // Add updatedBy field
    updateData.updatedBy = user.uuid;
    
    // Update technical test
    const updatedTest = await updateTechnicalTest(uuid, updateData);
    
    // Return appropriate response
    if (!updatedTest) {
      return res.status(404).json({
        message: 'Technical test not found'
      });
    }
    
    res.status(200).json({
      message: 'Technical test updated successfully',
      data: updatedTest
    });
  } catch (error) {
    console.error('Error in updateTechnicalTestController:', error);
    
    res.status(500).json({
      message: 'Failed to update technical test',
      error: error.message
    });
  }
};

/**
 * Submit technical test result from candidate
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const submitTechnicalTestResultController = async (req, res) => {
  try {
    // Get user info from the session
    const user = req.user;
    
    // Validate user role - only candidates can submit test results
    if (!user || user.role !== 'CANDIDATE') {
      return res.status(403).json({
        message: 'Forbidden: Only candidates can submit test results'
      });
    }
    
    // Get application ID from request parameters
    const { applicationId } = req.params;
    
    // Prepare submission data
    const submissionData = {
      notes: req.body.notes || '',
      fileUrl: req.file ? req.file.path : null
    };
    
    // Submit test result
    const updatedTest = await submitTechnicalTestResult(applicationId, submissionData);
    
    // Return success response
    res.status(200).json({
      message: 'Technical test result submitted successfully',
      data: updatedTest
    });
  } catch (error) {
    console.error('Error in submitTechnicalTestResultController:', error);
    
    // Return appropriate error response
    if (error.message === 'Technical test not found' || error.message === 'Application not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({
      message: 'Failed to submit technical test result',
      error: error.message
    });
  }
};

/**
 * Mark technical test as completed by candidate
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const markTechnicalTestCompletedController = async (req, res) => {
  try {
    // Get user info from the session
    const user = req.user;
    
    // Validate user role - only candidates can mark tests as completed
    if (!user || user.role !== 'CANDIDATE') {
      return res.status(403).json({
        message: 'Forbidden: Only candidates can mark technical tests as completed'
      });
    }
    
    // Get application ID from request parameters
    const { applicationId } = req.params;
    
    // Find the technical test
    const technicalTest = await getTechnicalTestByApplicationId(applicationId);
    
    if (!technicalTest) {
      return res.status(404).json({
        message: 'Technical test not found for this application'
      });
    }
    
    // Prepare submission data
    const submissionData = {
      candidateHasCompleted: true,
      notes: req.body.notes || ''
    };
    
    // Create status history entry
    const statusData = {
      fileUrl: null, // No file
      notes: 'Kandidat telah mengerjakan technical test'
    };
    
    // Submit test result
    await submitTechnicalTestResult(applicationId, statusData);
    
    // Update technical test
    const updatedTest = await updateTechnicalTest(technicalTest.uuid, submissionData);
    
    // Return success response
    res.status(200).json({
      message: 'Technical test marked as completed',
      data: updatedTest
    });
  } catch (error) {
    console.error('Error in markTechnicalTestCompletedController:', error);
    
    // Return appropriate error response
    if (error.message === 'Technical test not found' || error.message === 'Application not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({
      message: 'Failed to mark technical test as completed',
      error: error.message
    });
  }
};

/**
 * Get all technical tests
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllTechnicalTestsController = async (req, res) => {
  try {
    // Get user info from the session
    const user = req.user;
    
    // Validate user role - only recruiters and managers can get all technical tests
    if (!user || (user.role !== 'RECRUITER' && user.role !== 'MANAGER')) {
      return res.status(403).json({
        message: 'Forbidden: Only recruiters and managers can get all technical tests'
      });
    }
    
    // Get all technical tests
    const technicalTests = await getAllTechnicalTests();
    
    // Return success response
    res.status(200).json({
      message: 'Technical tests retrieved successfully',
      data: technicalTests
    });
  } catch (error) {
    console.error('Error in getAllTechnicalTestsController:', error);
    
    res.status(500).json({
      message: 'Failed to get technical tests',
      error: error.message
    });
  }
};

/**
 * Delete technical test
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteTechnicalTestController = async (req, res) => {
  try {
    // Get user info from the session
    const user = req.user;
    
    // Validate user role - only recruiters and managers can delete technical tests
    if (!user || (user.role !== 'RECRUITER' && user.role !== 'MANAGER')) {
      return res.status(403).json({
        message: 'Forbidden: Only recruiters and managers can delete technical tests'
      });
    }
    
    // Get UUID from request parameters
    const { uuid } = req.params;
    
    // Delete technical test
    const deletedTest = await deleteTechnicalTest(uuid);
    
    // Return appropriate response
    if (!deletedTest) {
      return res.status(404).json({
        message: 'Technical test not found'
      });
    }
    
    res.status(200).json({
      message: 'Technical test deleted successfully',
      data: deletedTest
    });
  } catch (error) {
    console.error('Error in deleteTechnicalTestController:', error);
    
    res.status(500).json({
      message: 'Failed to delete technical test',
      error: error.message
    });
  }
}; 