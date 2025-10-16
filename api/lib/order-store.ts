export type OrderStatus = 'paid' | 'rejected' | 'sent' | 'refunded'


export interface Order {
  orderId: string
  status: OrderStatus
  paymentIntentId: string
  stripeSessionId: string
  createdAt: Date
  updatedAt: Date
  rejectionReason?: string
}

class OrderStore {
  private orders: Map<string, Order>

  constructor() {
    this.orders = new Map()
  }

  createOrder(orderId: string, stripeSessionId: string, paymentIntentId: string): Order {
    const order: Order = {
      orderId,
      stripeSessionId,
      paymentIntentId,
      status: 'paid',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.orders.set(orderId, order)
    console.log('[OrderStore] Created order:', orderId)
    return order
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId)
  }

  updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Order | null {
    const order = this.orders.get(orderId)
    if (!order) {
      console.warn('[OrderStore] Order not found:', orderId)
      return null
    }

    order.status = status
    order.updatedAt = new Date()
    if (rejectionReason) {
      order.rejectionReason = rejectionReason
    }

    console.log('[OrderStore] Updated order status:', { orderId, status, rejectionReason })
    return order
  }

  getAllOrdersByStatus(status: OrderStatus): Order[] {
    return Array.from(this.orders.values())
      .filter(order => order.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}

// Singleton instance
export const orderStore = new OrderStore()

