# Google Cloud Storage Setup Guide

This guide explains how to set up Google Cloud Storage for storing validated passport photos.

## Prerequisites

1. **Google Cloud Project**: You need a GCP project with billing enabled
2. **GCP CLI**: Install and authenticate with `gcloud`
3. **Storage Admin Role**: Your service account needs storage permissions

## Production Setup (Vercel)

For production, the application uses Workload Identity Federation to authenticate with GCP without service account keys.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production setup instructions.

## Local Development

For local development, you have two options:

### Option 1: Use the GCS Emulator (Recommended)

The `docker-compose.yml` includes a fake GCS server for local development:

```bash
# Start the emulator
npm run gcs:dev:up

# Check status
npm run gcs:dev:status

# View logs
npm run gcs:dev:logs
```

Set in your `.env.local`:
```bash
USE_LOCAL_STORAGE=true
GCP_STORAGE_BUCKET=local-bucket
```

### Option 2: Use Real GCS with Service Account

If you need to test against real GCS:

#### 1. Create a Service Account

```bash
export TARGET_PROJECT_ID="your-project-id"
gcloud config set project $TARGET_PROJECT_ID

# Create service account
gcloud iam service-accounts create photo-validator-dev \
    --display-name="Photo Validator Local Development"

# Grant storage permissions
gcloud projects add-iam-policy-binding $TARGET_PROJECT_ID \
    --member="serviceAccount:photo-validator-dev@$TARGET_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Create and download the key
gcloud iam service-accounts keys create .gcloud-credentials.json \
    --iam-account=photo-validator-dev@$TARGET_PROJECT_ID.iam.gserviceaccount.com
```

#### 2. Set Environment Variables

```bash
export GOOGLE_APPLICATION_CREDENTIALS=".gcloud-credentials.json"
# Or add to .env.local (without USE_LOCAL_STORAGE=true)
```

## Storage Structure

Images are organized by order ID:

```
bucket/
├── <order-id>/
│   ├── original.webp          # Uploaded image (WebP lossless)
│   ├── validated.webp         # Processed/cropped image (WebP q90)
│   └── validated_bg_removed.png  # Background removed (PNG for transparency)
```

## Signed URLs

The application uses signed URLs for secure access:

- **Upload**: Signed URLs are generated after upload
- **Expiration**: 15 minutes (configurable in `.gcp-storage.ts`)
- **Purpose**: Allow Familink and Photoroom to access images temporarily

## Lifecycle Management

For production, set up automatic deletion of old images:

```bash
cat > lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 30
      }
    }
  ]
}
EOF

gcloud storage buckets update gs://$BUCKET_NAME \
    --lifecycle-file=lifecycle.json
```

## CORS Configuration

For development and production, configure CORS:

```json
[
  {
    "origin": ["https://your-app.vercel.app", "http://localhost:3000"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```

Apply with:
```bash
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=cors.json
```
