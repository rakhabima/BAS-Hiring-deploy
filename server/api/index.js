// Vercel Edge API Handler
export default function handler(request, response) {
  // Set CORS headers to allow all origins
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // Respond with a JSON success message
  return response.status(200).json({
    status: 'ok',
    message: 'BAS Hiring API is running',
    path: request.url,
    time: new Date().toISOString()
  });
} 