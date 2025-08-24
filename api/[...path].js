/**
 * Vercel Serverless Function: Generic GCP Proxy
 * 
 * This single, dynamic function acts as a proxy for all requests to `/api/*`.
 * It forwards the request path and body to the configured GCP Cloud Run backend.
 */
export default async function handler(req, res) {
  // Basic CORS headers for proxied requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const gcpBase = process.env.GCP_API_URL;
    if (!gcpBase) {
      console.error('GCP_API_URL env var is not set');
      return res.status(500).json({ error: 'Proxy not configured: GCP_API_URL missing' });
    }

    // Safely extract path segments from catch-all route
    const q = req.query || {};
    const segments = Array.isArray(q.path)
      ? q.path
      : (typeof q.path === 'string' && q.path.length > 0 ? [q.path] : []);

    // Build backend path; special-case health (backend route is /health)
    const joined = segments.join('/'); // '' | 'quick_check' | 'stripe/webhook' ...
    const backendPath = joined === 'health' ? '/health' : `/api/${joined}`;

    const targetUrl = `${gcpBase}${backendPath}`;

    // Minimal visibility in logs
    console.log(`[proxy] ${req.method} ${joined || '(root)'} -> ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      body: req.method === 'GET' ? undefined : req.body,
    });

    const contentType = response.headers.get('content-type') || '';
    const status = response.status;

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(status).json(data);
    }

    const text = await response.text();
    return res.status(status).send(text);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(502).json({
      error: 'Bad Gateway: The proxy server could not reach the backend service.',
      details: error?.message || String(error)
    });
  }
} 