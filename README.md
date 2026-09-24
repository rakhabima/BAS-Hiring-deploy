# BAS-Hiring

Sistem rekrutmen dan layanan outsourcing untuk BAS (Barokah Amanah Sentosa).
Mengelola lowongan, lamaran kandidat, penjadwalan wawancara, technical test,
penempatan karyawan, dan permintaan layanan outsourcing dari klien.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19 (Create React App), MUI 6, React Router 7, Axios, Chart.js |
| Backend | Node ≥18, Express 4, ESM |
| Database | PostgreSQL (Neon) via Prisma 6 + `@prisma/adapter-neon` |
| Auth | JWT di httpOnly cookie, bcryptjs |
| Penyimpanan berkas | Cloudinary (diunggah langsung dari browser) |
| Deploy | Vercel (frontend statis + serverless function) |

Satu app Express (`monolithic.js`) melayani API sekaligus build React. File yang
sama dipakai untuk dev lokal dan sebagai serverless function di Vercel.

## Setup

### 1. Clone dan pasang dependensi

```sh
git clone https://github.com/fikriwahab/BAS-Hiring.git
cd BAS-Hiring

npm install                                   # backend (di root)
cd client && npm install --legacy-peer-deps   # frontend
cd ..
```

### 2. Buat file `.env` di root

```sh
# Neon: WAJIB memakai connection string yang mengandung "-pooler".
# Tanpa pooler, koneksi akan habis begitu jalan di serverless.
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

JWT_SECRET="<string acak panjang>"

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Akun admin yang dibuat otomatis setiap build (opsional).
# Tanpa keduanya, seeding dilewati dan build tetap sukses.
ADMIN_EMAIL="admin@gmail.com"
ADMIN_PASSWORD="admin123"
```

Akun admin pertama tidak bisa dibuat lewat UI — `POST /api/user` hanya untuk
ADMIN, sedangkan registrasi publik selalu menghasilkan `CANDIDATE`. Karena itu
`npm run build` menjalankan `server/db/ensure-admin.js`, yang membuat akun
`ADMIN` dari kedua variabel di atas. Sifatnya idempoten: kalau akunnya sudah
ada, tidak diapa-apakan — password yang Anda ganti sendiri tidak akan direset
oleh build berikutnya. Untuk membuatnya tanpa build penuh:

```sh
npm run ensure:admin
```

`client/.env` tidak diperlukan. Base URL API selalu `/api`: di produksi karena
frontend dan API satu origin, dan saat dev karena `client/package.json`
menyetel `proxy` ke `http://localhost:5555` sehingga dev server CRA
meneruskannya ke backend.

### 3. Siapkan skema database

```sh
npx prisma migrate deploy    # membuat 11 tabel, 13 enum, 3 CHECK constraint
```

### 4. Jalankan

```sh
npm run dev              # terminal 1 — backend di http://localhost:5555
cd client && npm start   # terminal 2 — frontend di http://localhost:3000
```

Buka `http://localhost:3000`. **Backend harus jalan lebih dulu**, kalau tidak
semua request `/api/*` akan 404 karena tidak ada yang menerima proxy-nya.

Untuk menjalankan seperti di produksi (satu proses melayani API + build React):

```sh
cd client && CI=false npm run build && cd ..
npm start
```

## Verifikasi

Keduanya berjalan terhadap database sungguhan yang ditunjuk `DATABASE_URL`, dan
membersihkan datanya sendiri setelah selesai.

```sh
npm run check            # skema, enum, alur auth, roundtrip database
npm run check:security   # otorisasi: 29 pemeriksaan, mayoritas kasus negatif
npm run check:all        # keduanya
```

`check:security` menyalakan servernya sendiri di port acak, jadi tidak perlu ada
server yang sudah berjalan.

## Struktur

```
monolithic.js          entrypoint Express (API + serve build React)
api/                   handler serverless Vercel (membungkus app yang sama)
prisma/
  schema.prisma        11 model
  migrations/          SQL awal + CHECK constraint
server/
  routes/              10 domain
  controllers/
  services/
  db/                  Prisma client + skrip verifikasi
  utils/               auth, cloudinary, notifikasi, logging
client/src/
  pages/{public,admin,recruiter,gm,korlap}
  services/api.js      seluruh pemanggilan API + helper unggah Cloudinary
```

## Peran

`ADMIN`, `RECRUITER`, `GENERAL_MANAGER`, `KOORDINATOR_LAPANGAN`, `CANDIDATE`,
`KARYAWAN`, `GUEST`.

Endpoint dijaga di dua lapis: `protect` (harus login) dan `authorize(...roles)`
atau `ownsApplication` (hanya boleh menyentuh data miliknya sendiri). Endpoint
yang sengaja publik: katalog lowongan, katalog layanan, dan form permintaan
outsourcing dari calon klien.

## Unggah berkas

Berkas tidak melewati API. Browser meminta tanda tangan ke
`POST /api/upload/signature`, mengunggah langsung ke Cloudinary, lalu mengirim
URL hasilnya sebagai JSON biasa. Ini yang membuat form lamaran dengan enam
berkas tetap lolos dari batas body 4.5 MB milik serverless function Vercel.

## Deploy ke Vercel

Set environment variable pada dashboard Vercel — `DATABASE_URL` (wajib yang
ber-`-pooler`), `JWT_SECRET`, ketiga `CLOUDINARY_*`, dan bila ingin akun admin
dibuat otomatis, `ADMIN_EMAIL` serta `ADMIN_PASSWORD`. Untuk produksi, pakai
password yang tidak mudah ditebak: siapa pun bisa mencoba login ke deployment
Anda. Lalu deploy. `vercel.json` sudah
mengatur build dan fallback SPA; migration dijalankan sekali dari lokal dengan
`npx prisma migrate deploy`.
