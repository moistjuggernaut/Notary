# Deployment Guide

This guide covers deploying the Photo Validator application using Vercel for both frontend and backend.

## Architecture Overview

The application consists of:
- **Frontend**: React app deployed on Vercel
- **Backend API**: Hono.js API deployed on Vercel Serverless Functions
- **Database**: Supabase PostgreSQL
- **Storage**: Google Cloud Storage
- **Vision AI**: Google Cloud Vision API

## Prerequisites

1. **Vercel Account**: For frontend and API deployment
2. **Google Cloud Platform Account**: For Cloud Vision API and Cloud Storage
3. **Supabase Account**: For PostgreSQL database
4. **Stripe Account**: For payment processing
5. **Familink Account**: For print fulfillment

## Step 1: GCP Setup

### 1.1 Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your Project ID and Project Number

### 1.2 Enable Required APIs

```bash
gcloud services enable vision.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```

### 1.3 Create a Storage Bucket

```bash
export BUCKET_NAME="your-bucket-name"
gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --location=europe-west1 \
    --uniform-bucket-level-access
```

### 1.4 Set up Workload Identity Federation for Vercel

This allows Vercel functions to authenticate with GCP without service account keys.

```bash
# Create a Workload Identity Pool
gcloud iam workload-identity-pools create vercel \
    --location="global" \
    --display-name="Vercel"

# Create a Provider for the pool
gcloud iam workload-identity-pools providers create-oidc vercel \
    --location="global" \
    --workload-identity-pool="vercel" \
    --issuer-uri="https://oidc.vercel.com" \
    --attribute-mapping="google.subject=assertion.sub"

# Create a service account for Vercel
gcloud iam service-accounts create vercel \
    --display-name="Vercel Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:vercel@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:vercel@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/visionai.user"

# Allow the Workload Identity Pool to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
    vercel@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/vercel/*" \
    --role="roles/iam.workloadIdentityUser"
```

## Step 2: Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Get the connection string from Settings → Database → Connection string (URI)
3. Note the connection URL for environment variables

## Step 3: Vercel Deployment

### 3.1 Deploy to Vercel

#### Automatic Deployment (Recommended)

Push to specific branches for automatic deployment:
- `main` → Production
- Any other branch → Preview

Preview branch access:
```
https://passport-validator-git-preview-robert-kucheras-projects.vercel.app
```

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### 3.2 Configure Environment Variables

In your Vercel project settings, add the following environment variables:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `GCP_PROJECT_ID` | Your GCP project ID | `your-project-id` |
| `GCP_PROJECT_NUMBER` | Your GCP project number | `123456789012` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Service account email | `vercel@your-project.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDENTITY_POOL_ID` | Workload Identity Pool ID | `vercel` |
| `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | Provider ID | `vercel` |
| `GCP_STORAGE_BUCKET` | Storage bucket name | `your-bucket-name` |
| `SUPABASE_URL` | Supabase connection URL | `postgresql://postgres:...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_PRICE_ID` | Stripe price ID | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `APP_PUBLIC_BASE_URL` | Your app's public URL | `https://your-app.vercel.app` |
| `ADMIN_TOKEN` | Admin authentication token | `your-secure-token` |
| `FAMILINK_API_KEY` | Familink API key | `your-familink-key` |
| `PHOTOROOM_API_KEY` | Photoroom API key (optional) | `your-photoroom-key` |

## Step 4: Stripe Setup

### 4.1 Create Stripe Products

1. Go to Stripe Dashboard → Products
2. Create a product for photo validation
3. Note the Price ID

### 4.2 Configure Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
4. Note the webhook secret

## Step 5: Testing

### 5.1 Test API Health

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "version": "2.0.0"
}
```

### 5.2 Test Stripe Webhooks

Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Troubleshooting

### Common Issues

1. **Cloud Vision API errors**: Ensure the service account has `roles/visionai.user` permission
2. **Storage access denied**: Check bucket permissions and CORS configuration
3. **Database connection errors**: Verify Supabase connection string includes SSL mode

### CORS Configuration for Storage Bucket

```json
[
  {
    "origin": ["https://your-app.vercel.app"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply with:
```bash
gcloud storage buckets update gs://your-bucket --cors-file=cors.json
```
