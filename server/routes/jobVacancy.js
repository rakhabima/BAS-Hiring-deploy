import express from "express";
import { createJobVacancyController, updateJobVacancyController } from "../controllers/jobVacancyController.js";

const router = express.Router();

router.post("/create", createJobVacancyController);
router.put("/update/:uuid", updateJobVacancyController);

export default router;
