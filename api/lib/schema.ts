import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Order status enum
export const orderStatusEnum = pgEnum('order_status', [
  'created',
  'original_uploaded',
  'quick_check_completed',
  'quick_check_failed',
  'validation_started',
  'validation_completed',
  'validation_failed',
  'checkout_started',
  'checkout_completed',
  'familink_order_created',
  'familink_order_creation_failed',
  'rejected',
  'refund_succeeded',
  'refund_failed',
]);

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  status: orderStatusEnum('status').notNull().default('created'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Export types for TypeScript
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus = typeof orderStatusEnum.enumValues[number];
