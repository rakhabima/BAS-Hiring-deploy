// Satu-satunya function: vercel.json me-rewrite /api/(.*) ke sini, dan req.url
// tetap path aslinya sehingga Express mencocokkan route seperti biasa.
// Jangan pakai api/[...path].js — catch-all itu hanya milik Next.js; di proyek
// non-Next ia cuma cocok untuk SATU segmen, jadi /api/auth/login jadi 404.
//
// Runtime Node Vercel memanggil default export sebagai (req, res) — persis
// bentuk sebuah app Express. Jangan bungkus dengan serverless-http: itu
// menghasilkan handler (event, context) untuk AWS Lambda.
export { default } from '../monolithic.js';
