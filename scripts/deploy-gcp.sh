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

# Order image storage configuration
STORAGE_BUCKET_NAME="${SERVICE_NAME}-order-pictures"
STORAGE_LOCATION="europe-west1"

# Model storage configuration (Cloud Storage FUSE mount)
MODEL_BUCKET_NAME="${SERVICE_NAME}-models"
MODEL_VOLUME_NAME="model-storage"
MODEL_MOUNT_TARGET="/gcs"

# Path for the primary InsightFace model
BUFFALO_RELATIVE_PATH="models/buffalo_l"
BUFFALO_MODEL_PATH="${MODEL_MOUNT_TARGET}/${BUFFALO_RELATIVE_PATH}"

# Path for the U2Net model used by rembg
U2NET_RELATIVE_PATH="models/u2net.onnx"
U2NET_MODEL_PATH="${MODEL_MOUNT_TARGET}/${U2NET_RELATIVE_PATH}"

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
if gcloud artifacts repositories describe "${ARTIFACT_REGISTRY_REPO}" --location="${REGION}" >/dev/null 2>&1; then
    echo "✅ Repository '${ARTIFACT_REGISTRY_REPO}' already exists"
else
    echo "🖼️  Creating Artifact Registry repository..."
    gcloud artifacts repositories create "${ARTIFACT_REGISTRY_REPO}" \
        --repository-format=docker \
        --location="${REGION}" \
        --description="Docker repository for ${SERVICE_NAME}"
    echo "✅ Repository '${ARTIFACT_REGISTRY_REPO}' created successfully"
fi

# --- Google Cloud Storage Setup (Orders) ---
echo "🗄️  Setting up Google Cloud Storage for order assets..."

# Create storage bucket (if it doesn't exist)
echo "📦 Creating storage bucket (if it doesn't exist): ${STORAGE_BUCKET_NAME}"
if gcloud storage buckets describe "gs://${STORAGE_BUCKET_NAME}" >/dev/null 2>&1; then
    echo "✅ Bucket '${STORAGE_BUCKET_NAME}' already exists"
else
    echo "🪣 Creating storage bucket..."
    gcloud storage buckets create "gs://${STORAGE_BUCKET_NAME}" \
        --location="${STORAGE_LOCATION}" \
        --uniform-bucket-level-access \
        --public-access-prevention \
        --project="${PROJECT_ID}"
    echo "✅ Bucket '${STORAGE_BUCKET_NAME}' created successfully"
fi

# Configure CORS for the bucket to allow frontend access
echo "🌐 Configuring CORS settings for frontend access..."
gcloud storage buckets update "gs://${STORAGE_BUCKET_NAME}" \
    --cors-file="scripts/bucket-cors-${STAGE}.json"

# --- Cloud Storage Setup (Models) ---
echo "🧠 Setting up dedicated Cloud Storage bucket for ML models..."
if gcloud storage buckets describe "gs://${MODEL_BUCKET_NAME}" >/dev/null 2>&1; then
    echo "✅ Model bucket '${MODEL_BUCKET_NAME}' already exists"
else
    echo "🪣 Creating model storage bucket..."
    gcloud storage buckets create "gs://${MODEL_BUCKET_NAME}" \
        --location="${STORAGE_LOCATION}" \
        --uniform-bucket-level-access \
        --public-access-prevention \
        --project="${PROJECT_ID}"
    echo "✅ Model bucket '${MODEL_BUCKET_NAME}' created successfully"
fi

# --- Build Docker Image ---
echo "🏗️ Building Docker image with Cloud Build..."
# We submit the gcp-api directory to Cloud Build
gcloud builds submit "$GCP_API_DIR" --tag "$IMAGE_NAME"

# --- Configure IAM Permissions ---
echo "🔐 Configuring IAM permissions for storage access..."

