import express from "express";
import cloudinary from "../utils/cloudinary.js";
import { protect } from "../utils/authMiddleware.js";

const router = express.Router();

// Berkas diunggah langsung dari browser ke Cloudinary, bukan lewat server ini.
// Alasannya: serverless function Vercel membatasi body request 4.5 MB,
// sementara form lamaran mengirim 6 berkas sekaligus. Server hanya menerbitkan
// tanda tangan berumur pendek, lalu menyimpan URL hasilnya.
//
// Signed, bukan unsigned preset: preset tak bertanda tangan bisa dipakai siapa
// pun yang mengetahui cloud name, sehingga akun Cloudinary bisa dijadikan
// tempat penampungan berkas orang lain.
const FOLDERS = {
    "job-applications": true,
    "technical-tests": true,
    "job-vacancies": true,
    "outsourcing-services": true
};

router.post("/signature", protect, (req, res) => {
    try {
        const folder = FOLDERS[req.body?.folder] ? req.body.folder : "job-applications";
        const timestamp = Math.round(Date.now() / 1000);

        // Parameter yang ikut ditandatangani HARUS sama persis dengan yang
        // dikirim browser ke Cloudinary, kalau tidak tanda tangannya ditolak.
        const params = { folder, timestamp };
        const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

        res.status(200).json({
            signature,
            timestamp,
            folder,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (error) {
        console.error("Error creating upload signature:", error);
        res.status(500).json({ message: "Gagal membuat tanda tangan unggah" });
    }
});

export default router;
