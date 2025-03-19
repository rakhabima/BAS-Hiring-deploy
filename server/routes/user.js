import express from "express";
import { createUser, getAllUsers, getUserByUUID, updateUser, deleteUser } from "../controllers/userController.js";
// Import middleware untuk autentikasi jika diperlukan
// import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", createUser);
router.get("/all", getAllUsers);
router.get("/:uuid", getUserByUUID);
router.put("/:uuid", updateUser);
router.delete("/:uuid", deleteUser);

export default router;