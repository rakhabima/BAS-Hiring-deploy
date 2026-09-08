import { $Enums } from "@prisma/client";
import prisma from "../db/prisma.js";
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

    // Postgres menolak nilai enum tak dikenal (Mongo dulu diam-diam
    // mengembalikan array kosong), jadi disaring sebelum menyentuh query.
    if (type && !(type in $Enums.NotificationType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid notification type: ${type}`
      });
    }

    // Build query
    const where = { userId };
    
    // Add read filter if provided
    if (req.query.read !== undefined) {
      where.readStatus = readFilter;
    }
    
    // Add type filter if provided
    if (type) {
      where.type = type;
    }

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { dateCreated: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

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

// Mark a notification as read / unread.
// Pengecekan "apakah baris ada" dulu dilakukan dua kali (di controller lalu di
// service); sekarang cukup sekali lewat hasil update di service.
const setReadStatus = (markFn, label) => async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    const result = await markFn(notificationId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      notification: result.notification
    });
  } catch (error) {
    console.error(`Server exception when marking notification as ${label}:`, error);
    return res.status(500).json({
      success: false,
      message: `Error marking notification as ${label}`,
      error: error.message
    });
  }
};

export const markNotificationAsRead = setReadStatus(markAsRead, 'read');

export const markNotificationAsUnread = setReadStatus(markAsUnread, 'unread');

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
    const result = await prisma.notification.updateMany({
      where: { userId, readStatus: false },
      data: { readStatus: true }
    });

    return res.status(200).json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      count: result.count
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
