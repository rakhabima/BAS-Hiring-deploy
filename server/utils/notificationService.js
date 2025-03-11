import Notification from "../models/notificationModel.js";
import { sendEmail } from "./emailService.js";
import { sendSMS } from "./smsService.js";

export const createNotification = async (userId, message, type, relatedId = null, relatedModel = null) => {
    try {
        const notification = new Notification({
            userId,
            message,
            type,
            relatedId,
            relatedModel
        });
        
        await notification.save();
        
        return {
            success: true,
            notification
        };
    } catch (error) {
        console.error("Error creating notification:", error);
        return {
            success: false,
            message: error.message
        };
    }
};

export const sendNotification = async (userId, message, type, options = {}) => {
    try {
        // Create in-app notification
        const notificationResult = await createNotification(
            userId, 
            message, 
            type, 
            options.relatedId, 
            options.relatedModel
        );
        
        // Send email notification if requested
        if (options.sendEmail && options.email) {
            await sendEmail(
                options.email,
                options.emailSubject || `BAS Hiring - ${type} Notification`,
                options.emailBody || message
            );
        }
        
        // Send SMS notification if requested
        if (options.sendSMS && options.phone) {
            await sendSMS(
                options.phone,
                options.smsBody || message
            );
        }
        
        return {
            success: true,
            notification: notificationResult.notification
        };
    } catch (error) {
        console.error("Error sending notification:", error);
        return {
            success: false,
            message: error.message
        };
    }
};

export const getUnreadNotifications = async (userId) => {
    try {
        const notifications = await Notification.find({
            userId,
            readStatus: false
        }).sort({ dateCreated: -1 });
        
        return {
            success: true,
            notifications
        };
    } catch (error) {
        console.error("Error getting unread notifications:", error);
        return {
            success: false,
            message: error.message
        };
    }
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const notification = await Notification.findOne({ uuid: notificationId });
        
        if (!notification) {
            return {
                success: false,
                message: "Notification not found"
            };
        }
        
        await notification.markAsRead();
        
        return {
            success: true,
            notification
        };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return {
            success: false,
            message: error.message
        };
    }
}; 