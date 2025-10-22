import type { OrdersResponse, OrderActionResponse } from '@/types/api'

const API_BASE_URL = '/api'

/**
 * Get the admin token from session storage
 */
function getAdminToken(): string | null {
  return sessionStorage.getItem('admin_token')
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
  const token = getAdminToken()
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_BASE_URL}/admin/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminToken()
      throw new Error('Authentication failed')
    }
    throw new Error(`Failed to fetch orders: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Approve an order
 */
export async function approveOrder(orderId: string): Promise<OrderActionResponse> {
  const token = getAdminToken()
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminToken()
      throw new Error('Authentication failed')
    }
    const data = await response.json()
    throw new Error(data.error || `Failed to approve order: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Reject an order with a reason
 */
export async function rejectOrder(orderId: string, reason: string): Promise<OrderActionResponse> {
  const token = getAdminToken()
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminToken()
      throw new Error('Authentication failed')
    }
    const data = await response.json()
    throw new Error(data.error || `Failed to reject order: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get Familink order details
 */
export async function getFamilinkOrder(familinkId: string): Promise<unknown> {
  const token = getAdminToken()
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_BASE_URL}/admin/familink/${familinkId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminToken()
      throw new Error('Authentication failed')
    }
    const data = await response.json()
    throw new Error(data.error || `Failed to fetch Familink order: ${response.statusText}`)
  }

  return response.json()
}
