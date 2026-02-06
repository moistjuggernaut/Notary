# Passport Photo Validator

Validates passport photos against ICAO international standards and EU biometric requirements using Google Cloud Vision API. Automatic cropping, processing, and print-ready output.

## Quick Start

```bash
npm install

# Start infrastructure (Postgres, GCS emulator, Stripe webhooks)
npm run dev:full

# Start frontend + API
vercel dev
```

## Architecture

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| API | Hono.js on Vercel Serverless Functions |
| Vision AI | Google Cloud Vision API |
| Database | PostgreSQL (Supabase prod, Docker dev) via Drizzle ORM |
| Payments | Stripe |
| Storage | Google Cloud Storage |
| Print | Familink API |
| Background Removal | Photoroom API |

## Project Structure

```
src/                    React frontend
  components/           UI components
  pages/                Route pages
  hooks/                Custom hooks
  lib/                  Utilities
api/
  index.ts              Hono.js API (single serverless function)
server/                 Backend modules (bundled with API)
  cloud-vision-validator.ts
  image-preprocessor.ts
  photo-validator.ts
  validation-constants.ts
  database.ts
  schema.ts
  order-service.ts
  fulfillment.ts
  admin-actions.ts
  stripe-refunds.ts
  familink.ts
  auth-middleware.ts
drizzle/                Database migrations
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/photo/validate` | ICAO compliance validation |
| POST | `/api/photo/remove-background` | Background removal |
| POST | `/api/stripe/create-checkout-session` | Stripe checkout |
| POST | `/api/stripe/webhook` | Stripe webhooks |
| GET | `/api/admin/orders` | List pending orders (auth required) |
| POST | `/api/admin/orders/:id/approve` | Approve order (auth required) |
| POST | `/api/admin/orders/:id/reject` | Reject order (auth required) |
| GET | `/api/admin/familink/:id` | Familink order status (auth required) |

## Validation Pipeline

1. **Cloud Vision API** — face detection, blur, pose, expression, glasses/headwear
2. **Image Preprocessing** — EXIF normalization, ICAO crop (35x45mm at 600 DPI)
3. **Geometry Validation** — aspect ratio, head height ratio, centering

## Environment Variables

### Production (Vercel)

```bash
# GCP
GCP_PROJECT_ID=
GCP_PROJECT_NUMBER=
GCP_SERVICE_ACCOUNT_EMAIL=
GCP_WORKLOAD_IDENTITY_POOL_ID=
GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=
GCP_STORAGE_BUCKET=

# Database
SUPABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# App
APP_PUBLIC_BASE_URL=
ADMIN_TOKEN=

# Services
FAMILINK_API_KEY=
PHOTOROOM_API_KEY=          # optional
```

### Local Development

```bash
USE_LOCAL_STORAGE=true
GCP_STORAGE_BUCKET=local-bucket
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=photo_validator
```

## Database

Uses Drizzle ORM with PostgreSQL.

```bash
npm run db:generate     # Generate migrations from schema changes
npm run db:migrate      # Apply migrations
npm run db:studio       # Open Drizzle Studio
npm run db:dev:up       # Start local Postgres container
npm run db:dev:down     # Stop container
```

### Supabase (Production)

1. Create project at [supabase.com](https://supabase.com)
2. Get URI connection string from Settings > Database
3. Set `SUPABASE_URL` in Vercel environment variables
4. Run `npm run db:migrate`

## Storage

Images stored in GCS organized by order ID:

```
bucket/<order-id>/
  original.webp
  validated.webp
  validated_bg_removed.png
```

### Local Development

The GCS emulator runs via Docker:

```bash
npm run gcs:dev:up
npm run gcs:dev:status
```

### Production

Uses Workload Identity Federation for keyless auth from Vercel. See GCP setup below.

## Deployment

### Vercel

- Push to `main` for production deployment
- Push to any other branch for preview

### GCP Setup

```bash
# Enable APIs
gcloud services enable vision.googleapis.com storage.googleapis.com iamcredentials.googleapis.com

# Create storage bucket
gcloud storage buckets create "gs://BUCKET_NAME" --location=europe-west1 --uniform-bucket-level-access

# Workload Identity Federation for Vercel
gcloud iam workload-identity-pools create vercel --location=global
gcloud iam workload-identity-pools providers create-oidc vercel \
  --location=global --workload-identity-pool=vercel \
  --issuer-uri="https://oidc.vercel.com" \
  --attribute-mapping="google.subject=assertion.sub"

# Service account with Vision + Storage access
gcloud iam service-accounts create vercel --display-name="Vercel"
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:vercel@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:vercel@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/visionai.user"
```

### Stripe Webhooks

```bash
# Local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Production: add endpoint https://your-app.vercel.app/api/stripe/webhook
# Events: checkout.session.completed, checkout.session.async_payment_succeeded
```

## Scripts

```bash
npm run dev:full        # Start all infrastructure + Stripe listener
npm run typecheck       # TypeScript check
npm run test            # Run tests
npm run lint            # Lint
npm run format          # Format
npm run deploy          # Deploy to Vercel production
```

## License

Private. All rights reserved.
