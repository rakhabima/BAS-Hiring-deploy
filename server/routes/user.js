import express from "express";
import { createUser, deleteUser, getAllUsers, getCandidates, getInternalStaff, getUserByUUID, updateUser } from "../controllers/userController.js";
// Import middleware untuk autentikasi jika diperlukan
// import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", createUser);
router.get("/all", getAllUsers);
router.get("/internal-staff", getInternalStaff);
router.get("/candidates", getCandidates);
router.get("/:uuid", getUserByUUID);
router.put("/:uuid", updateUser);
router.delete("/:uuid", deleteUser);

export default router;