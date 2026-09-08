import express from 'express';
import { getUnread, getUserNotifications, markAllAsRead, markNotificationAsRead, markNotificationAsUnread } from '../controllers/notificationController.js';
import { protect } from '../utils/authMiddleware.js';

const router = express.Router();

// Sebelumnya seluruh file ini tanpa autentikasi, dan userId diambil dari
// req.query / req.body — siapa pun bisa membaca dan menandai notifikasi orang
// lain hanya dengan menebak uuid. Sekarang userId selalu dari sesi.
router.use(protect);

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
