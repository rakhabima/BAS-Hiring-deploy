import express from "express";
import { createOutsourcing, createOutsourcingRequest, deleteOutsourcing, getAllOutsourcing, getAllOutsourcingRequests, getOutsourcingById, handleDeleteOutsourcingRequest, updateOutsourcing, updateOutsourcingRequestFullData, updateRequestStatus, getOutsourcingRequestById } from "../controllers/outsourcingController.js";
import { authorize, protect } from "../utils/authMiddleware.js";

const router = express.Router();

// Gambar diunggah langsung dari browser ke Cloudinary; route ini hanya
// menerima URL-nya di body (lihat routes/upload.js).

// Pengelolaan layanan & persetujuan permintaan. Sebelumnya seluruh file ini
// tanpa autentikasi: siapa pun bisa membuat layanan, menyetujui permintaan,
// atau menghapusnya.
const gmOnly = [protect, authorize("GENERAL_MANAGER", "ADMIN")];

router.post("/create", ...gmOnly, createOutsourcing);
router.put("/update/:uuid", ...gmOnly, updateOutsourcing);

// Publik: katalog layanan di PublicServiceListPage / PublicServiceDetailPage.
router.get("/all", getAllOutsourcing);

// Pindahkan rute outsourcing requests di atas rute dinamis /:uuid
router.get("/requests", ...gmOnly, getAllOutsourcingRequests);

// Publik: form permintaan dari calon klien tanpa login (OutsourcingRequestPage).
router.post("/request", createOutsourcingRequest);

// Letakkan rute yang lebih spesifik dahulu
router.put("/request/update/:uuid", ...gmOnly, updateOutsourcingRequestFullData);
router.put("/request/:uuid", ...gmOnly, updateRequestStatus);
router.delete("/request/:uuid", ...gmOnly, handleDeleteOutsourcingRequest);

// Rute dinamis harus berada di bawah
router.get("/:uuid", getOutsourcingById);
router.get("/request/:uuid", ...gmOnly, getOutsourcingRequestById);
router.delete("/delete/:uuid", ...gmOnly, deleteOutsourcing);

export default router;
