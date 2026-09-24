import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Driver Neon berbicara lewat WebSocket; di Node konstruktornya harus disuplai.
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL tidak ditemukan. Pakai connection string Neon yang -pooler.");
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

// ponytail: satu instance per proses, disimpan di globalThis supaya nodemon
// (dev) dan reuse container Vercel tidak menumpuk connection pool.
const prisma = globalThis.__prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

export default prisma;
