// ES modules
import serverless from 'serverless-http';
import app from './server.js';

// Export for Vercel
const handler = serverless(app);
export default handler;