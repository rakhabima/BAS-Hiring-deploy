import { createOutsourcingService, updateOutsourcingService, getAllOutsourcingServices } from "../services/outsourcingService.js";

export const createOutsourcing = async (req, res) => {
    try {
        // Ambil data dari body request
        const { serviceName, description, createdBy, location, imageUrl, capacity, price } = req.body;

        // Persiapkan data yang akan diproses oleh service
        const serviceData = { serviceName, description, createdBy, location, imageUrl, capacity, price };

        // Panggil service untuk membuat data layanan outsourcing
        const savedService = await createOutsourcingService(serviceData);

        // Kirim response sukses dengan data yang telah disimpan
        res.status(201).json({
            message: "Layanan outsourcing berhasil dibuat",
            savedService
        });
    } catch (error) {
        // Tangani error jika terjadi kesalahan
        res.status(500).json({
            message: "Terjadi kesalahan saat membuat layanan outsourcing",
            error: error.message
        });
    }
};

export const updateOutsourcing = async (req, res) => {
    try {
        // Ambil parameter uuid dari URL dan data update dari body
        const { uuid } = req.params;
        const updateData = req.body;

        // Panggil service untuk melakukan update
        const updatedService = await updateOutsourcingService(uuid, updateData);

        // Jika data tidak ditemukan, kirim response 404
        if (!updatedService) {
            return res.status(404).json({ message: "Layanan outsourcing tidak ditemukan" });
        }

        // Kirim response sukses dengan data yang telah diupdate
        res.status(201).json({
            message: "Layanan outsourcing berhasil diubah",
            updatedService
        });
    } catch (error) {
        // Tangani error jika terjadi kesalahan
        res.status(500).json({
            message: "Terjadi kesalahan saat mengupdate layanan outsourcing",
            error: error.message
        });
    }
};

export const getAllOutsourcing = async (req, res) => {
    try {
        // Panggil service untuk mengambil semua data layanan outsourcing
        const outsource = await getAllOutsourcingServices();

        // Kirim response sukses dengan data yang diambil
        res.status(200).json({
            message: "Berhasil mengambil data layanan outsourcing",
            outsource
        });
    } catch (error) {
        // Tangani error jika terjadi kesalahan
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data layanan outsourcing",
            error: error.message
        });
    }
};