#!/bin/bash
# GCP Deployment Script for Baby Picture Validator API
# This script builds and deploys the Flask API to GCP Cloud Run.
# It should be run from the root of the project.

# Make sure to set the STAGE to one of the following: dev, prod

set -e
# --- Configuration ---
PROJECT_ID="babypicturevalidator-${STAGE}"
SERVICE_NAME="baby-picture-validator-api-${STAGE}"
REGION="europe-west1"
ARTIFACT_REGISTRY_REPO="${SERVICE_NAME}-repo"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${SERVICE_NAME}"
GCP_API_DIR="gcp-api"

# Storage configuration
STORAGE_BUCKET_NAME="${SERVICE_NAME}-order-pictures"
STORAGE_LOCATION="europe-west1"

echo "🚀 Starting GCP deployment for service: ${SERVICE_NAME} in ${REGION}"

# --- Pre-flight Checks ---
# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: Google Cloud CLI ('gcloud') not found. Please follow installation instructions in DEPLOYMENT.md."
    exit 1
fi

# Check if we are in the correct directory
if [ ! -d "$GCP_API_DIR" ]; then
    echo "❌ Error: Cannot find the '${GCP_API_DIR}' directory."
    echo "This script must be run from the project root."
    exit 1
fi

# --- GCP Setup ---
echo "📦 Setting GCP project to ${PROJECT_ID}..."
gcloud config set project $PROJECT_ID

echo "🔧 Enabling required GCP services..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com storage.googleapis.com storage-component.googleapis.com

echo "🖼️  Creating Artifact Registry repository (if it doesn't exist)..."
gcloud artifacts repositories create "${ARTIFACT_REGISTRY_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for ${SERVICE_NAME}" >/dev/null 2>&1 || echo "✅ Repository '${ARTIFACT_REGISTRY_REPO}' already exists in '${REGION}'."

# --- Google Cloud Storage Setup ---
echo "🗄️  Setting up Google Cloud Storage..."

# Create storage bucket
echo "📦 Creating storage bucket: ${STORAGE_BUCKET_NAME}"
gcloud storage buckets create "gs://${STORAGE_BUCKET_NAME}" \
    --location="${STORAGE_LOCATION}" \
    --uniform-bucket-level-access \
    --public-access-prevention \
    --project="${PROJECT_ID}" >/dev/null 2>&1 || echo "✅ Bucket '${STORAGE_BUCKET_NAME}' already exists."

# Configure CORS for the bucket to allow frontend access
echo "🌐 Configuring CORS settings for frontend access..."
gcloud storage buckets update "gs://${STORAGE_BUCKET_NAME}" \
    --cors-file="scripts/bucket-cors-${STAGE}.json" >/dev/null 2>&1 || echo "⚠️  Could not set CORS policy (continuing anyway)"

# --- Build Docker Image ---
echo "🏗️ Building Docker image with Cloud Build..."
# We submit the gcp-api directory to Cloud Build
gcloud builds submit "$GCP_API_DIR" --tag "$IMAGE_NAME"

# --- Deploy to Cloud Run ---
echo "🚀 Deploying to Cloud Run in ${REGION}..."

# Deploy the service first
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --timeout 300s \
    --concurrency 80 \
    --max-instances 10 \
    --set-env-vars "CORS_ORIGINS=https://passport-validator.vercel.app,GCS_BUCKET_NAME=${STORAGE_BUCKET_NAME}"

# --- Configure IAM Permissions ---
echo "🔐 Configuring IAM permissions for storage access..."

# Create a dedicated service account for this specific service
SERVICE_ACCOUNT_NAME="${SERVICE_NAME}-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "👤 Creating dedicated service account: ${SERVICE_ACCOUNT_NAME}"

# Create the service account (ignore if it already exists)
gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
    --display-name="Service account for ${SERVICE_NAME}" \
    --description="Dedicated service account for ${SERVICE_NAME} with minimal storage permissions" >/dev/null 2>&1 || echo "✅ Service account '${SERVICE_ACCOUNT_NAME}' already exists."

# Grant minimal storage permissions - only for the specific bucket
echo "🔑 Granting minimal storage permissions for bucket: ${STORAGE_BUCKET_NAME}"
gcloud storage buckets add-iam-policy-binding "gs://${STORAGE_BUCKET_NAME}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/storage.objectViewer" >/dev/null 2>&1 || echo "⚠️  Could not grant storage viewer permissions"

gcloud storage buckets add-iam-policy-binding "gs://${STORAGE_BUCKET_NAME}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/storage.objectCreator" >/dev/null 2>&1 || echo "⚠️  Could not grant storage creator permissions"

# Update the Cloud Run service to use the dedicated service account
echo "🔄 Updating Cloud Run service to use dedicated service account..."
gcloud run services update "$SERVICE_NAME" \
    --platform managed \
    --region "$REGION" \
    --service-account="${SERVICE_ACCOUNT_EMAIL}" >/dev/null 2>&1 || echo "⚠️  Could not update service account (may already be set)"

echo "📋 Service account: ${SERVICE_ACCOUNT_EMAIL}"

# --- Final Output ---
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region="$REGION" --format="value(status.url)")

echo ""
echo "✅ Deployment successful!"
echo ""
echo "✅ Backend Service URL: ${SERVICE_URL}"
echo "✅ Storage Bucket: gs://${STORAGE_BUCKET_NAME}"
echo ""
echo "💡 Next steps:"
echo "   1. Copy the Service URL above."
echo "   2. Set it as an environment variable in your Vercel project:"
echo "      vercel env add GCP_API_URL ${SERVICE_URL} --prod"
echo "   3. Redeploy your Vercel frontend:"
echo "      npm run deploy"
echo ""
echo "🧪 You can test the health endpoint with:"
echo "   curl ${SERVICE_URL}/health"
echo ""