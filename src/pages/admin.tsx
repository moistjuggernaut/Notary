import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getFamilinkOrder, approveOrder, clearAdminToken, fetchOrders, isAuthenticated, rejectOrder, setAdminToken } from '@/api/admin-client'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useToast } from '@/hooks/use-toast'
import { REJECTION_REASONS } from '@/types/api'
import type { Order } from '@/types/api'

export default function Admin(): React.JSX.Element {
  usePageMeta({
    title: 'Admin | Passport Photo Validator',
    description: 'Administrative review area.',
    canonicalPath: '/admin',
    robots: 'noindex,nofollow',
  })

  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [isAuth, setIsAuth] = useState(isAuthenticated())
  const [password, setPassword] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrdersList, setLoadingOrdersList] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set())
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  function addLoadingOrder(orderId: string): void {
    setLoadingOrders((previousOrders) => new Set(previousOrders).add(orderId))
  }

  function removeLoadingOrder(orderId: string): void {
    setLoadingOrders((previousOrders) => {
      const nextOrders = new Set(previousOrders)
      nextOrders.delete(orderId)
      return nextOrders
    })
  }

  function isOrderLoading(orderId: string): boolean {
    return loadingOrders.has(orderId)
  }

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error) {
      return error.message
    }

    return fallbackMessage
  }

  const loadOrders = useCallback(async () => {
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
          description: getErrorMessage(error, 'Failed to load orders'),
          variant: 'destructive',
        })
      }
    } finally {
      setLoadingOrdersList(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuth) {
      void loadOrders()
    }
  }, [isAuth, loadOrders])

  function handleLogin(e: React.FormEvent): void {
    e.preventDefault()
    setAdminToken(password)
    setIsAuth(true)
    setPassword('')
  }

  function handleLogout(): void {
    clearAdminToken()
    setIsAuth(false)
    setOrders([])
  }

  async function handleApprove(orderId: string): Promise<void> {
    addLoadingOrder(orderId)
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
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to approve order'),
        variant: 'destructive',
      })
    } finally {
      removeLoadingOrder(orderId)
    }
  }

  async function handleReject(orderId: string, reason: string): Promise<void> {
    addLoadingOrder(orderId)
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
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to reject order'),
        variant: 'destructive',
      })
    } finally {
      removeLoadingOrder(orderId)
    }
  }

  async function handleFamilinkContent(orderId: string): Promise<void> {
    addLoadingOrder(orderId)
    try {
      const familinkData = await getFamilinkOrder(orderId)
      const jsonString = JSON.stringify(familinkData, null, 2)

      toast({
        title: 'Familink Order Data',
        description: (
          <div className="max-w-md">
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {jsonString}
            </pre>
          </div>
        ),
        duration: 10000,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to fetch Familink data'),
        variant: 'destructive',
      })
    } finally {
      removeLoadingOrder(orderId)
    }
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
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
                  className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Review Dashboard</h1>
            <p className="text-muted-foreground mt-1">Review and approve paid orders</p>
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
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No paid orders awaiting review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const orderIsLoading = isOrderLoading(order.id)

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-mono text-muted-foreground truncate">
                      {order.id}
                    </CardTitle>
                    <CardDescription>
                      {new Date(order.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.imageUrl ? (
                      <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                        <img
                          src={order.imageUrl}
                          alt="Order photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No image available</p>
                      </div>
                    )}

                    {order.shipping && (
                      <div className="text-sm text-muted-foreground space-y-1">
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
                          onClick={() => handleApprove(order.id)}
                          disabled={orderIsLoading}
                          variant="success"
                          className="flex-1"
                        >
                          {orderIsLoading ? 'Approving...' : 'Approve'}
                        </Button>

                        <div className="relative flex-1">
                          <Button
                            onClick={() => setOpenDropdown(openDropdown === order.id ? null : order.id)}
                            disabled={orderIsLoading}
                            variant="destructive"
                            className="w-full"
                          >
                            {orderIsLoading ? 'Processing...' : 'Reject ▼'}
                          </Button>

                          {openDropdown === order.id && (
                            <div className="absolute bottom-full mb-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                              {REJECTION_REASONS.map((reason) => (
                                <Button
                                  key={reason}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(order.id, reason)}
                                  className="w-full justify-start rounded-none font-normal"
                                  disabled={orderIsLoading}
                                >
                                  {reason}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleFamilinkContent(order.id)}
                        disabled={orderIsLoading}
                        variant="outline"
                        className="w-full"
                      >
                        {orderIsLoading ? 'Loading...' : 'Familink Content'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

