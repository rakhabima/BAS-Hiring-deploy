import express from "express";
import { createOutsourcing, updateOutsourcing, getAllOutsourcing } from "../controllers/outsourcingController.js";

const router = express.Router();

router.post("/create", createOutsourcing);
router.put("/update/:uuid", updateOutsourcing);
router.get("/all", getAllOutsourcing);

export default router;
