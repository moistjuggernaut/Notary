import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  fetchOrders, 
  approveOrder, 
  rejectOrder, 
  setAdminToken, 
  isAuthenticated,
  clearAdminToken 
} from '@/api/admin-client'
import type { Order } from '@/types/api'
import { REJECTION_REASONS } from '@/types/api'

export default function Admin() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [isAuth, setIsAuth] = useState(isAuthenticated())
  const [password, setPassword] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    if (isAuth) {
      loadOrders()
    }
  }, [isAuth])

  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const response = await fetchOrders('paid')
      if (response.success) {
        setOrders(response.orders)
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch orders',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
      if (error instanceof Error && error.message === 'Authentication failed') {
        setIsAuth(false)
        toast({
          title: 'Session Expired',
          description: 'Please log in again',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load orders',
          variant: 'destructive',
        })
      }
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminToken(password)
    setIsAuth(true)
    setPassword('')
  }

  const handleLogout = () => {
    clearAdminToken()
    setIsAuth(false)
    setOrders([])
  }

  const handleApprove = async (orderId: string) => {
    setLoading(true)
    try {
      const response = await approveOrder(orderId)
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'Order approved and sent to printer',
        })
        await loadOrders()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to approve order',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to approve order:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (orderId: string, reason: string) => {
    setLoading(true)
    setOpenDropdown(null)
    try {
      const response = await rejectOrder(orderId, reason)
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'Order rejected and refunded',
        })
        await loadOrders()
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to reject order',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to reject order:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your admin token to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin Token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Login
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation('/')}
                >
                  Back to Home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Review Dashboard</h1>
            <p className="text-gray-600 mt-1">Review and approve paid orders</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadOrders} variant="outline" disabled={loadingOrders}>
              {loadingOrders ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {loadingOrders ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No paid orders awaiting review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.orderId} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-mono text-gray-600 truncate">
                    {order.orderId}
                  </CardTitle>
                  <CardDescription>
                    {new Date(order.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.imageUrl ? (
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={order.imageUrl}
                        alt="Order photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 text-sm">No image available</p>
                    </div>
                  )}

                  {order.shipping && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-semibold">
                        {order.shipping.first_name} {order.shipping.last_name}
                      </p>
                      <p>{order.shipping.address_1}</p>
                      {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
                      <p>
                        {order.shipping.postal_or_zip_code} {order.shipping.city}
                      </p>
                      <p>{order.shipping.country_code}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(order.orderId)}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    
                    <div className="relative flex-1">
                      <Button
                        onClick={() => setOpenDropdown(
                          openDropdown === order.orderId ? null : order.orderId
                        )}
                        disabled={loading}
                        variant="destructive"
                        className="w-full"
                      >
                        Reject ▼
                      </Button>
                      
                      {openDropdown === order.orderId && (
                        <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                          {REJECTION_REASONS.map((reason) => (
                            <button
                              key={reason}
                              onClick={() => handleReject(order.orderId, reason)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                              disabled={loading}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

