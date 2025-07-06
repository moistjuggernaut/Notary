#!/bin/bash
# GCP Deployment Script for Baby Picture Validator API
# This script builds and deploys the Flask API to GCP Cloud Run.
# It should be run from the root of the project.

set -e

# --- Configuration ---
PROJECT_ID="babypicturevalidator"
SERVICE_NAME="baby-picture-validator-api"
REGION="europe-west1"
ARTIFACT_REGISTRY_REPO="${SERVICE_NAME}-repo"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${SERVICE_NAME}"
GCP_API_DIR="gcp-api"

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
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com

echo "🖼️  Creating Artifact Registry repository (if it doesn't exist)..."
gcloud artifacts repositories create "${ARTIFACT_REGISTRY_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for ${SERVICE_NAME}" >/dev/null 2>&1 || echo "✅ Repository '${ARTIFACT_REGISTRY_REPO}' already exists in '${REGION}'."

# --- Build Docker Image ---
echo "🏗️ Building Docker image with Cloud Build..."
# We submit the gcp-api directory to Cloud Build
gcloud builds submit "$GCP_API_DIR" --tag "$IMAGE_NAME"

# --- Deploy to Cloud Run ---
echo "🚀 Deploying to Cloud Run in ${REGION}..."
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
    --set-env-vars "CORS_ORIGINS=https://passport-validator.vercel.app"

# --- Final Output ---
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region="$REGION" --format="value(status.url)")

echo ""
echo "✅ Deployment successful!"
echo ""
echo "✅ Backend Service URL: ${SERVICE_URL}"
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