import JobApplication from '../models/jobApplicationModel.js';
import TechnicalTest from '../models/technicalTestModel.js';

/**
 * Create a new technical test
 * @param {Object} data - Technical test data
 * @returns {Promise<Object>} - The created technical test
 */
export const createTechnicalTest = async (data) => {
  try {
    // Check if application exists
    const application = await JobApplication.findOne({ uuid: data.applicationId });
    if (!application) {
      throw new Error('Application not found');
    }

    // Create new technical test with PENDING result
    const technicalTest = new TechnicalTest({
      ...data,
      result: 'PENDING',
      candidateHasCompleted: false
    });
    const savedTest = await technicalTest.save();

    // Update application status if not already in TECHNICAL_TEST
    if (application.status !== 'TECHNICAL_TEST') {
      // Add a new status history entry
      const statusEntry = {
        status: 'TECHNICAL_TEST',
        timestamp: new Date(),
        notes: 'Kandidat memasuki tahap technical test',
        updatedBy: data.recruiterId
      };

      // Update application status and add to history
      await JobApplication.findOneAndUpdate(
        { uuid: data.applicationId },
        { 
          $set: { status: 'TECHNICAL_TEST' },
          $push: { statusHistory: statusEntry }
        }
      );
    }

    return savedTest;
  } catch (error) {
    console.error('Error creating technical test:', error);
    throw error;
  }
};

/**
 * Get technical test by application ID
 * @param {String} applicationId - The application UUID
 * @returns {Promise<Object|null>} - The technical test or null if not found
 */
export const getTechnicalTestByApplicationId = async (applicationId) => {
  try {
    // Check if application exists
    const application = await JobApplication.findOne({ uuid: applicationId });
    if (!application) {
      throw new Error('Application not found');
    }

    // Get the most recent technical test for this application
    const technicalTest = await TechnicalTest.findOne({ applicationId })
      .sort({ createdAt: -1 });
    
    return technicalTest;
  } catch (error) {
    console.error('Error getting technical test by application ID:', error);
    throw error;
  }
};

/**
 * Get technical test by UUID
 * @param {String} uuid - The technical test UUID
 * @returns {Promise<Object|null>} - The technical test or null if not found
 */
export const getTechnicalTestById = async (uuid) => {
  try {
    return await TechnicalTest.findOne({ uuid });
  } catch (error) {
    console.error('Error getting technical test by ID:', error);
    throw error;
  }
};

/**
 * Update technical test
 * @param {String} uuid - The technical test UUID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object|null>} - The updated technical test or null if not found
 */
export const updateTechnicalTest = async (uuid, updateData) => {
  try {
    console.log(`Updating technical test ${uuid} with data:`, updateData);
    
    const updatedTest = await TechnicalTest.findOneAndUpdate(
      { uuid },
      { $set: updateData },
      { new: true }
    );
    
    console.log('Updated test result:', updatedTest);

    // If updating result and it's PASSED or FAILED, update application status
    if (updateData.result && (updateData.result === 'PASSED' || updateData.result === 'FAILED') && updateData.result !== 'PENDING') {
      console.log('Updating application status based on result:', updateData.result);
      
      const test = await TechnicalTest.findOne({ uuid });
      if (test) {
        const newStatus = updateData.result === 'PASSED' ? 'ACCEPTED' : 'REJECTED';
        console.log(`Changing application ${test.applicationId} status to ${newStatus}`);
        
        const statusEntry = {
          status: newStatus,
          timestamp: new Date(),
          notes: updateData.feedback || `Kandidat ${newStatus === 'ACCEPTED' ? 'lulus' : 'tidak lulus'} technical test`,
          updatedBy: updateData.updatedBy || test.recruiterId
        };

        await JobApplication.findOneAndUpdate(
          { uuid: test.applicationId },
          { 
            $set: { status: newStatus },
            $push: { statusHistory: statusEntry }
          }
        );
      }
    } else if (updateData.result === null) {
      // Handle reset case - intentionally setting result to null
      console.log('Resetting technical test evaluation for test:', uuid);
      // Note: Application status is updated separately via updateApplicationStatus
    }

    return updatedTest;
  } catch (error) {
    console.error('Error updating technical test:', error);
    throw error;
  }
};

/**
 * Submit technical test results from candidate
 * @param {String} applicationId - The application UUID
 * @param {Object} submissionData - The submission data
 * @returns {Promise<Object>} - The updated technical test
 */
export const submitTechnicalTestResult = async (applicationId, submissionData) => {
  try {
    // Find the technical test
    const technicalTest = await TechnicalTest.findOne({ applicationId });
    if (!technicalTest) {
      throw new Error('Technical test not found');
    }

    // Update the application status history
    const application = await JobApplication.findOne({ uuid: applicationId });
    if (!application) {
      throw new Error('Application not found');
    }

    // Add a status history entry for test completion
    const statusEntry = {
      status: 'TECHNICAL_TEST',
      timestamp: new Date(),
      notes: 'Kandidat telah mengerjakan technical test',
      updatedBy: application.candidateId
    };

    await JobApplication.findOneAndUpdate(
      { uuid: applicationId },
      { $push: { statusHistory: statusEntry } }
    );

    // Update the technical test with submission details
    const updateData = {
      submissionDate: new Date(),
      submissionFile: submissionData.fileUrl,
      submissionNotes: submissionData.notes || null,
      result: 'PENDING', // Reset result to PENDING if it was changed
      candidateHasCompleted: true  // Mark as completed
    };

    const updatedTest = await TechnicalTest.findOneAndUpdate(
      { uuid: technicalTest.uuid },
      { $set: updateData },
      { new: true }
    );

    return updatedTest;
  } catch (error) {
    console.error('Error submitting technical test result:', error);
    throw error;
  }
};

/**
 * Get all technical tests
 * @returns {Promise<Array>} - Array of technical tests
 */
export const getAllTechnicalTests = async () => {
  try {
    return await TechnicalTest.find().sort({ dateScheduled: -1 });
  } catch (error) {
    console.error('Error getting all technical tests:', error);
    throw error;
  }
};

/**
 * Delete technical test
 * @param {String} uuid - The technical test UUID
 * @returns {Promise<Object|null>} - The deleted technical test or null if not found
 */
export const deleteTechnicalTest = async (uuid) => {
  try {
    return await TechnicalTest.findOneAndDelete({ uuid });
  } catch (error) {
    console.error('Error deleting technical test:', error);
    throw error;
  }
}; 