-- Migration to add 'rejected' status to order_status enum
ALTER TYPE "public"."order_status" ADD VALUE 'rejected';
