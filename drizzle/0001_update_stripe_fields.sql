-- Migration to update orders table with new Stripe fields
-- Drop the old payment_id column
ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_id";

-- Add new Stripe fields
ALTER TABLE "orders" ADD COLUMN "stripe_session_id" varchar(255);
ALTER TABLE "orders" ADD COLUMN "stripe_payment_intent_id" varchar(255);
