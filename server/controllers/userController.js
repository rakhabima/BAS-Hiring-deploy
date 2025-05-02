import { createUserService, deleteUserService, getAllUsersService, getCandidatesService, getInternalStaffService, getUserByUUIDService, updateUserService, verifyPasswordService } from "../services/userService.js";

// Controller untuk membuat user baru
export const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validasi input dasar
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nama, email, dan password harus diisi"
            });
        }

        // Buat user baru
        const newUser = await createUserService({
            name,
            email,
            password,
            role
        });

        return res.status(201).json({
            success: true,
            message: "User berhasil dibuat",
            data: newUser
        });
    } catch (error) {
        // Handle duplicate email
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email sudah terdaftar"
            });
        }

        console.error("Error creating user:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal membuat user",
            error: error.message
        });
    }
};

// Controller untuk mendapatkan semua user
export const getAllUsers = async (req, res) => {
    try {
        const users = await getAllUsersService();

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan semua user",
            data: users
        });
    } catch (error) {
        console.error("Error getting users:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mendapatkan daftar user",
            error: error.message
        });
    }
};

// Controller untuk mendapatkan user berdasarkan UUID
export const getUserByUUID = async (req, res) => {
    try {
        const { uuid } = req.params;
        const user = await getUserByUUIDService(uuid);

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan data user",
            data: user
        });
    } catch (error) {
        console.error("Error getting user by UUID:", error);
        return res.status(404).json({
            success: false,
            message: error.message || "User tidak ditemukan",
            error: error.message
        });
    }
};

// Controller untuk memperbarui data user
export const updateUser = async (req, res) => {
    try {
        const { uuid } = req.params;  // Get UUID from the route parameters
        const updateData = req.body;  // Get update data from request body

        // Ensure that at least one field is provided to update
        if (!updateData.name && !updateData.email && !updateData.role && !updateData.status && !updateData.password) {
            return res.status(400).json({
                success: false,
                message: "Harap sertakan data yang ingin diperbarui (name, email, role, password, atau status)"
            });
        }

        const updatedUser = await updateUserService(uuid, updateData);  // Pass UUID to service

        return res.status(200).json({
            success: true,
            message: "User berhasil diperbarui",
            data: updatedUser
        });
    } catch (error) {
        console.error("Error updating user:", error);

        // Handle duplicate email
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email sudah digunakan"
            });
        }

        return res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
            success: false,
            message: error.message || "Gagal memperbarui user",
            error: error.message
        });
    }
};

// Controller untuk menghapus user
export const deleteUser = async (req, res) => {
    try {
        const { uuid } = req.params;
        const result = await deleteUserService(uuid); // Changed from id to uuid

        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
            success: false,
            message: error.message || "Gagal menghapus user",
            error: error.message
        });
    }
};

// Controller untuk mendapatkan hanya internal staff
export const getInternalStaff = async (req, res) => {
    try {
        const users = await getInternalStaffService();

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan daftar staff internal",
            data: users
        });
    } catch (error) {
        console.error("Error getting internal staff:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mendapatkan daftar staff internal",
            error: error.message
        });
    }
};

// Controller untuk mendapatkan hanya kandidat
export const getCandidates = async (req, res) => {
    try {
        const users = await getCandidatesService();

        return res.status(200).json({
            success: true,
            message: "Berhasil mendapatkan daftar kandidat",
            data: users
        });
    } catch (error) {
        console.error("Error getting candidates:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mendapatkan daftar kandidat",
            error: error.message
        });
    }
};

// Controller untuk verifikasi password
export const verifyPassword = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { currentPassword } = req.body;

        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: "Password saat ini wajib diisi"
            });
        }

        const isPasswordValid = await verifyPasswordService(uuid, currentPassword);

        return res.status(200).json({
            success: isPasswordValid,
            message: isPasswordValid 
                ? "Password valid" 
                : "Password tidak valid"
        });
    } catch (error) {
        console.error("Error verifying password:", error);
        return res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
            success: false,
            message: error.message || "Gagal memverifikasi password",
            error: error.message
        });
    }
};