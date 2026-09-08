import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";

// Dulu ada dua implementasi: utils/authMiddleware.js (protect/authorize) dan
// middleware/authMiddleware.js (authenticateUser/authorizeRoles). Isinya sama
// kecuali `protect` LUPA mengecek isDeleted — user yang sudah dihapus tetap
// bisa lolos di semua route yang memakainya. Disatukan di sini supaya
// pengecekannya berlaku di satu tempat untuk semua pemanggil.
//
// Body error memuat `error` DAN `message` karena kedua versi lama memakai key
// yang berbeda dan client membaca keduanya tergantung route.
const deny = (res, status, msg) => res.status(status).json({ error: msg, message: msg });

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return deny(res, 401, "Not authorized, no token");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { uuid: decoded.uuid },
            select: { uuid: true, name: true, email: true, role: true, status: true, isDeleted: true }
        });

        if (!user) {
            return deny(res, 401, "Not authorized, user not found");
        }

        if (!user.status || user.isDeleted) {
            return deny(res, 403, "Account is inactive or has been deleted");
        }

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
        deny(res, 401, "Not authorized, token failed");
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return deny(res, 401, "Not authorized, no user");
        }

        if (!roles.includes(req.user.role)) {
            return deny(res, 403, `Role ${req.user.role} is not authorized to access this resource`);
        }

        next();
    };
};

// Nama yang dipakai routes/technicalTest.js dan routes/jobApplication.js.
export const authenticateUser = protect;
export const authorizeRoles = authorize;
