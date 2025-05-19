// utils/multer-storage-cloudinary.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        try {
            console.log('📥 File masuk ke Multer-Cloudinary:', {
                field: file?.fieldname,
                originalname: file?.originalname,
                mimetype: file?.mimetype,
            });

            return {
                folder: 'job-applications',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
                transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
                public_id: `${Date.now()}-${file.originalname}`,
            };
        } catch (err) {
            console.error("❌ ERROR di CloudinaryStorage PARAMS:", err);
            throw err;
        }
      }
});

export const upload = multer({ storage });
