# Vercel API Endpoints

The API is built using **Hono.js**, a lightweight and fast web framework that handles routing, validation, and middleware automatically.

## Endpoints

### Health Check

- **`GET /api/health`** - Health check endpoint

### Photo Validation

- **`POST /api/photo/validate`** - Full ICAO compliance validation
  - Body: `{ "image": "<base64>", "filename": "<string>" }`
  - Returns validation result with processed image URL

- **`POST /api/photo/remove-background`** - Remove background from validated photo
  - Body: `{ "orderId": "<uuid>" }`
  - Returns processed image URL

### Stripe Payment

- **`POST /api/stripe/create-checkout-session`** - Create Stripe checkout session
  - Query: `?orderId=<uuid>`
  - Redirects to Stripe checkout

- **`POST /api/stripe/webhook`** - Handle Stripe webhook events
  - Handles: `checkout.session.completed`, `checkout.session.async_payment_succeeded`

### Admin Routes (Protected)

All admin routes require `Authorization: Bearer <ADMIN_TOKEN>` header.

- **`GET /api/admin/orders`** - List orders pending review
- **`POST /api/admin/orders/:orderId/approve`** - Approve order and send to printer
- **`POST /api/admin/orders/:orderId/reject`** - Reject order and initiate refund
  - Body: `{ "reason": "<string>" }`
- **`GET /api/admin/familink/:orderId`** - Get Familink order status

## Modular Structure

```
api/
├── index.ts                      # Main Hono.js app with routing
└── lib/
    ├── cloud-vision-validator.ts # Google Cloud Vision API integration
    ├── image-preprocessor.ts     # Image cropping and resizing with Sharp
    ├── photo-validator.ts        # Main validation orchestrator
    ├── print-processor.ts        # Print layout generation
    ├── validation-constants.ts   # ICAO configuration and thresholds
    ├── database.ts               # PostgreSQL connection (Drizzle ORM)
    ├── schema.ts                 # Database schema definitions
    ├── order-service.ts          # Order CRUD operations
    ├── fulfillment.ts            # Stripe webhook handling
    ├── admin-actions.ts          # Order approval/rejection logic
    ├── stripe-refunds.ts         # Refund processing
    ├── familink.ts               # Print fulfillment integration
    ├── auth-middleware.ts        # Admin route authentication
    ├── .gcp-storage.ts           # GCP Storage utilities
    ├── .stripe.ts                # Stripe configuration
    └── .familink.ts              # Familink configuration
```

## Photo Validation Pipeline

The validation runs directly in the Vercel serverless function:

1. **Cloud Vision API Analysis**
   - Face detection with landmark extraction
   - Blur, pose, and expression analysis
   - Glasses/headwear detection

2. **Image Preprocessing**
   - EXIF orientation normalization
   - ICAO-compliant cropping (35x45mm)
   - High-quality resizing (600 DPI)

3. **Geometry Validation**
   - Aspect ratio verification
   - Head height ratio check
   - Centering validation

## Environment Variables

### Required

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCP_PROJECT_NUMBER=123456789012
GCP_SERVICE_ACCOUNT_EMAIL=vercel@project.iam.gserviceaccount.com
GCP_WORKLOAD_IDENTITY_POOL_ID=vercel
GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=vercel
GCP_STORAGE_BUCKET=your-bucket-name

# Database
SUPABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
APP_PUBLIC_BASE_URL=https://your-app.vercel.app
ADMIN_TOKEN=your-secure-token

# Print Fulfillment
FAMILINK_API_KEY=your-familink-key

# Optional
PHOTOROOM_API_KEY=your-photoroom-key  # For background removal
```

### Local Development

```bash
# Use local emulators
USE_LOCAL_STORAGE=true

# Local database connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=photo_validator
```

## Development

### Local Testing

1. Install dependencies: `npm install`
2. Set up environment variables in `.env.local` (pull with `vercel env pull`)
3. Start infrastructure: `npm run dev:up`
4. Run development server: `vercel dev`

### Stripe CLI for Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
