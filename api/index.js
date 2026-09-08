// Entrypoint serverless Vercel.
//
// Runtime Node Vercel memanggil default export sebagai (req, res) — persis
// bentuk sebuah app Express. Jangan bungkus dengan serverless-http: itu
// menghasilkan handler (event, context) untuk AWS Lambda, dan Vercel tidak akan
// pernah memanggilnya dengan bentuk itu.
export { default } from '../monolithic.js';
