// Entrypoint serverless Vercel: membungkus app Express yang sama yang dipakai
// dev lokal dan Railway, jadi tidak ada dua definisi route yang harus disamakan.
import serverless from 'serverless-http';
import app from '../monolithic.js';

export default serverless(app);
