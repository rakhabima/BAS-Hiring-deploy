// Cek otorisasi terhadap server + database sungguhan.
// Jalankan: npm run check:security
//
// Isinya sengaja hampir semuanya kasus NEGATIF — yang diuji adalah hal-hal yang
// seharusnya DITOLAK. Sebelum perubahan ini, routes user/notification/
// outsourcing/jobVacancy sama sekali tanpa autentikasi, dan interview/
// technicalTest tidak pernah mengecek kepemilikan.
import "dotenv/config";
import assert from "node:assert/strict";

process.env.JWT_SECRET ||= "secret-khusus-check";
const { default: prisma } = await import("./prisma.js");
const { default: app } = await import("../../monolithic.js");

const server = app.listen(0);
const BASE = `http://localhost:${server.address().port}`;

const req = async (path, opts = {}) => {
    const r = await fetch(BASE + path, {
        ...opts,
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) }
    });
    let body = null;
    try { body = await r.json(); } catch { /* respons tanpa body */ }
    return { status: r.status, body, cookie: r.headers.get("set-cookie") };
};

const PASSWORD = "rahasia123";
const makeUser = async (role) => {
    const email = `check-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
    const created = await req("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: role, email, password: PASSWORD, role })
    });
    assert.equal(created.status, 201, `signup ${role} gagal: ${JSON.stringify(created.body)}`);

    const session = await req("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: PASSWORD })
    });
    assert.equal(session.status, 200, `login ${role} gagal: ${JSON.stringify(session.body)}`);

    return { uuid: created.body.uuid, cookie: session.cookie.split(";")[0] };
};

const as = (user) => ({ headers: { Cookie: user.cookie } });

let failures = 0;
const expect = (name, actual, wanted) => {
    if (actual === wanted) return;
    failures++;
    console.error(`  GAGAL ${name}: dapat ${actual}, harusnya ${wanted}`);
};

const cleanup = async () => {
    await prisma.technicalTest.deleteMany({});
    await prisma.interview.deleteMany({});
    await prisma.applicationStatusHistory.deleteMany({});
    await prisma.jobApplication.deleteMany({});
    await prisma.jobPosting.deleteMany({});
    await prisma.outsourcingRequest.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.logEntry.deleteMany({});
    await prisma.user.deleteMany({});
};

try {
    const admin = await makeUser("ADMIN");
    const candidateA = await makeUser("CANDIDATE");
    const candidateB = await makeUser("CANDIDATE");
    const recruiter = await makeUser("RECRUITER");

    // --- routes/user.js: dulu seluruh file terbuka anonim ---
    expect("PUT /user/:uuid anonim",
        (await req(`/api/user/${admin.uuid}`, { method: "PUT", body: JSON.stringify({ role: "ADMIN" }) })).status, 401);
    expect("GET /user/all anonim", (await req("/api/user/all")).status, 401);
    expect("DELETE /user/:uuid anonim",
        (await req(`/api/user/${candidateB.uuid}`, { method: "DELETE" })).status, 401);
    expect("GET /user/all sebagai kandidat", (await req("/api/user/all", as(candidateA))).status, 403);
    expect("GET /user/all sebagai admin", (await req("/api/user/all", as(admin))).status, 200);
    expect("kandidat baca profil orang lain", (await req(`/api/user/${candidateB.uuid}`, as(candidateA))).status, 403);
    expect("kandidat baca profil sendiri", (await req(`/api/user/${candidateA.uuid}`, as(candidateA))).status, 200);

    // Eskalasi privilese: edit diri sendiri boleh, tapi role/status diabaikan.
    await req(`/api/user/${candidateA.uuid}`, {
        method: "PUT", ...as(candidateA),
        body: JSON.stringify({ name: "Nama Baru", role: "ADMIN", status: false })
    });
    const edited = await prisma.user.findUnique({ where: { uuid: candidateA.uuid } });
    expect("nama sendiri tersimpan", edited.name, "Nama Baru");
    expect("role sendiri TIDAK bisa dinaikkan", edited.role, "CANDIDATE");
    expect("status sendiri TIDAK bisa diubah", edited.status, true);

    // --- routes/notification.js: dulu terbuka, userId dari query ---
    await prisma.notification.create({ data: { userId: candidateB.uuid, message: "rahasia", type: "SYSTEM" } });
    const notifB = await prisma.notification.findFirst({ where: { userId: candidateB.uuid } });

    expect("GET /notifications anonim", (await req("/api/notifications")).status, 401);
    const spoofed = await req(`/api/notifications?userId=${candidateB.uuid}`, as(candidateA));
    expect("?userId= milik orang lain tidak membocorkan apa pun", spoofed.body.notifications.length, 0);
    expect("tandai notifikasi orang lain", (await req(`/api/notifications/${notifB.uuid}/read`, { method: "PATCH", ...as(candidateA) })).status, 404);
    expect("notifikasi orang lain tetap belum dibaca",
        (await prisma.notification.findUnique({ where: { uuid: notifB.uuid } })).readStatus, false);

    // --- jobVacancy & outsourcing: mutasi digate, baca publik tetap terbuka ---
    const draftJob = JSON.stringify({ title: "x", description: "d", location: "l", jobType: "FULL_TIME", jobPosition: "p", deadline: "2026-12-31" });
    expect("buat lowongan anonim", (await req("/api/jobVacancy/create", { method: "POST", body: draftJob })).status, 401);
    expect("buat lowongan sebagai kandidat", (await req("/api/jobVacancy/create", { method: "POST", ...as(candidateA), body: draftJob })).status, 403);
    expect("GET /jobVacancy/all tetap publik", (await req("/api/jobVacancy/all")).status, 200);
    expect("GET /outsource/all tetap publik", (await req("/api/outsource/all")).status, 200);
    expect("POST /outsource/request tetap publik (form tamu)",
        (await req("/api/outsource/request", { method: "POST", body: JSON.stringify({ vendorName: "PT X", contactInfo: "08", email: "v@x.com", location: "Depok", serviceType: "Cleaning", message: "halo" }) })).status, 201);
    expect("daftar permintaan outsourcing sebagai kandidat", (await req("/api/outsource/requests", as(candidateA))).status, 403);

    // --- kepemilikan interview & technical test ---
    const job = await prisma.jobPosting.create({ data: { title: "K", description: "d", location: "Depok", jobType: "FULL_TIME", jobPosition: "Kurir", deadline: new Date("2026-12-31"), createdBy: recruiter.uuid } });
    const applicationB = await prisma.jobApplication.create({ data: {
        candidateId: candidateB.uuid, jobPostingId: job.uuid, nama_ktp: "B", jenis_kelamin: "Perempuan",
        nik: "1", tanggal_lahir: new Date("1995-01-01"), agama: "Islam", pendidikan_terakhir: "SMA/SMK",
        email: "b@example.com", no_hp: "08", no_hp_darurat: "08", pemilik_no_hp_darurat: "X",
        hubungan_dgn_pemilik_no_hp_darurat: "Kakak", kota: "Depok", kecamatan: "B", kelurahan: "K",
        alamat: "Jl", no_rekening: "1", nama_pemilik_rekening: "B", nama_bank: "BCA",
        posisi_dilamar: "Kurir", foto_diri: "u", foto_ktp: "u", foto_ijazah: "u"
    } });
    const interviewB = await prisma.interview.create({ data: { applicationId: applicationB.uuid, interviewDate: new Date(Date.now() + 86400000), location: "Zoom" } });
    const testB = await prisma.technicalTest.create({ data: { applicationId: applicationB.uuid, recruiterId: recruiter.uuid, candidateId: candidateB.uuid, description: "t", dateScheduled: new Date() } });

    expect("kandidat baca interview orang lain", (await req(`/api/interviews/${interviewB.id}`, as(candidateA))).status, 403);
    expect("kandidat baca interviewnya sendiri", (await req(`/api/interviews/${interviewB.id}`, as(candidateB))).status, 200);
    expect("kandidat jawab interview orang lain",
        (await req(`/api/interviews/${interviewB.id}/response`, { method: "PUT", ...as(candidateA), body: JSON.stringify({ candidateResponse: true }) })).status, 403);
    expect("kandidat baca interview lewat applicationId orang lain",
        (await req(`/api/interviews/application/${applicationB.uuid}`, as(candidateA))).status, 403);
    expect("kandidat baca technical test orang lain (uuid)", (await req(`/api/technicalTest/${testB.uuid}`, as(candidateA))).status, 403);
    expect("kandidat baca technical test orang lain (applicationId)", (await req(`/api/technicalTest/application/${applicationB.uuid}`, as(candidateA))).status, 403);
    expect("kandidat tandai selesai test orang lain", (await req(`/api/technicalTest/${applicationB.uuid}/complete`, { method: "POST", ...as(candidateA) })).status, 403);
    expect("staff tetap bisa baca technical test", (await req(`/api/technicalTest/${testB.uuid}`, as(recruiter))).status, 200);
} finally {
    await cleanup();
    await prisma.$disconnect();
    server.close();
}

if (failures) {
    console.error(`\nsecurity.check GAGAL: ${failures} pemeriksaan tidak sesuai`);
    process.exit(1);
}
console.log("security.check OK");
