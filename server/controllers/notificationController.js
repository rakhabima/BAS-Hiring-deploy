import Notification from "../models/notificationModel.js";
import { getUnreadNotifications, markNotificationAsRead as markAsRead, markNotificationAsUnread as markAsUnread } from "../utils/notificationService.js";

// Get all notifications for a user with pagination and filtering
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get optional parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const readFilter = req.query.read === 'true'; // true = read, false = unread
    const type = req.query.type || null;
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { userId };
    
    // Add read filter if provided
    if (req.query.read !== undefined) {
      query.readStatus = readFilter;
    }
    
    // Add type filter if provided
    if (type) {
      query.type = type;
    }
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ dateCreated: -1 })
      .skip(skip)
      .limit(limit);
    
    return res.status(200).json({
      success: true,
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Get unread notifications for a user
export const getUnread = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const result = await getUnreadNotifications(userId);
    
    return res.status(200).json({
      success: true,
      notifications: result.notifications || []
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching unread notifications',
      error: error.message
    });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    console.log(`Received request to mark notification as read: ${notificationId}`);
    
    if (!notificationId) {
      console.log('No notification ID provided in request');
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }
    
    // First try to find the notification manually to verify it exists
    const notification = await Notification.findOne({ uuid: notificationId });
    
    if (!notification) {
      console.log(`Manual check - notification not found with ID: ${notificationId}`);
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    console.log(`Found notification before marking as read:`, notification);
    
    // Now call the service to mark it as read
    const result = await markAsRead(notificationId);
    
    if (!result.success) {
      console.log(`Service call failed to mark notification as read: ${result.message}`);
      return res.status(404).json({
        success: false,
        message: result.message || 'Notification not found'
      });
    }
    
    console.log(`Successfully marked notification as read:`, result.notification);
    
    return res.status(200).json({
      success: true,
      notification: result.notification
    });
  } catch (error) {
    console.error(`Server exception when marking notification as read:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark a notification as unread
export const markNotificationAsUnread = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    console.log(`Received request to mark notification as unread: ${notificationId}`);
    
    if (!notificationId) {
      console.log('No notification ID provided in request');
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }
    
    // First try to find the notification manually to verify it exists
    const notification = await Notification.findOne({ uuid: notificationId });
    
    if (!notification) {
      console.log(`Manual check - notification not found with ID: ${notificationId}`);
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    console.log(`Found notification before marking as unread:`, notification);
    
    // Now call the service to mark it as unread
    const result = await markAsUnread(notificationId);
    
    if (!result.success) {
      console.log(`Service call failed to mark notification as unread: ${result.message}`);
      return res.status(404).json({
        success: false,
        message: result.message || 'Notification not found'
      });
    }
    
    console.log(`Successfully marked notification as unread:`, result.notification);
    
    return res.status(200).json({
      success: true,
      notification: result.notification
    });
  } catch (error) {
    console.error(`Server exception when marking notification as unread:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error marking notification as unread',
      error: error.message
    });
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { userId, readStatus: false },
      { readStatus: true }
    );
    
    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
}; 