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
4. **gcloud CLI**: [Installation Guide](https://cloud.google.com/sdk/docs/install)
5. **`u2net_human_seg.onnx` model file**: Download the model from [a known source] and place it in `gcp-api/models/`.

## Step 1: GCP Deployment (Cloud Run)

The GCP infrastructure (Cloud Run, Storage, IAM) is managed by the `scripts/deploy-gcp.sh` script. This script automates the setup and deployment process.

### 1.1 Configure the STAGE

Before running the script, you must set the `STAGE` environment variable to either `dev` or `prod`. This determines the GCP project, service names, and other resources.

```bash
export STAGE=dev # or 'prod'
```

### 1.2 Run the Deployment Script

From the project root, execute the script:

```bash
./scripts/deploy-gcp.sh
```

The script will:
1.  **Set the GCP Project**: Configures `gcloud` to use the correct project (`babypicturevalidator-dev` or `babypicturevalidator-prod`).
2.  **Enable GCP APIs**: Enables Cloud Build, Cloud Run, Artifact Registry, and Storage APIs.
3.  **Create Artifact Registry**: Sets up a Docker image repository.
4.  **Create Storage Bucket**: Creates a GCS bucket for order pictures with correct CORS settings.
5.  **Build & Submit Docker Image**: Builds the `gcp-api` service using Cloud Build and pushes it to the Artifact Registry.
6.  **Configure IAM**: Creates a dedicated service account with the necessary permissions for Cloud Storage and Cloud Vision.
7.  **Deploy to Cloud Run**: Deploys the service with production-ready settings for memory, CPU, and concurrency.

After the script finishes, it will output the **Backend Service URL**. You will need this for the Vercel configuration.

## Step 2: Vercel Setup

### 2.1 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2.2 Configure Environment Variables

In your Vercel project settings, add the following environment variables. Use the **Backend Service URL** from the previous step for `GCP_API_URL`.

| Variable Name         | Description                                                                 | Example (dev)                                                               |
| --------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `GCP_API_URL`         | The URL of the deployed Cloud Run service.                                  | `https://baby-picture-validator-api-dev-....run.app`                         |
| `STRIPE_SECRET_KEY`   | Your Stripe secret key.                                                     | `sk_test_...`                                                               |
| `STRIPE_PRICE_ID`     | The Stripe Price ID for your product.                                       | `price_...`                                                                 |
| `STRIPE_WEBHOOK_SECRET` | The secret for verifying Stripe webhooks.                                   | `whsec_...`                                                                 |
| `FRONTEND_URL`        | The public URL of your Vercel deployment.                                   | `https://your-app-dev.vercel.app`                                           |

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

Use the health check endpoint from the deployment output to verify the service is running.

```bash
# Test health endpoint
curl https://baby-picture-validator-api-[...].run.app/health
```

### 4.2 Test Vercel API

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health
``` 