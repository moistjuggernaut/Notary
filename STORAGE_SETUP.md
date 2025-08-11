# Google Cloud Storage Setup Guide

This guide explains how to set up Google Cloud Storage for storing validated passport photos.

## Prerequisites

1. **Google Cloud Project**: You need a GCP project with billing enabled
2. **GCP CLI**: Install and authenticate with `gcloud`
3. **Storage Admin Role**: Your service account needs storage permissions

## Local Development Authentication

For local development, you can connect to a real Google Cloud Storage bucket in a different GCP project. This is done using a Service Account

### **1. Create a Service Account**

```bash
# Set your target project ID
export TARGET_PROJECT_ID="your-target-project-id"
gcloud config set project $TARGET_PROJECT_ID

# Create a service account for local development
gcloud iam service-accounts create photo-validator-dev \
    --display-name="Photo Validator Local Development"

# Grant storage permissions
gcloud projects add-iam-policy-binding $TARGET_PROJECT_ID \
    --member="serviceAccount:photo-validator-dev@$TARGET_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Create and download the key
gcloud iam service-accounts keys create ~/photo-validator-dev-key.json \
    --iam-account=photo-validator-dev@$TARGET_PROJECT_ID.iam.gserviceaccount.com
```

### **2. Create a Storage Bucket**

```bash
# Create a bucket for development
export DEV_BUCKET_NAME="photo-validator-dev-$(date +%s)"
gcloud storage buckets create "gs://${DEV_BUCKET_NAME}" \
    --location=europe-west1 \
    --uniform-bucket-level-access \
    --public-access-prevention
```

### **3. Run with Service Account**

```bash
# Update the script with your actual values
npm run gcp:run:with-service-account
```

Or manually:

```bash
docker run -p 8080:8080 \
  -e GCP_API_URL='http://localhost:8080' \
  -e GCS_BUCKET_NAME="${DEV_BUCKET_NAME}" \
  -e GCP_PROJECT_ID="${TARGET_PROJECT_ID}" \
  -e GOOGLE_APPLICATION_CREDENTIALS='/app/service-account-key.json' \
  -v ~/photo-validator-dev-key.json:/app/service-account-key.json:ro \
  --rm baby-picture-validator-api
```

### **Environment Variables for Local Development**

| Variable | Description | Example |
|----------|-------------|---------|
| `GCS_BUCKET_NAME` | Your storage bucket name | `photo-validator-dev-1234567890` |
| `GCP_PROJECT_ID` | Your GCP project ID | `my-dev-project-123` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key | `/app/service-account-key.json` |

## Security Considerations

### 1. Bucket Access Control

By default, the bucket is private.

### 2. Signed URLs

For secure access without making the bucket public, use signed URLs:

```python
# Generate a signed URL for temporary access
signed_url = storage_client.get_signed_url(blob_name, expiration=3600)
```

### 3. Lifecycle Management

Set up automatic deletion of old images:

```bash
# Create lifecycle policy
cat > lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 30,
        "matchesPrefix": ["original-photos/", "validated-photos/"]
      }
    }
  ]
}
EOF

# Apply lifecycle policy
gcloud storage buckets update gs://$BUCKET_NAME \
    --lifecycle-file=lifecycle.json
```
