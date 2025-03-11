import express from "express";
import { createGuestSession, getGuestSession } from "../controllers/guestController.js";

const router = express.Router();

router.post("/create-session", createGuestSession);
router.get("/session", getGuestSession);

export default router; 