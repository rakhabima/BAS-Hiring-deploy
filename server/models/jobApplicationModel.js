import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const jobApplicationSchema = new mongoose.Schema({
    // Identifikasi dan status aplikasi
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    candidateId: {
        type: String,
        ref: "User",
        required: true
    },
    jobPostingId: {
        type: String,
        ref: "JobPosting",
        required: true
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["PENDING", "REVIEWING", "INTERVIEW_SCHEDULED", "TECHNICAL_TEST", "REJECTED", "ACCEPTED", "ON_JOB", "REVISION"],
        default: "PENDING"
    },
    
    // Informasi Pribadi
    nama_ktp: {
        type: String,
        required: true
    },
    jenis_kelamin: {
        type: String,
        required: true,
        enum: ["Laki - Laki", "Perempuan"]
    },
    nik: {
        type: String,
        required: true
    },
    tanggal_lahir: {
        type: Date,
        required: true
    },
    agama: {
        type: String,
        required: true,
        enum: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
    },
    pendidikan_terakhir: {
        type: String,
        required: true,
        enum: ["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4/S1", "S2", "S3"]
    },
    
    // Informasi Kontak
    email: {
        type: String,
        required: true
    },
    no_hp: {
        type: String,
        required: true
    },
    no_hp_darurat: {
        type: String,
        required: true
    },
    pemilik_no_hp_darurat: {
        type: String,
        required: true
    },
    hubungan_dgn_pemilik_no_hp_darurat: {
        type: String,
        required: true
    },
    
    // Informasi Alamat
    kota: {
        type: String,
        required: true
    },
    kecamatan: {
        type: String,
        required: true
    },
    kelurahan: {
        type: String,
        required: true
    },
    alamat: {
        type: String,
        required: true
    },
    
    // Informasi Kendaraan (opsional, hanya diperlukan untuk posisi kurir)
    no_sim: {
        type: String,
        default: null
    },
    tipe_sim: {
        type: String,
        enum: ["Tidak Punya", "SIM A", "SIM B1", "SIM B2", "SIM C"],
        default: "Tidak Punya"
    },
    masa_berlaku_sim: {
        type: Date,
        default: null
    },
    merk_kendaraan: {
        type: String,
        default: null
    },
    tahun_produksi_kendaraan: {
        type: String,
        default: null
    },
    no_pol_kendaraan: {
        type: String,
        default: null
    },
    no_stnk: {
        type: String,
        default: null
    },
    masa_berlaku_stnk: {
        type: Date,
        default: null
    },
    masa_berlaku_pajak_kendaraan: {
        type: Date,
        default: null
    },
    
    // Informasi Bank
    no_rekening: {
        type: String,
        required: true
    },
    nama_pemilik_rekening: {
        type: String,
        required: true
    },
    nama_bank: {
        type: String,
        required: true
    },
    
    // Informasi Pekerjaan
    posisi_dilamar: {
        type: String,
        required: true
    },
    lama_pengalaman_kerja: {
        type: String
    },
    ekspektasi_lama_bekerja: {
        type: String
    },
    
    // Dokumen
    foto_diri: {
        type: String,
        required: true
    },
    foto_ktp: {
        type: String,
        required: true
    },
    foto_sim: {
        type: String,
        default: null
    },
    foto_stnk_hal_1: {
        type: String,
        default: null
    },
    foto_stnk_hal_2: {
        type: String,
        default: null
    },
    foto_ijazah: {
        type: String,
        required: true
    },
    
    // Field untuk catatan tambahan
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

export default JobApplication; 