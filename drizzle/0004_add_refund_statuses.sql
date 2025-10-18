-- Migration to add refund statuses to order_status enum
ALTER TYPE "public"."order_status" ADD VALUE 'refund_succeeded';
ALTER TYPE "public"."order_status" ADD VALUE 'refund_failed';
