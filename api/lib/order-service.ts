import { eq } from 'drizzle-orm';
import { ensureDatabaseConnection } from './database.js';
import { orders, type Order, type OrderStatus } from './schema.js';

export class OrderService {
  private async getDb() {
    return await ensureDatabaseConnection();
  }

  async createOrder(): Promise<Order> {
    const db = await this.getDb();
    const [order] = await db
      .insert(orders)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const db = await this.getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    
    return order || null;
  }

  async getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | null> {
    const db = await this.getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, stripeSessionId))
      .limit(1);
    
    return order || null;
  }

  async getOrderByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Order | null> {
    const db = await this.getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, stripePaymentIntentId))
      .limit(1);
    
    return order || null;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const db = await this.getDb();
    const [order] = await db
      .update(orders)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order || null;
  }

  async updateOrderStripeSessionId(id: string, stripeSessionId: string): Promise<Order | null> {
    const db = await this.getDb();
    const [order] = await db
      .update(orders)
      .set({ 
        stripeSessionId, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order || null;
  }

  async updateOrderStripePaymentIntentId(id: string, stripePaymentIntentId: string): Promise<Order | null> {
    const db = await this.getDb();
    const [order] = await db
      .update(orders)
      .set({ 
        stripePaymentIntentId, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order || null;
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const db = await this.getDb();
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status));
  }

  async getAllOrders(): Promise<Order[]> {
    const db = await this.getDb();
    return await db
      .select()
      .from(orders)
      .orderBy(orders.createdAt);
  }

  async deleteOrder(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db
      .delete(orders)
      .where(eq(orders.id, id));
    
    return (result.rowCount ?? 0) > 0;
  }
}

// Export singleton instance with lazy initialization
let _orderService: OrderService | null = null;

export function getOrderService(): OrderService {
  if (!_orderService) {
    _orderService = new OrderService();
  }
  return _orderService;
}

// For backward compatibility, export the lazy getter
export const orderService = {
  get createOrder() { return getOrderService().createOrder.bind(getOrderService()); },
  get getOrderById() { return getOrderService().getOrderById.bind(getOrderService()); },
  get getOrderByStripeSessionId() { return getOrderService().getOrderByStripeSessionId.bind(getOrderService()); },
  get getOrderByStripePaymentIntentId() { return getOrderService().getOrderByStripePaymentIntentId.bind(getOrderService()); },
  get updateOrderStatus() { return getOrderService().updateOrderStatus.bind(getOrderService()); },
  get updateOrderStripeSessionId() { return getOrderService().updateOrderStripeSessionId.bind(getOrderService()); },
  get updateOrderStripePaymentIntentId() { return getOrderService().updateOrderStripePaymentIntentId.bind(getOrderService()); },
  get getOrdersByStatus() { return getOrderService().getOrdersByStatus.bind(getOrderService()); },
  get getAllOrders() { return getOrderService().getAllOrders.bind(getOrderService()); },
  get deleteOrder() { return getOrderService().deleteOrder.bind(getOrderService()); },
};
