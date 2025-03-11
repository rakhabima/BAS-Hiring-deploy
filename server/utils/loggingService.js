import LogEntry from "../models/logEntryModel.js";

export const logActivity = async (activity, userId = null, details = {}, level = "INFO", req = null) => {
    try {
        const ipAddress = req ? req.ip : null;
        const userAgent = req ? req.headers["user-agent"] : null;
        
        await LogEntry.logActivity(activity, userId, details, level, ipAddress, userAgent);
        
        return {
            success: true,
            message: "Activity logged successfully"
        };
    } catch (error) {
        console.error("Error logging activity:", error);
        return {
            success: false,
            message: error.message
        };
    }
};

export const getActivityLogs = async (filters = {}, limit = 100, skip = 0) => {
    try {
        const logs = await LogEntry.find(filters)
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip)
            .populate('userId', 'name email');
        
        const total = await LogEntry.countDocuments(filters);
        
        return {
            success: true,
            logs,
            total,
            page: Math.floor(skip / limit) + 1,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error("Error getting activity logs:", error);
        return {
            success: false,
            message: error.message
        };
    }
}; 