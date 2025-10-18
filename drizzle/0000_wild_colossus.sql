CREATE TYPE "public"."order_status" AS ENUM('created', 'original_uploaded', 'quick_check_completed', 'quick_check_failed', 'validation_started', 'validation_completed', 'validation_failed', 'checkout_started', 'checkout_completed', 'familink_order_created');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" varchar(255),
	"status" "order_status" DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
