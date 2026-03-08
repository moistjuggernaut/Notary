import type { OrderActionResponse, OrdersResponse } from '@/types/api'

const API_BASE_URL = '/api'

/**
 * Get the admin token from session storage
 */
function getAdminToken(): string | null {
  return sessionStorage.getItem('admin_token')
}

function requireAdminToken(): string {
  const token = getAdminToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  return token
}

function handleAuthenticationFailure(): never {
  clearAdminToken()
  throw new Error('Authentication failed')
}

function throwStatusError(response: Response, fallbackMessage: string): never {
  throw new Error(`${fallbackMessage}: ${response.statusText}`)
}

async function throwJsonError(response: Response, fallbackMessage: string): Promise<never> {
  const data = (await response.json()) as { error?: string }
  throw new Error(data.error || `${fallbackMessage}: ${response.statusText}`)
}

async function fetchAdminApi(path: string, init: RequestInit = {}): Promise<Response> {
  const token = requireAdminToken()
  const headers = new Headers(init.headers)

  headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
}

async function ensureAdminResponse(
  response: Response,
  fallbackMessage: string,
  readJsonErrorBody: boolean
): Promise<Response> {
  if (response.ok) {
    return response
  }

  if (response.status === 401) {
    handleAuthenticationFailure()
  }

  if (readJsonErrorBody) {
    await throwJsonError(response, fallbackMessage)
  }

  throwStatusError(response, fallbackMessage)
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

/**
 * Set the admin token in session storage
 */
export function setAdminToken(token: string): void {
  sessionStorage.setItem('admin_token', token)
}

/**
 * Clear the admin token from session storage
 */
export function clearAdminToken(): void {
  sessionStorage.removeItem('admin_token')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAdminToken()
}

/**
 * Fetch orders by status
 */
export async function fetchOrders(): Promise<OrdersResponse> {
  const response = await fetchAdminApi('/admin/orders')
  const validResponse = await ensureAdminResponse(response, 'Failed to fetch orders', false)

  return readJson<OrdersResponse>(validResponse)
}

/**
 * Approve an order
 */
export async function approveOrder(orderId: string): Promise<OrderActionResponse> {
  const response = await fetchAdminApi(`/admin/orders/${orderId}/approve`, {
    method: 'POST',
  })
  const validResponse = await ensureAdminResponse(response, 'Failed to approve order', true)

  return readJson<OrderActionResponse>(validResponse)
}

/**
 * Reject an order with a reason
 */
export async function rejectOrder(orderId: string, reason: string): Promise<OrderActionResponse> {
  const response = await fetchAdminApi(`/admin/orders/${orderId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  })
  const validResponse = await ensureAdminResponse(response, 'Failed to reject order', true)

  return readJson<OrderActionResponse>(validResponse)
}

/**
 * Get Familink order details
 */
export async function getFamilinkOrder(familinkId: string): Promise<unknown> {
  const response = await fetchAdminApi(`/admin/familink/${familinkId}`)
  const validResponse = await ensureAdminResponse(response, 'Failed to fetch Familink order', true)

  return readJson<unknown>(validResponse)
}
