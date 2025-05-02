import * as interviewService from '../services/interviewService.js';

// Create a new interview
export const createInterviewController = async (req, res) => {
  try {
    const interviewData = req.body;
    
    // Validate required fields
    if (!interviewData.applicationId || !interviewData.interviewDate) {
      return res.status(400).json({
        message: 'Application ID and interview date are required'
      });
    }
    
    const interview = await interviewService.createInterview(interviewData);
    
    res.status(201).json({
      message: 'Interview created successfully',
      data: interview
    });
  } catch (error) {
    console.error('Error in createInterviewController:', error);
    
    if (error.message === 'Application not found') {
      return res.status(404).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Failed to create interview',
      error: error.message
    });
  }
};

// Get interview by ID
export const getInterviewByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await interviewService.getInterviewById(id);
    
    if (!interview) {
      return res.status(404).json({
        message: 'Interview not found'
      });
    }
    
    res.status(200).json({
      data: interview
    });
  } catch (error) {
    console.error('Error in getInterviewByIdController:', error);
    
    res.status(500).json({
      message: 'Failed to get interview',
      error: error.message
    });
  }
};

// Get interview by application ID
export const getInterviewByApplicationIdController = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const interview = await interviewService.getInterviewByApplicationId(applicationId);
    
    if (!interview) {
      return res.status(404).json({
        message: 'Interview not found for this application'
      });
    }
    
    res.status(200).json({
      data: interview
    });
  } catch (error) {
    console.error('Error in getInterviewByApplicationIdController:', error);
    
    if (error.message === 'Application not found') {
      return res.status(404).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Failed to get interview by application ID',
      error: error.message
    });
  }
};

// Update an interview
export const updateInterviewController = async (req, res) => {
  try {
    const { id } = req.params;
    const interviewData = req.body;
    
    const interview = await interviewService.updateInterview(id, interviewData);
    
    res.status(200).json({
      message: 'Interview updated successfully',
      data: interview
    });
  } catch (error) {
    console.error('Error in updateInterviewController:', error);
    
    if (error.message === 'Interview not found') {
      return res.status(404).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Failed to update interview',
      error: error.message
    });
  }
};

// Update candidate response
export const updateInterviewResponseController = async (req, res) => {
  try {
    const { id } = req.params;
    const responseData = req.body;
    
    const interview = await interviewService.updateInterviewResponse(id, responseData);
    
    res.status(200).json({
      message: 'Interview response updated successfully',
      data: interview
    });
  } catch (error) {
    console.error('Error in updateInterviewResponseController:', error);
    
    if (error.message === 'Interview not found') {
      return res.status(404).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Failed to update interview response',
      error: error.message
    });
  }
};

// Get all interviews
export const getAllInterviewsController = async (req, res) => {
  try {
    const interviews = await interviewService.getAllInterviews();
    
    res.status(200).json({
      data: interviews
    });
  } catch (error) {
    console.error('Error in getAllInterviewsController:', error);
    
    res.status(500).json({
      message: 'Failed to get all interviews',
      error: error.message
    });
  }
};

// Delete an interview
export const deleteInterviewController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await interviewService.deleteInterview(id);
    
    res.status(200).json({
      message: 'Interview deleted successfully',
      data: interview
    });
  } catch (error) {
    console.error('Error in deleteInterviewController:', error);
    
    if (error.message === 'Interview not found') {
      return res.status(404).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Failed to delete interview',
      error: error.message
    });
  }
}; 