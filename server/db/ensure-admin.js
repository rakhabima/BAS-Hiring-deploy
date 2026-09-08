// Memastikan ada satu akun admin. Dijalankan otomatis setiap build.
//
// Kredensialnya HANYA dari ADMIN_EMAIL dan ADMIN_PASSWORD — tidak ada nilai
// default di kode, supaya kredensial tidak pernah ikut ter-commit dan tiap
// lingkungan (lokal, preview, produksi) bisa punya kredensial sendiri.
// Kalau salah satunya belum diset, seeding dilewati tanpa menggagalkan build.
//
// Sifatnya idempoten: kalau akunnya sudah ada, TIDAK diapa-apakan — password
// yang sudah Anda ganti sendiri tidak akan direset oleh build berikutnya.
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "./prisma.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
    console.log("[ensure-admin] ADMIN_EMAIL / ADMIN_PASSWORD belum diset — seeding dilewati.");
    process.exit(0);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn(`[ensure-admin] ADMIN_EMAIL tidak valid (${email}) — seeding dilewati.`);
    process.exit(0);
}

if (password.length < 6) {
    console.warn("[ensure-admin] ADMIN_PASSWORD kurang dari 6 karakter — seeding dilewati.");
    process.exit(0);
}

try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        console.log(`[ensure-admin] ${email} sudah ada (role: ${existing.role}) — dilewati.`);
    } else {
        const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
        await prisma.user.create({
            data: { name: "Administrator", email, password: hashed, role: "ADMIN" }
        });
        console.log(`[ensure-admin] Akun ADMIN dibuat: ${email}`);

        if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
            console.warn(`[ensure-admin] PERINGATAN: akun admin kini aktif di produksi. Pastikan ADMIN_PASSWORD bukan kata sandi yang mudah ditebak.`);
        }
    }
} catch (error) {
    // Build tidak boleh gagal hanya karena seeding. Kalau database belum siap,
    // build berikutnya akan mencoba lagi.
    console.warn(`[ensure-admin] Dilewati: ${error.message}`);
} finally {
    await prisma.$disconnect();
}
