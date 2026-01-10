import { Context, Next } from 'hono'

/**
 * Simple token-based authentication middleware for admin routes.
 * Checks for Bearer token in Authorization header against ADMIN_TOKEN env var.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminToken) {
    console.error('[Auth] ADMIN_TOKEN not configured in environment')
    return c.json({ error: 'Server configuration error' }, 500)
  }

  if (token !== adminToken) {
    console.warn('[Auth] Invalid admin token attempt')
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401)
  }

  await next()
}

