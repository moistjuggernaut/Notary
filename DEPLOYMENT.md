# Deployment Guide

This guide covers deploying the Photo Validator application using the hybrid Vercel + GCP architecture.

## Architecture Overview

The application consists of:
- **Frontend**: React app deployed on Vercel
- **Vercel API**: Hono.js API that orchestrates image processing
- **GCP Cloud Run**: Python Flask service for ML processing
- **GCP Storage**: Temporary image storage

## Prerequisites

1. **Vercel Account**: For frontend and API deployment
2. **Google Cloud Platform Account**: For Cloud Run and Storage
3. **Stripe Account**: For payment processing

## Step 1: GCP Setup

### 1.1 Create GCP Project

```bash
# Create new project
gcloud projects create photo-validator-[YOUR-NAME] --name="Photo Validator"

# Set as default project
gcloud config set project photo-validator-[YOUR-NAME]

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 1.2 Create Storage Bucket

```bash
# Create bucket (use unique name)
gsutil mb gs://photo-validator-[YOUR-NAME]

# Set CORS policy for the bucket
gsutil cors set scripts/bucket-cors-prod.json gs://photo-validator-[YOUR-NAME]
```

### 1.3 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create photo-validator-api \
    --display-name="Photo Validator API"

# Grant necessary permissions
gcloud projects add-iam-policy-binding photo-validator-[YOUR-NAME] \
    --member="serviceAccount:photo-validator-api@photo-validator-[YOUR-NAME].iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding photo-validator-[YOUR-NAME] \
    --member="serviceAccount:photo-validator-api@photo-validator-[YOUR-NAME].iam.gserviceaccount.com" \
    --role="roles/storage.objectCreator"

# Create and download key
gcloud iam service-accounts keys create service-account-key.json \
    --iam-account=photo-validator-api@photo-validator-[YOUR-NAME].iam.gserviceaccount.com
```

### 1.4 Deploy GCP Cloud Run Service

```bash
# Build and deploy
gcloud run deploy baby-picture-validator-api \
    --source ./gcp-api \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --service-account=photo-validator-api@photo-validator-[YOUR-NAME].iam.gserviceaccount.com \
    --set-env-vars="GCS_BUCKET_NAME=photo-validator-[YOUR-NAME]"
```

## Step 2: Vercel Setup

### 2.1 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2.2 Configure Environment Variables

In the Vercel dashboard, set the following environment variables:

```bash
# GCP Configuration
GCP_PROJECT_ID=photo-validator-[YOUR-NAME]
GCP_SERVICE_ACCOUNT_KEY={"type": "service_account", ...} # Full JSON from service-account-key.json
GCP_STORAGE_BUCKET=photo-validator-[YOUR-NAME]
GCP_RUN_SERVICE_NAME=baby-picture-validator-api
GCP_RUN_REGION=us-central1
GCP_RUN_AUTH_TOKEN=your-auth-token

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-app.vercel.app
```

## Step 3: Stripe Setup

### 3.1 Create Stripe Products

1. Go to Stripe Dashboard > Products
2. Create a product for photo validation
3. Note the Price ID

### 3.2 Configure Webhooks

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Note the webhook secret

## Step 4: Testing

### 4.1 Test GCP Cloud Run

```bash
# Test health endpoint
curl https://baby-picture-validator-api-[PROJECT-ID]-[REGION].run.app/health

# Test quick check (replace with actual image data)
curl -X POST https://baby-picture-validator-api-[PROJECT-ID]-[REGION].run.app/api/quick_check \
  -H "Content-Type: application/json" \
  -d '{"uuid":"test-123","imageUrl":"https://example.com/image.jpg"}'
```

### 4.2 Test Vercel API

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test quick check
curl -X POST https://your-app.vercel.app/api/photo/quick-check \
  -H "Content-Type: application/json" \
  -d '{"image":"base64-encoded-image","filename":"test.jpg"}'
```

## Step 5: Monitoring

### 5.1 GCP Monitoring

```bash
# View Cloud Run logs
gcloud logs tail --service=baby-picture-validator-api

# View Storage usage
gsutil du -sh gs://photo-validator-[YOUR-NAME]
```

### 5.2 Vercel Monitoring

- Use Vercel dashboard for function logs
- Monitor function execution times and errors

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure bucket CORS is configured correctly
2. **Authentication Errors**: Verify service account permissions
3. **Image Download Failures**: Check signed URL generation and expiration
4. **GCP Run Timeouts**: Increase timeout limits for large images

### Debug Commands

```bash
# Check GCP service status
gcloud run services describe baby-picture-validator-api --region=us-central1

# Check storage permissions
gsutil iam get gs://photo-validator-[YOUR-NAME]

# Test service account
gcloud auth activate-service-account --key-file=service-account-key.json
```

## Security Considerations

1. **Service Account Keys**: Store securely and rotate regularly
2. **Signed URLs**: Use short expiration times
3. **CORS**: Restrict to specific domains
4. **Environment Variables**: Never commit to version control

## Cost Optimization

1. **Cloud Run**: Use minimum instances = 0 for cost savings
2. **Storage**: Set lifecycle policies to delete old images
3. **Monitoring**: Set up billing alerts 