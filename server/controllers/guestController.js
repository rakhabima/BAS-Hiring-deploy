import { v4 as uuidv4 } from "uuid";
import prisma from "../db/prisma.js";

const GUEST_TTL_MS = 24 * 60 * 60 * 1000;

export const createGuestSession = async (req, res) => {
    try {
        // ponytail: menggantikan TTL index Mongo (expires: 86400) yang tidak ada
        // padanannya di Postgres. Disapu saat guest baru dibuat — cukup untuk
        // volume saat ini; pindah ke pg_cron kalau tabelnya mulai besar.
        await prisma.guest.deleteMany({
            where: { createdAt: { lt: new Date(Date.now() - GUEST_TTL_MS) } }
        });

        const sessionId = uuidv4();
        const newGuest = await prisma.guest.create({ data: { sessionId } });

        res.cookie("guestSession", sessionId, {
            maxAge: GUEST_TTL_MS,
            httpOnly: true,
            sameSite: "strict"
        });

        res.status(201).json({
            message: "Guest session created successfully",
            uuid: newGuest.uuid
        });
    } catch (error) {
        console.log("Error in createGuestSession controller", error.message);
        res.status(500).json({ error: `Internal Server Error ${error.message}` });
    }
};

export const getGuestSession = async (req, res) => {
    try {
        const { guestSession } = req.cookies;

        if (!guestSession) {
            return res.status(404).json({ error: "Guest session not found" });
        }

        const guest = await prisma.guest.findUnique({ where: { sessionId: guestSession } });

        // Baris kedaluwarsa tidak lagi hilang sendiri, jadi umurnya dicek di sini.
        if (!guest || guest.createdAt < new Date(Date.now() - GUEST_TTL_MS)) {
            return res.status(404).json({ error: "Guest session expired or invalid" });
        }

        res.status(200).json({
            uuid: guest.uuid,
            role: "GUEST"
        });
    } catch (error) {
        console.log("Error in getGuestSession controller", error.message);
        res.status(500).json({ error: `Internal Server Error ${error.message}` });
    }
};
