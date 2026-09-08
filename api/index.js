// Menangani /api tanpa segmen tambahan; /api/* ditangani [...path].js.
//
// Runtime Node Vercel memanggil default export sebagai (req, res) — persis
// bentuk sebuah app Express. Jangan bungkus dengan serverless-http: itu
// menghasilkan handler (event, context) untuk AWS Lambda.
export { default } from '../monolithic.js';
