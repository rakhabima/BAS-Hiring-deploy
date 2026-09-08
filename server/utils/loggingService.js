import prisma from "../db/prisma.js";

export const logActivity = async (activity, userId = null, details = {}, level = "INFO", req = null) => {
    try {
        const ipAddress = req ? req.ip : null;
        const userAgent = req ? req.headers["user-agent"] : null;

        await prisma.logEntry.create({
            data: { activity, userId, details, level, ipAddress, userAgent }
        });

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
