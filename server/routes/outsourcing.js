import express from "express";
import multer from "multer";
import { createOutsourcing, createOutsourcingRequest, deleteOutsourcing, getAllOutsourcing, getAllOutsourcingRequests, getOutsourcingById, handleDeleteOutsourcingRequest, updateOutsourcing, updateOutsourcingRequestFullData, updateRequestStatus, getOutsourcingRequestById } from "../controllers/outsourcingController.js";

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.post("/create", upload.single('imageUrl'), createOutsourcing);
router.put("/update/:uuid", upload.single('imageUrl'), updateOutsourcing);
router.get("/all", getAllOutsourcing);

// Pindahkan rute outsourcing requests di atas rute dinamis /:uuid
router.get("/requests", getAllOutsourcingRequests);
router.post("/request", createOutsourcingRequest);
// Letakkan rute yang lebih spesifik dahulu
router.put("/request/update/:uuid", updateOutsourcingRequestFullData);
router.put("/request/:uuid", updateRequestStatus);
router.delete("/request/:uuid", handleDeleteOutsourcingRequest);

// Rute dinamis harus berada di bawah
router.get("/:uuid", getOutsourcingById);
router.get("/request/:uuid", getOutsourcingRequestById);
router.delete("/delete/:uuid", deleteOutsourcing);

export default router;
