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

  async updateOrderFamilinkId(id: string, familinkId: string): Promise<Order | null> {
    const db = await this.getDb();
    const [order] = await db
      .update(orders)
      .set({ 
        familinkId, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    
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

}

export const orderService = new OrderService();
