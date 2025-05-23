import express from 'express';
import { getUnread, getUserNotifications, markAllAsRead, markNotificationAsRead, markNotificationAsUnread } from '../controllers/notificationController.js';

const router = express.Router();

// Test endpoint to confirm route is working
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  return res.status(200).json({
    success: true,
    message: 'Notification routes are working'
  });
});

// Get all notifications for a user
router.get('/', getUserNotifications);

// Get unread notifications for a user
router.get('/unread', getUnread);

// Mark notification as read - ensure this works with both PATCH and PUT methods
router.patch('/:notificationId/read', markNotificationAsRead);
router.put('/:notificationId/read', markNotificationAsRead); // Add PUT as fallback

// Mark notification as unread
router.patch('/:notificationId/unread', markNotificationAsUnread);
router.put('/:notificationId/unread', markNotificationAsUnread); // Add PUT as fallback

// Mark all notifications as read for a user
router.patch('/mark-all-read', markAllAsRead);
router.put('/mark-all-read', markAllAsRead); // Add PUT as fallback

export default router; 