# Vercel API Endpoints

The API is built using **Hono.js**, a lightweight and fast web framework that handles routing, CORS, and middleware automatically.

## Endpoints

### Core API Endpoints

- **`/api/health`** - Health check endpoint
- **`/api/photo/quick_check`** - Fast face detection validation
- **`/api/photo/validate`** - Full ICAO compliance validation

### Stripe Payment Endpoints

- **`/api/stripe/create_checkout_session`** - Create Stripe checkout sessions
- **`/api/stripe/webhook`** - Handle Stripe webhook events

## Modular Structure

The API is organized into modular components for better maintainability:

```
/api/
├── index.ts               # Main Hono.js app with routing
├── lib/
│   └── .gcp-run.ts        # Helper functions to trigger the photo validation container
│   └── .gcp-storage.ts    # Helper functions to store and retrieve image for Cloud Storage
│   └── .stripe.ts         # Stripe configuration utilities
└── README.md              # Documentation
```

## Stripe Configuration

### Required Environment Variables

Set these environment variables in your Vercel project:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...          # Your Stripe secret key
STRIPE_PRICE_ID=price_...              # Your Stripe price ID for the service
STRIPE_WEBHOOK_SECRET=whsec_...        # Your Stripe webhook endpoint secret
APP_PUBLIC_BASE_URL=https://...        # Your app's public URL
```

### Setting up Stripe

1. **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Get API Keys**: 
   - Go to Stripe Dashboard → Developers → API keys
   - Copy your Secret key (starts with `sk_test_` for test mode)

3. **Create a Product and Price**:
   - Go to Stripe Dashboard → Products
   - Create a new product for your photo validation service
   - Add a price (one-time payment)
   - Copy the Price ID (starts with `price_`)

4. **Set up Webhooks**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret (starts with `whsec_`)

5. **Configure Environment Variables**:
   - In Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables listed above

### Testing Stripe Integration

1. **Test Checkout**: Use test card numbers from Stripe's testing documentation
2. **Test Webhooks**: Use Stripe CLI to forward webhooks to localhost during development
3. **Monitor Logs**: Check Vercel function logs for webhook events

### Webhook Events Handled

- `checkout.session.completed` - Payment completed successfully
- `checkout.session.async_payment_succeeded` - Delayed payment succeeded
- `checkout.session.async_payment_failed` - Delayed payment failed
- `payment_intent.succeeded` - Payment intent succeeded
- `payment_intent.payment_failed` - Payment intent failed

## Development

### Local Testing

1. Install dependencies: `npm install`
2. Set up environment variables in `.env.local`, they can be pulled using `vercel env pull`
3. Use Vercel CLI to test locally: `vercel dev`

### Stripe CLI for Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
