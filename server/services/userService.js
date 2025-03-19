import bcrypt from "bcryptjs";
import User from "../models/userModel.js";


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
        console.log('Fetching all users from database...');
        // Get all internal staff users who aren't deleted
        // Include roles ADMIN, RECRUITER, GENERAL_MANAGER, KOORDINATOR_LAPANGAN only
        const users = await User.find(
            { 
                isDeleted: false,
                role: { 
                    $in: ['ADMIN', 'RECRUITER', 'GENERAL_MANAGER', 'KOORDINATOR_LAPANGAN'] 
                }
            }, 
            { password: 0 }
        ); // Exclude password field
        
        console.log(`Found ${users.length} internal staff users`);
        return users;
    } catch (error) {
        console.error('Error in getAllUsersService:', error);
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
        console.log(`Updating user with UUID: ${uuid}`, updateData);
        
        // First check if the user exists
        const existingUser = await User.findOne({ uuid });
        if (!existingUser) {
            throw new Error("User tidak ditemukan");
        }

        // Jika ada update password, hash password baru
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        // Make sure status is properly handled as a boolean
        if (updateData.status !== undefined) {
            updateData.status = Boolean(updateData.status);
        }

        console.log(`User found, applying updates:`, updateData);

        const updatedUser = await User.findOneAndUpdate(
            { uuid },  // Use uuid for finding the user
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        console.log(`User updated successfully:`, updatedUser);

        return updatedUser;
    } catch (error) {
        console.error(`Error in updateUserService:`, error);
        throw error;
    }
};


// Menghapus user berdasarkan UUID
export const deleteUserService = async (uuid) => {
    try {
        console.log(`Deleting user with UUID: ${uuid}`);
        
        // First check if the user exists
        const existingUser = await User.findOne({ uuid });
        if (!existingUser) {
            throw new Error("User tidak ditemukan");
        }
        
        // Update the user to mark as deleted
        const result = await User.findOneAndUpdate(
            { uuid },
            { isDeleted: true },
            { new: true }
        );

        console.log(`User deleted successfully. Updated record:`, result);

        return { 
            message: "User berhasil dihapus",
            data: {
                uuid: result.uuid,
                name: result.name,
                email: result.email,
                isDeleted: result.isDeleted
            }
        };
    } catch (error) {
        console.error(`Error in deleteUserService:`, error);
        throw error;
    }
};