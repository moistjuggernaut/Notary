-- Migration to add 'familink_order_creation_failed' status to order_status enum
ALTER TYPE "public"."order_status" ADD VALUE 'familink_order_creation_failed';
