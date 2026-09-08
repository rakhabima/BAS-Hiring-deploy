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
```

`client/.env` tidak diperlukan. Frontend dan API dilayani dari origin yang sama,
sehingga base URL API otomatis memakai `/api`. Isi `REACT_APP_API_URL` hanya
kalau menjalankan CRA di port 3000 terpisah dari backend.

### 3. Siapkan skema database

```sh
npx prisma migrate deploy    # membuat 11 tabel, 13 enum, 3 CHECK constraint
```

### 4. Jalankan

```sh
npm run dev          # backend di http://localhost:5555 (nodemon)
cd client && npm start   # frontend di http://localhost:3000
```

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

Set kelima environment variable di atas pada dashboard Vercel (`DATABASE_URL`
memakai connection string ber-`-pooler`), lalu deploy. `vercel.json` sudah
mengatur build dan fallback SPA; migration dijalankan sekali dari lokal dengan
`npx prisma migrate deploy`.
