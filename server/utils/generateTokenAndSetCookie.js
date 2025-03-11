import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (uuid, userRole, res) => {
    const token = jwt.sign(
        { 
            uuid,
            role: userRole
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: "15d" }
    );

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 hari
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
};