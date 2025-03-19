import express from "express";
import multer from "multer";
import { createOutsourcing, createOutsourcingRequest, deleteOutsourcing, getAllOutsourcing, getOutsourcingById, updateOutsourcing } from "../controllers/outsourcingController.js";

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
router.get("/:uuid", getOutsourcingById);
router.delete("/delete/:uuid", deleteOutsourcing);
router.post("/request", createOutsourcingRequest);

export default router;
