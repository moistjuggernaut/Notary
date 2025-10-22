import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  fetchOrders, 
  approveOrder, 
  rejectOrder, 
  getFamilinkOrder,
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
  const [loadingOrdersList, setLoadingOrdersList] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set())
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    if (isAuth) {
      loadOrders()
    }
  }, [isAuth])

  const loadOrders = async () => {
    setLoadingOrdersList(true)
    try {
      const response = await fetchOrders()
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
      setLoadingOrdersList(false)
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
    console.log('🟢 Approve clicked for order:', orderId)
    setLoadingOrders(prev => {
      const newSet = new Set(prev)
      newSet.add(orderId)
      console.log('🟢 Loading orders after add:', Array.from(newSet))
      return newSet
    })
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
      setLoadingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        console.log('🟢 Loading orders after remove:', Array.from(newSet))
        return newSet
      })
    }
  }

  const handleReject = async (orderId: string, reason: string) => {
    console.log('🔴 Reject clicked for order:', orderId, 'reason:', reason)
    setLoadingOrders(prev => {
      const newSet = new Set(prev)
      newSet.add(orderId)
      console.log('🔴 Loading orders after add:', Array.from(newSet))
      return newSet
    })
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
      setLoadingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        console.log('🔴 Loading orders after remove:', Array.from(newSet))
        return newSet
      })
    }
  }

  const handleFamilinkContent = async (orderId: string) => {
    console.log('🔵 Familink clicked for order:', orderId)
    setLoadingOrders(prev => {
      const newSet = new Set(prev)
      newSet.add(orderId)
      console.log('🔵 Loading orders after add:', Array.from(newSet))
      return newSet
    })
    try {
      const familinkData = await getFamilinkOrder(orderId)
      const jsonString = JSON.stringify(familinkData, null, 2)
      
      toast({
        title: 'Familink Order Data',
        description: (
          <div className="max-w-md">
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {jsonString}
            </pre>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      })
    } catch (error) {
      console.error('Failed to fetch Familink data:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch Familink data',
        variant: 'destructive',
      })
    } finally {
      setLoadingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        console.log('🔵 Loading orders after remove:', Array.from(newSet))
        return newSet
      })
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
            <Button onClick={loadOrders} variant="outline" disabled={loadingOrdersList}>
              {loadingOrdersList ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {loadingOrdersList ? (
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

                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(order.orderId)}
                        disabled={loadingOrders.has(order.orderId)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {loadingOrders.has(order.orderId) ? 'Approving...' : 'Approve'}
                      </Button>
                      
                      <div className="relative flex-1">
                        <Button
                          onClick={() => {
                            console.log('🔽 Reject button clicked for order:', order.orderId, 'current openDropdown:', openDropdown)
                            const newDropdown = openDropdown === order.orderId ? null : order.orderId
                            console.log('🔽 Setting dropdown to:', newDropdown)
                            setOpenDropdown(newDropdown)
                          }}
                          disabled={loadingOrders.has(order.orderId)}
                          variant="destructive"
                          className="w-full"
                        >
                          {loadingOrders.has(order.orderId) ? 'Processing...' : 'Reject ▼'}
                        </Button>
                        
                        {openDropdown === order.orderId && (
                          <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                            {REJECTION_REASONS.map((reason) => (
                              <button
                                key={reason}
                                onClick={() => handleReject(order.orderId, reason)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                disabled={loadingOrders.has(order.orderId)}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleFamilinkContent(order.orderId)}
                      disabled={loadingOrders.has(order.orderId)}
                      variant="outline"
                      className="w-full"
                    >
                      {loadingOrders.has(order.orderId) ? 'Loading...' : 'Familink Content'}
                    </Button>
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

