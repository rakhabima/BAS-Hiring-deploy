import express from "express";
import { createUser, getAllUsers, getUserByUUID, updateUser, deleteUser, updateUserStatus } from "../controllers/userController.js";
// Import middleware untuk autentikasi jika diperlukan
// import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", createUser);
router.get("/all", getAllUsers);
router.get("/uuid/:uuid", getUserByUUID);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/status", updateUserStatus);

export default router;