import { v4 as uuidv4 } from "uuid";
import Guest from "../models/guestModel.js";

export const createGuestSession = async (req, res) => {
    try {
        // Generate a unique session ID
        const sessionId = uuidv4();
        
        // Create a new guest session
        const newGuest = new Guest({
            sessionId
        });
        
        await newGuest.save();
        
        // Set a cookie with the session ID
        res.cookie("guestSession", sessionId, {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true,
            sameSite: "strict"
        });
        
        res.status(201).json({
            message: "Guest session created successfully",
            uuid: newGuest.uuid
        });
    } catch (error) {
        console.log("Error in createGuestSession controller", error.message);
        res.status(500).json({ error: `Internal Server Error ${error.message}` });
    }
};

export const getGuestSession = async (req, res) => {
    try {
        const { guestSession } = req.cookies;
        
        if (!guestSession) {
            return res.status(404).json({ error: "Guest session not found" });
        }
        
        const guest = await Guest.findOne({ sessionId: guestSession });
        
        if (!guest) {
            return res.status(404).json({ error: "Guest session expired or invalid" });
        }
        
        res.status(200).json({
            uuid: guest.uuid,
            role: "GUEST"
        });
    } catch (error) {
        console.log("Error in getGuestSession controller", error.message);
        res.status(500).json({ error: `Internal Server Error ${error.message}` });
    }
}; 