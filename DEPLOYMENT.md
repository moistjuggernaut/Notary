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

#### 2.1.1 Deploy to Vercel (automatic)

By pusing to specific branches, the frontend and Vercel API are deployed to specific Vercel environments.

- main -> production
- any -> preview

We use a specific preview branch as our last step before merging into main.
This version is deployed to Vercel just like 'any' branch, but can be accessed through this link:

https://passport-validator-git-preview-robert-kucheras-projects.vercel.app

#### 2.1.2 Deploy to Vercel (manual)

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
| `GCP_API_URL`         | The URL of the deployed Cloud Run service.                                  | `https://baby-picture-validator-api-dev-....run.app`                        |
| `GCP_STORAGE_BUCKET`  | The name of the storage bucket for saving the pictures.                     | `baby-picture-validator-api-dev-order-pictures`.                            |
| `GCP_PROJECT_ID`      | The project id chosen in Google Cloud Console                               | `babypicturevalidator-dev`                                                  |
| `GCP_PROJECT_NUMBER`  | The public URL of your Vercel deployment.                                   | `xxxxxxxxxxxx`                                                              |
| `GCP_SERVICE_ACCOUNT_EMAIL` | The service account email used by the Vercel API to access services.  | `vercel@babypicturevalidator-dev.iam.gserviceaccount.com`                   |
| `GCP_WORKLOAD_IDENTITY_POOL_ID` | Identity pool ID.                                                 | `vercel`                                                                    |
| `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | Identity pool provider ID.                               | `vercel`                                                                    |
| `ADMIN_TOKEN`         | A token for accessing the admin pages.                                      | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`                                      |
| `APP_PUBLIC_BASE_URL` | The public URL of your Vercel deployment.                                   | `https://passport-validator-git-preview-robert-kucheras-projects.vercel.app`|
| `STRIPE_SECRET_KEY`   | Your Stripe secret key.                                                     | `sk_test_...`                                                               |
| `STRIPE_PRICE_ID`     | The Stripe Price ID for your product.                                       | `price_...`                                                                 |
| `STRIPE_WEBHOOK_SECRET` | The secret for verifying Stripe webhooks.                                 | `whsec_...`                                                                 |
| `SUPABASE_URL`        | The supabase connection url.                                                | `postgresql://postgres.xx:xx@xx.supabase.com:5432/postgres`                 |
| `FAMILINK_API_KEY`    | The familink API key.                                                       | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`                                  |

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
