// Cek migrasi Mongoose -> Prisma. Jalankan: node server/db/prisma.check.js
// Tanpa DATABASE_URL asli hanya assert statis; kalau DATABASE_URL menunjuk ke
// Neon sungguhan, sekalian roundtrip satu baris Guest.
// Prisma CLI memuat .env sendiri, `node` tidak — tanpa ini DATABASE_URL kosong
// dan roundtrip ke Neon dilewati diam-diam.
import "dotenv/config";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { $Enums } from "@prisma/client";

const PLACEHOLDER = "postgresql://u:p@localhost:5432/db";
process.env.DATABASE_URL ||= PLACEHOLDER;
const hasDb = process.env.DATABASE_URL !== PLACEHOLDER;
const { default: prisma } = await import("./prisma.js");

// Nama delegate harus cocok dengan model di schema.prisma — salah ketik di sini
// tidak error saat import, hanya meledak saat request pertama.
for (const model of ["guest", "notification", "user", "jobApplication", "applicationStatusHistory", "interview", "technicalTest", "jobPosting", "outsourcingService", "outsourcingRequest", "logEntry"]) {
    assert.equal(typeof prisma[model]?.findMany, "function", `delegate prisma.${model} tidak ada`);
}

// Nilai enum di sisi client harus identik dengan string yang dulu dipakai
// Mongoose — React mengirim dan menampilkan string ini apa adanya. Prisma
// mengembalikan NAMA member (bukan nilai @map), jadi assert ini yang menahan
// @map diselundupkan masuk dan diam-diam mengubah payload API.
assert.equal($Enums.Religion.Islam, "Islam");
assert.equal($Enums.Attendance.hadir, "hadir");
assert.equal($Enums.Attendance.tidak_hadir, "tidak_hadir");
assert.deepEqual(Object.values($Enums.ApplicationStatus), ["PENDING", "REVIEWING", "INTERVIEW_SCHEDULED", "TECHNICAL_TEST", "REJECTED", "ACCEPTED", "ON_JOB", "REVISION"]);
assert.deepEqual(Object.values($Enums.Role), ["ADMIN", "RECRUITER", "GENERAL_MANAGER", "CANDIDATE", "KOORDINATOR_LAPANGAN", "KARYAWAN", "GUEST"]);

// Untuk setiap enum, nama member == nilainya. Kalau tidak, payload berubah.
for (const [name, members] of Object.entries($Enums)) {
    for (const [key, value] of Object.entries(members)) {
        assert.equal(key, value, `enum ${name}.${key} mengembalikan "${value}" ke client, bukan "${key}" — jangan pakai @map`);
    }
}

// jenis_kelamin / pendidikan_terakhir / tipe_sim sengaja String, bukan enum,
// karena nilainya ("Laki - Laki", "SMA/SMK", "Tidak Punya") tidak bisa jadi
// nama member. Validasinya pindah ke CHECK constraint di migration 0_init.
const ddl = readFileSync(new URL("../../prisma/migrations/0_init/migration.sql", import.meta.url), "utf8");
for (const value of ["Laki - Laki", "SMA/SMK", "D4/S1", "Tidak Punya", "SIM B2"]) {
    assert.ok(ddl.includes(`'${value}'`), `nilai "${value}" hilang dari CHECK constraint`);
}
const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8")
    .replace(/\/\/.*$/gm, ""); // buang komentar, yang memang membahas @map
assert.ok(!schema.includes("@map"), "@map muncul di schema — cek ulang dampaknya ke payload API");

// Controller & service yang sudah dimigrasi harus bisa di-import bersih.
await import("../controllers/guestController.js");
await import("../controllers/notificationController.js");
await import("../utils/notificationService.js");

if (hasDb) {
    const guest = await prisma.guest.create({ data: { sessionId: `check-${Date.now()}` } });
    assert.ok(guest.uuid, "uuid tidak terisi otomatis");
    const found = await prisma.guest.findUnique({ where: { sessionId: guest.sessionId } });
    assert.equal(found.uuid, guest.uuid);
    await prisma.guest.delete({ where: { uuid: guest.uuid } });
    console.log("roundtrip Neon OK");
}

// --- Alur auth terhadap database sungguhan ---
if (hasDb) {
    process.env.JWT_SECRET ||= "secret-khusus-check";
    const { signup, login } = await import("../controllers/authController.js");
    const { protect } = await import("../utils/authMiddleware.js");

    // res palsu secukupnya: cuma merekam status, body, dan cookie.
    const fakeRes = () => {
        const r = { cookies: {} };
        r.status = (code) => { r.code = code; return r; };
        r.json = (body) => { r.body = body; return r; };
        r.cookie = (name, value) => { r.cookies[name] = value; return r; };
        return r;
    };
    const req = (body) => ({ body, ip: "127.0.0.1", headers: {}, cookies: {} });

    const email = `check-${Date.now()}@example.com`;
    const password = "rahasia123";
    let created;
    try {
        const signupRes = fakeRes();
        await signup(req({ name: "Uji", email, password, isPublicRegistration: true }), signupRes);
        assert.equal(signupRes.code, 201, `signup gagal: ${JSON.stringify(signupRes.body)}`);
        assert.equal(signupRes.body.role, "CANDIDATE", "pendaftaran publik harus selalu CANDIDATE");
        created = signupRes.body.uuid;

        const stored = await prisma.user.findUnique({ where: { uuid: created } });
        assert.notEqual(stored.password, password, "password tersimpan dalam bentuk plaintext");
        assert.equal(stored.lastLogin, null);

        // Password salah harus ditolak.
        const badRes = fakeRes();
        await login(req({ email, password: "salah" }), badRes);
        assert.equal(badRes.code, 400);

        // Password benar harus lolos dan mengisi lastLogin.
        const okRes = fakeRes();
        await login(req({ email, password }), okRes);
        assert.equal(okRes.code, 200, `login gagal: ${JSON.stringify(okRes.body)}`);
        assert.equal(okRes.body.user.uuid, created);
        assert.ok(okRes.body.user.lastLogin, "lastLogin tidak terisi setelah login");
        assert.ok(okRes.cookies.jwt, "cookie jwt tidak diset");

        // Regresi: `protect` versi lama tidak mengecek isDeleted, sehingga user
        // yang sudah dihapus tetap bisa mengakses route terproteksi.
        await prisma.user.update({ where: { uuid: created }, data: { isDeleted: true } });
        const deletedRes = fakeRes();
        let lolos = false;
        await protect({ cookies: { jwt: okRes.cookies.jwt } }, deletedRes, () => { lolos = true; });
        assert.equal(lolos, false, "user isDeleted masih lolos protect");
        assert.equal(deletedRes.code, 403);

        // Login pun harus ditolak untuk user yang dihapus.
        const deletedLogin = fakeRes();
        await login(req({ email, password }), deletedLogin);
        assert.equal(deletedLogin.code, 403);
    } finally {
        if (created) {
            await prisma.logEntry.deleteMany({ where: { userId: created } });
            await prisma.user.delete({ where: { uuid: created } });
        }
    }
    console.log("alur auth OK");
}

await prisma.$disconnect();
// Dikatakan terang-terangan supaya "OK" tanpa database tidak disalahartikan
// sebagai bukti koneksi berhasil.
console.log(hasDb ? "prisma.check OK (termasuk roundtrip database)" : "prisma.check OK (assert statis saja — DATABASE_URL tidak diset, database TIDAK diuji)");
