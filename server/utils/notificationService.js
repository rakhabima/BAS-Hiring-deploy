import prisma from "../db/prisma.js";
import { sendEmail } from "./emailService.js";
import { sendSMS } from "./smsService.js";

export const createNotification = async (userId, message, type, relatedId = null, relatedModel = null) => {
    try {
        const notification = await prisma.notification.create({
            data: { userId, message, type, relatedId, relatedModel }
        });

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
        const notifications = await prisma.notification.findMany({
            where: { userId, readStatus: false },
            orderBy: { dateCreated: "desc" }
        });

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

const setReadStatus = async (notificationId, readStatus) => {
    try {
        const notification = await prisma.notification.update({
            where: { uuid: notificationId },
            data: { readStatus }
        });

        return { success: true, notification };
    } catch (error) {
        // P2025 = baris tidak ada; dulu dibedakan dari error lain lewat findOne dulu.
        if (error.code === "P2025") {
            return { success: false, message: "Notification not found" };
        }
        console.error(`Error setting read status for ${notificationId}:`, error);
        return { success: false, message: error.message };
    }
};

export const markNotificationAsRead = (notificationId) => setReadStatus(notificationId, true);

export const markNotificationAsUnread = (notificationId) => setReadStatus(notificationId, false);
