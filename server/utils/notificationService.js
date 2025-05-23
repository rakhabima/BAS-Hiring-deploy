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
        console.log(`Attempting to mark notification as read: ${notificationId}`);
        
        // Use findOne to check if the notification exists first
        const notification = await Notification.findOne({ uuid: notificationId });
        
        if (!notification) {
            console.log(`No notification found with uuid: ${notificationId}`);
            return {
                success: false,
                message: "Notification not found"
            };
        }
        
        console.log(`Found notification with status: ${notification.readStatus}`);
        
        // Already marked as read? Return success
        if (notification.readStatus) {
            console.log(`Notification ${notificationId} was already marked as read`);
            return {
                success: true,
                notification
            };
        }
        
        // Directly update with mongoose to ensure it works
        notification.readStatus = true;
        notification.markModified('readStatus');
        
        try {
            // Use the save method for more reliable updates
            const savedNotification = await notification.save();
            console.log(`Successfully saved notification with updated status: ${savedNotification.readStatus}`);
            
            // Double-check that the update worked by querying again
            const verifiedNotification = await Notification.findOne({ uuid: notificationId });
            console.log(`Verified notification read status: ${verifiedNotification?.readStatus}`);
            
            return {
                success: true,
                notification: savedNotification
            };
        } catch (saveError) {
            console.error(`Error saving notification: ${saveError.message}`);
            
            // If save fails, try updateOne as a fallback
            try {
                console.log(`Trying updateOne as fallback for ${notificationId}`);
                const updateResult = await Notification.updateOne(
                    { uuid: notificationId },
                    { $set: { readStatus: true } }
                );
                
                console.log(`UpdateOne result:`, updateResult);
                
                if (updateResult.modifiedCount > 0) {
                    const updatedNotification = await Notification.findOne({ uuid: notificationId });
                    return {
                        success: true,
                        notification: updatedNotification
                    };
                }
            } catch (updateError) {
                console.error(`Fallback update also failed: ${updateError.message}`);
            }
            
            throw saveError;
        }
    } catch (error) {
        console.error(`Error marking notification as read: ${notificationId}`, error);
        return {
            success: false,
            message: error.message
        };
    }
};

export const markNotificationAsUnread = async (notificationId) => {
    try {
        console.log(`Attempting to mark notification as unread: ${notificationId}`);
        
        // Use findOne to check if the notification exists first
        const notification = await Notification.findOne({ uuid: notificationId });
        
        if (!notification) {
            console.log(`No notification found with uuid: ${notificationId}`);
            return {
                success: false,
                message: "Notification not found"
            };
        }
        
        console.log(`Found notification with status: ${notification.readStatus}`);
        
        // Already marked as unread? Return success
        if (!notification.readStatus) {
            console.log(`Notification ${notificationId} was already marked as unread`);
            return {
                success: true,
                notification
            };
        }
        
        // Directly update with mongoose to ensure it works
        notification.readStatus = false;
        notification.markModified('readStatus');
        
        try {
            // Use the save method for more reliable updates
            const savedNotification = await notification.save();
            console.log(`Successfully saved notification with updated status: ${savedNotification.readStatus}`);
            
            // Double-check that the update worked by querying again
            const verifiedNotification = await Notification.findOne({ uuid: notificationId });
            console.log(`Verified notification read status: ${verifiedNotification?.readStatus}`);
            
            return {
                success: true,
                notification: savedNotification
            };
        } catch (saveError) {
            console.error(`Error saving notification: ${saveError.message}`);
            
            // If save fails, try updateOne as a fallback
            try {
                console.log(`Trying updateOne as fallback for ${notificationId}`);
                const updateResult = await Notification.updateOne(
                    { uuid: notificationId },
                    { $set: { readStatus: false } }
                );
                
                console.log(`UpdateOne result:`, updateResult);
                
                if (updateResult.modifiedCount > 0) {
                    const updatedNotification = await Notification.findOne({ uuid: notificationId });
                    return {
                        success: true,
                        notification: updatedNotification
                    };
                }
            } catch (updateError) {
                console.error(`Fallback update also failed: ${updateError.message}`);
            }
            
            throw saveError;
        }
    } catch (error) {
        console.error(`Error marking notification as unread: ${notificationId}`, error);
        return {
            success: false,
            message: error.message
        };
    }
}; 