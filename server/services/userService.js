import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";

const INTERNAL_ROLES = ["ADMIN", "RECRUITER", "GENERAL_MANAGER", "KOORDINATOR_LAPANGAN"];

// Field yang boleh diubah lewat updateUserService. Dulu `updateData` diteruskan
// mentah ke $set, jadi apa pun yang ada di req.body ikut tersimpan. Prisma
// menolak field tak dikenal, jadi daftar ini wajib ada — sekaligus menutup
// jalur mass-assignment.
const UPDATABLE_FIELDS = ["name", "email", "role", "status", "password"];

export const createUserService = async (userData) => {
    // Hash password sebelum disimpan
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Buat user baru dengan password yang sudah di-hash
    return prisma.user.create({
        data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || "GUEST"
        },
        omit: { password: true }
    });
};

// Mengambil data seluruh user yang ada
export const getAllUsersService = async () => {
    // Projection lama juga menyebut `fullName` dan `isActive`; keduanya tidak
    // pernah ada di schema, jadi selalu undefined. Tidak diikutkan.
    return prisma.user.findMany({
        where: { isDeleted: false },
        select: {
            uuid: true,
            name: true,
            email: true,
            role: true,
            status: true,
            lastLogin: true,
            createdAt: true
        }
    });
};

// Mengambil data internal staff (admin, GM, recruiter, dll) saja
export const getInternalStaffService = async () => {
    return prisma.user.findMany({
        where: { isDeleted: false, role: { in: INTERNAL_ROLES } },
        omit: { password: true }
    });
};

// Mengambil data kandidat saja
export const getCandidatesService = async () => {
    return prisma.user.findMany({
        where: { isDeleted: false, role: "CANDIDATE" },
        omit: { password: true }
    });
};

// Mendapatkan user berdasarkan UUID
export const getUserByUUIDService = async (uuid) => {
    const user = await prisma.user.findUnique({
        where: { uuid },
        omit: { password: true }
    });
    if (!user) {
        throw new Error("User tidak ditemukan");
    }
    return user;
};

// Meng-update data user berdasarkan UUID
export const updateUserService = async (uuid, updateData) => {
    const existingUser = await prisma.user.findUnique({ where: { uuid } });
    if (!existingUser) {
        throw new Error("User tidak ditemukan");
    }

    const data = {};
    for (const field of UPDATABLE_FIELDS) {
        if (updateData[field] !== undefined) {
            data[field] = updateData[field];
        }
    }

    // Jika ada update password, verifikasi password lama dan hash password baru
    if (data.password) {
        // Jika current password disediakan, verifikasi dulu
        if (updateData.currentPassword) {
            const isPasswordMatch = await bcrypt.compare(updateData.currentPassword, existingUser.password);
            if (!isPasswordMatch) {
                throw new Error("Password saat ini tidak valid");
            }
        }

        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
    }

    // Make sure status is properly handled as a boolean
    if (data.status !== undefined) {
        data.status = Boolean(data.status);
    }

    return prisma.user.update({
        where: { uuid },
        data,
        omit: { password: true }
    });
};

// Menghapus user berdasarkan UUID (soft delete)
export const deleteUserService = async (uuid) => {
    const existingUser = await prisma.user.findUnique({ where: { uuid } });
    if (!existingUser) {
        throw new Error("User tidak ditemukan");
    }

    const result = await prisma.user.update({
        where: { uuid },
        data: { isDeleted: true }
    });

    return {
        message: "User berhasil dihapus",
        data: {
            uuid: result.uuid,
            name: result.name,
            email: result.email,
            isDeleted: result.isDeleted
        }
    };
};

// Verifikasi password pengguna
export const verifyPasswordService = async (uuid, currentPassword) => {
    const user = await prisma.user.findUnique({ where: { uuid } });
    if (!user) {
        throw new Error("User tidak ditemukan");
    }

    return bcrypt.compare(currentPassword, user.password);
};
