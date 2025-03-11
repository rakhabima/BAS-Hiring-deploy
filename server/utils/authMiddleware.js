import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        
        if (!token) {
            return res.status(401).json({ error: "Not authorized, no token" });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from the token
        const user = await User.findOne({ uuid: decoded.uuid });
        
        if (!user) {
            return res.status(401).json({ error: "Not authorized, user not found" });
        }
        
        // Check if user account is active
        if (!user.status) {
            return res.status(403).json({ error: "Account is inactive" });
        }
        
        // Add user info to request
        req.user = {
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        };
        
        next();
    } catch (error) {
        console.error("Error in auth middleware:", error);
        res.status(401).json({ error: "Not authorized, token failed" });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authorized, no user" });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Role ${req.user.role} is not authorized to access this resource` });
        }
        
        next();
    };
}; 