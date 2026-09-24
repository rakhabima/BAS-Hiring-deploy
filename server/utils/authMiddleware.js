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

// Mengizinkan pemilik data (uuid di :uuid params) ATAU salah satu role yang
// disebut. Dipakai route yang punya dua jenis pemanggil: staff yang mengelola
// orang lain, dan user biasa yang mengurus dirinya sendiri (mis. ProfileUser).
export const selfOrRoles = (...roles) => (req, res, next) => {
    if (!req.user) {
        return deny(res, 401, "Not authorized, no user");
    }

    if (req.params.uuid === req.user.uuid || roles.includes(req.user.role)) {
        return next();
    }

    return deny(res, 403, "Not authorized to access this resource");
};

// Staff boleh melihat lamaran siapa pun; kandidat hanya miliknya sendiri.
const STAFF_ROLES = ["RECRUITER", "GENERAL_MANAGER", "ADMIN", "KOORDINATOR_LAPANGAN"];

/**
 * Memastikan pemanggil berhak atas sebuah JobApplication.
 * `resolveApplicationId(req)` mengembalikan uuid aplikasi (bisa async), karena
 * setiap route menyimpannya di tempat berbeda: langsung di params, atau harus
 * ditelusuri lewat Interview / TechnicalTest.
 *
 * Ini menggantikan cek kepemilikan yang di routes/interview.js dan
 * technicalTest.js hanya berupa komentar "we'll check in individual routes"
 * (dan satu blok yang dikomentari total), sehingga kandidat mana pun bisa
 * membaca dan mengubah data kandidat lain.
 */
export const ownsApplication = (resolveApplicationId) => async (req, res, next) => {
    try {
        if (!req.user) {
            return deny(res, 401, "Not authorized, no user");
        }

        if (STAFF_ROLES.includes(req.user.role)) {
            return next();
        }

        const applicationId = await resolveApplicationId(req);
        if (!applicationId) {
            return deny(res, 404, "Application not found");
        }

        const application = await prisma.jobApplication.findUnique({
            where: { uuid: applicationId },
            select: { candidateId: true }
        });

        if (!application) {
            return deny(res, 404, "Application not found");
        }

        if (application.candidateId !== req.user.uuid) {
            return deny(res, 403, "Not authorized to access this application");
        }

        next();
    } catch (error) {
        console.error("Error in ownsApplication middleware:", error);
        deny(res, 500, "Authorization check failed");
    }
};

// Nama yang dipakai routes/technicalTest.js dan routes/jobApplication.js.
export const authenticateUser = protect;
export const authorizeRoles = authorize;
