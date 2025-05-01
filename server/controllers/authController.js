import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { logActivity } from "../utils/loggingService.js";

export const signup = async (req, res) => {
    try {
        const { name, email, password, role, isPublicRegistration } = req.body;

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Mengecek email yang sudah terdaftar
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" });
        }

        // Validasi panjang password
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine role based on registration source
        let assignedRole;
        if (isPublicRegistration) {
            // Public registration always gets CANDIDATE role
            assignedRole = "CANDIDATE";
        } else {
            // Admin-created accounts can have specified roles
            assignedRole = role || "GUEST";
        }

        // Buat user baru dan simpan
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: assignedRole,
            status: true
        });
        await newUser.save();

        // Log the activity
        await logActivity(
            "User Registration",
            newUser.uuid,
            { email: newUser.email, role: newUser.role, isPublicRegistration },
            "INFO",
            req
        );

        // Hasilkan token JWT dan set cookie
        generateTokenAndSetCookie(newUser.uuid, newUser.role, res);

        res.status(201).json({
            uuid: newUser.uuid,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
            createdAt: newUser.createdAt
        });
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: `Internal Server Error ${error.message}` });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        console.log("ini login");
        console.log(user);

        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordCorrect) {
            // Log failed login attempt
            if (user) {
                await logActivity(
                    "Failed Login Attempt",
                    user.uuid,
                    { email: user.email, reason: "Incorrect password" },
                    "WARNING",
                    req
                );
            } else {
                await logActivity(
                    "Failed Login Attempt",
                    null,
                    { email, reason: "User not found" },
                    "WARNING",
                    req
                );
            }

            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Check if user account is active
        if (!user.status) {
            await logActivity(
                "Failed Login Attempt",
                user.uuid,
                { email: user.email, reason: "Account inactive" },
                "WARNING",
                req
            );

            return res.status(403).json({ error: "Account is inactive" });
        }

        // Update lastLogin timestamp
        user.lastLogin = new Date();
        await user.save();

        // Log successful login
        await logActivity(
            "User Login",
            user.uuid,
            { email: user.email, role: user.role },
            "INFO",
            req
        );

        generateTokenAndSetCookie(user.uuid, user.role, res);

        res.status(200).json({
            message: "Logged in successfully",
            user: {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: `Internal Server Error ${error.message}` });
    }
};

export const logout = async (req, res) => {
    try {
        // Log the logout activity if user info is available
        if (req.user) {
            await logActivity(
                "User Logout",
                req.user.uuid,
                { role: req.user.role },
                "INFO",
                req
            );
        }

        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