# Create a dedicated service account for this specific service
SERVICE_ACCOUNT_NAME="validator-cloud-run-sa-${STAGE}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "👤 Creating dedicated service account (if it doesn't exist): ${SERVICE_ACCOUNT_NAME}"
if gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" >/dev/null 2>&1; then
    echo "✅ Service account '${SERVICE_ACCOUNT_NAME}' already exists"
else
    gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
        --display-name="Service account for ${SERVICE_NAME}" \
        --description="Dedicated service account for ${SERVICE_NAME} with minimal storage permissions"
    echo "✅ Service account '${SERVICE_ACCOUNT_NAME}' created successfully"
    echo "⏳ Waiting for service account propagation..."
    sleep 10
fi

# Grant minimal storage permissions - only for the specific bucket
echo "🔑 Granting minimal storage permissions for bucket: ${STORAGE_BUCKET_NAME}"
# roles/storage.objectViewer
if gcloud storage buckets get-iam-policy "gs://${STORAGE_BUCKET_NAME}" --format=json | grep -q "\"roles/storage.objectViewer\"" && \
   gcloud storage buckets get-iam-policy "gs://${STORAGE_BUCKET_NAME}" --format=json | grep -q "serviceAccount:${SERVICE_ACCOUNT_EMAIL}"; then
    echo "✅ Viewer binding already exists for ${SERVICE_ACCOUNT_EMAIL} on bucket ${STORAGE_BUCKET_NAME}"
else
    gcloud storage buckets add-iam-policy-binding "gs://${STORAGE_BUCKET_NAME}" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="roles/storage.objectViewer"
    echo "✅ Added viewer binding for ${SERVICE_ACCOUNT_EMAIL} on bucket ${STORAGE_BUCKET_NAME}"
fi

# roles/storage.objectCreator
if gcloud storage buckets get-iam-policy "gs://${STORAGE_BUCKET_NAME}" --format=json | grep -q "\"roles/storage.objectCreator\"" && \
   gcloud storage buckets get-iam-policy "gs://${STORAGE_BUCKET_NAME}" --format=json | grep -q "serviceAccount:${SERVICE_ACCOUNT_EMAIL}"; then
    echo "✅ Creator binding already exists for ${SERVICE_ACCOUNT_EMAIL} on bucket ${STORAGE_BUCKET_NAME}"
else
    gcloud storage buckets add-iam-policy-binding "gs://${STORAGE_BUCKET_NAME}" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="roles/storage.objectCreator"
    echo "✅ Added creator binding for ${SERVICE_ACCOUNT_EMAIL} on bucket ${STORAGE_BUCKET_NAME}"
fi

# Model bucket access for Cloud Storage FUSE
echo "🔑 Granting read access to model bucket: ${MODEL_BUCKET_NAME}"
if gcloud storage buckets get-iam-policy "gs://${MODEL_BUCKET_NAME}" --format=json | grep -q "serviceAccount:${SERVICE_ACCOUNT_EMAIL}"; then
    echo "✅ Service account already has access to model bucket"
else
    gcloud storage buckets add-iam-policy-binding "gs://${MODEL_BUCKET_NAME}" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="roles/storage.objectViewer"
    echo "✅ Granted service account object viewer role on model bucket"
fi

# Grant roles/iam.serviceAccountTokenCreator (if not already bound)
if gcloud projects get-iam-policy "${PROJECT_ID}" \
    --flatten="bindings[].members" \
    --filter="bindings.role=roles/iam.serviceAccountTokenCreator AND bindings.members=serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --format="value(bindings.role)" | grep -q "roles/iam.serviceAccountTokenCreator"; then
    echo "✅ Project binding roles/iam.serviceAccountTokenCreator already exists for ${SERVICE_ACCOUNT_EMAIL}"
else
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="roles/iam.serviceAccountTokenCreator"
    echo "✅ Added project binding roles/iam.serviceAccountTokenCreator for ${SERVICE_ACCOUNT_EMAIL}"
fi

# --- Deploy to Cloud Run ---
echo "🚀 Deploying to Cloud Run in ${REGION}..."

# Deploy the service first
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 8Gi \
    --cpu 4 \
    --timeout 300s \
    --concurrency 80 \
    --max-instances 10 \
    --service-account="${SERVICE_ACCOUNT_EMAIL}" \
    --set-env-vars "GCS_BUCKET_NAME=${STORAGE_BUCKET_NAME},BUFFALO_MODEL_PATH=${BUFFALO_MODEL_PATH},U2NET_MODEL_PATH=${U2NET_MODEL_PATH}" \
    --add-volume "name=${MODEL_VOLUME_NAME},type=cloud-storage,bucket=${MODEL_BUCKET_NAME}" \
    --add-mount "path=${MODEL_MOUNT_TARGET},volume=${MODEL_VOLUME_NAME}"

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