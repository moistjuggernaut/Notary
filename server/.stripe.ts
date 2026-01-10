/**
 * Stripe configuration helper
 * Centralizes Stripe initialization and configuration
 */
import Stripe from 'stripe';


// Validate required environment variables
export function validateStripeConfig(): void {
  const requiredVars: string[] = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PRICE_ID',
    'APP_PUBLIC_BASE_URL'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required Stripe environment variable: ${varName}`);
    }
  }
}

// Initialize Stripe instance
export function getStripe(): Stripe {
  validateStripeConfig();
  
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  });
}

// Validate webhook configuration
export function validateWebhookConfig(): void {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
  }
}

// Get webhook secret
export function getWebhookSecret(): string {
  validateWebhookConfig();
  return process.env.STRIPE_WEBHOOK_SECRET!;
}
