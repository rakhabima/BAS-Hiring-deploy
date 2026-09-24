import express from "express";
import { createUser, deleteUser, getAllUsers, getCandidates, getInternalStaff, getUserByUUID, updateUser, verifyPassword } from "../controllers/userController.js";
import { authorize, protect, selfOrRoles } from "../utils/authMiddleware.js";

const router = express.Router();

// Sebelumnya SELURUH file ini tanpa autentikasi: siapa pun bisa mendaftar semua
// akun, mengganti role/password akun mana pun lewat PUT /:uuid, lalu login
// sebagai akun itu.
router.use(protect);

// Pengelolaan akun oleh admin.
router.post("/", authorize("ADMIN"), createUser);
router.get("/all", authorize("ADMIN"), getAllUsers);
router.get("/internal-staff", authorize("ADMIN"), getInternalStaff);
router.get("/candidates", authorize("ADMIN"), getCandidates);
router.delete("/:uuid", authorize("ADMIN"), deleteUser);

// Dipakai admin untuk mengelola orang lain DAN oleh setiap user untuk dirinya
// sendiri lewat ProfileUser.jsx — jadi tidak boleh admin-only.
router.get("/:uuid", selfOrRoles("ADMIN"), getUserByUUID);
router.put("/:uuid", selfOrRoles("ADMIN"), updateUser);
router.post("/verify-password/:uuid", selfOrRoles("ADMIN"), verifyPassword);

export default router;
