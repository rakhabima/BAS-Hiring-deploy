import User from "../models/userModel.js";
import bcrypt from "bcryptjs";


export const createUserService = async (userData) => {
    try {
        // Hash password sebelum disimpan
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Buat user baru dengan password yang sudah di-hash
        const newUser = new User({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || "GUEST"
        });

        // Simpan user ke database
        const savedUser = await newUser.save();

        // Return user tanpa password
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        return userResponse;
    } catch (error) {
        throw error;
    }
};

// Mengambil data seluruh user yang ada
export const getAllUsersService = async () => {
    try {
        const users = await User.find(
            { isDeleted: false },
            { password: 0 }); // Exclude password field
        return users;
    } catch (error) {
        throw error;
    }
};

// Mendapatkan user berdasarkan UUID
export const getUserByUUIDService = async (uuid) => {
    try {
        const user = await User.findOne({ uuid }, { password: 0 });
        if (!user) {
            throw new Error("User tidak ditemukan");
        }
        return user;
    } catch (error) {
        throw error;
    }
};

// Meng-update data user berdasarkan UUID
export const updateUserService = async (uuid, updateData) => {
    try {
        // Jika ada update password, hash password baru
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        const updatedUser = await User.findOneAndUpdate(
            { uuid },  // Use uuid for finding the user
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            throw new Error("User tidak ditemukan");
        }

        return updatedUser;
    } catch (error) {
        throw error;
    }
};


// Menghapus user berdasarkan UUID
export const deleteUserService = async (uuid) => {
    try {
        const result = await User.findOneAndUpdate(
            { uuid },
            {
                isDeleted: true,
            },
            { new: true }
        );

        if (!result) {
            throw new Error("User tidak ditemukan");
        }

        return { message: "User berhasil dihapus" };
    } catch (error) {
        throw error;
    }
};