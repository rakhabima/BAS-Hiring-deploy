// Menangani seluruh /api/* lewat routing berbasis filesystem Vercel.
//
// Vercel memeriksa filesystem SEBELUM menerapkan rewrites, jadi permintaan ke
// /api/auth/login langsung sampai ke sini dengan req.url yang masih utuh —
// tidak bergantung pada bagaimana sebuah rewrite memperlakukan path aslinya.
// Express lalu mencocokkan route seperti biasa.
export { default } from '../monolithic.js';
