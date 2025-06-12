/**
 * Vercel Serverless Function: Generic GCP Proxy
 * 
 * This single, dynamic function acts as a proxy for all requests to `/api/*`.
 * It forwards the request path and body to the configured GCP Cloud Run backend.
 *
 * How it works:
 * - The file name `[...path].js` is a Vercel convention for a dynamic route
 *   that catches all sub-paths.
 * - `req.query.path` will be an array of the path segments (e.g., ['api', 'validate_photo']).
 * - We join these segments to reconstruct the original path for the GCP backend.
 */
export default async function handler(req, res) {
  // Set common CORS and method headers for all proxied requests.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { path } = req.query;
    const gcpPath = path.join('/'); // Reconstruct path: e.g., ['api', 'quick_check'] -> 'api/quick_check'

    // Get the GCP backend URL from environment variables.
    const GCP_API_URL = process.env.GCP_API_URL;
    if (!GCP_API_URL) {
      console.error('FATAL: GCP_API_URL environment variable is not set.');
      return res.status(500).json({ error: 'Proxy configuration error: Backend URL not found.' });
    }

    // Construct the full target URL.
    const targetUrl = `${GCP_API_URL}/${gcpPath}`;
    
    // Forward the request to the GCP backend.
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization header if present.
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      // Only include body for relevant methods.
      body: (req.method === 'POST' || req.method === 'PUT') ? JSON.stringify(req.body) : null,
    });

    // Extract the JSON response from the backend.
    const data = await response.json();
    
    // Send the backend's response and status code back to the original client.
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(502).json({ 
      error: 'Bad Gateway: The proxy server could not reach the backend service.',
      details: error.message 
    });
  }
} 