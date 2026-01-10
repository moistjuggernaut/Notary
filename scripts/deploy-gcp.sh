#!/bin/bash
# GCP Infrastructure Setup Script for Photo Validator
# This script sets up the GCP resources needed for the Vercel-deployed application.
# It should be run from the root of the project.

# Make sure to set the STAGE to one of the following: dev, prod
# export STAGE=dev

set -e

# --- Configuration ---
PROJECT_ID="babypicturevalidator-${STAGE}"
SERVICE_NAME="baby-picture-validator-api-${STAGE}"
REGION="europe-west1"

# Order image storage configuration
STORAGE_BUCKET_NAME="${SERVICE_NAME}-order-pictures"
STORAGE_LOCATION="europe-west1"

# Workload Identity Pool configuration (for Vercel OIDC)
WORKLOAD_IDENTITY_POOL="vercel"
WORKLOAD_IDENTITY_PROVIDER="vercel"

echo "🚀 Setting up GCP infrastructure for: ${SERVICE_NAME}"

# --- Pre-flight Checks ---
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: Google Cloud CLI ('gcloud') not found. Please install it first."
    exit 1
fi

if [ -z "$STAGE" ]; then
    echo "❌ Error: STAGE environment variable is not set."
    echo "Please set it to 'dev' or 'prod' before running this script:"
    echo "  export STAGE=dev"
    exit 1
fi

# --- GCP Setup ---
echo "📦 Setting GCP project to ${PROJECT_ID}..."
gcloud config set project $PROJECT_ID

echo "🔧 Enabling required GCP services..."
gcloud services enable \
    storage.googleapis.com \
    storage-component.googleapis.com \
    vision.googleapis.com \
    iamcredentials.googleapis.com \
    sts.googleapis.com

# --- Google Cloud Storage Setup ---
echo "🗄️  Setting up Google Cloud Storage..."

# Create storage bucket (if it doesn't exist)
echo "📦 Creating storage bucket: ${STORAGE_BUCKET_NAME}"
if gcloud storage buckets describe "gs://${STORAGE_BUCKET_NAME}" >/dev/null 2>&1; then
    echo "✅ Bucket '${STORAGE_BUCKET_NAME}' already exists"
else
    gcloud storage buckets create "gs://${STORAGE_BUCKET_NAME}" \
        --location="${STORAGE_LOCATION}" \
        --uniform-bucket-level-access \
        --public-access-prevention \
        --project="${PROJECT_ID}"
    echo "✅ Bucket '${STORAGE_BUCKET_NAME}' created successfully"
fi

# Configure CORS for the bucket
echo "🌐 Configuring CORS settings..."
gcloud storage buckets update "gs://${STORAGE_BUCKET_NAME}" \
    --cors-file="scripts/bucket-cors-${STAGE}.json"

# --- Workload Identity Federation Setup (for Vercel) ---
echo "🔐 Setting up Workload Identity Federation for Vercel..."

# Create Workload Identity Pool
echo "🏊 Creating Workload Identity Pool: ${WORKLOAD_IDENTITY_POOL}"
if gcloud iam workload-identity-pools describe "${WORKLOAD_IDENTITY_POOL}" \
    --location="global" >/dev/null 2>&1; then
    echo "✅ Workload Identity Pool '${WORKLOAD_IDENTITY_POOL}' already exists"
else
    gcloud iam workload-identity-pools create "${WORKLOAD_IDENTITY_POOL}" \
        --location="global" \
        --display-name="Vercel OIDC Pool"
    echo "✅ Workload Identity Pool '${WORKLOAD_IDENTITY_POOL}' created"
fi

# Create Workload Identity Provider
echo "🔗 Creating Workload Identity Provider: ${WORKLOAD_IDENTITY_PROVIDER}"
if gcloud iam workload-identity-pools providers describe "${WORKLOAD_IDENTITY_PROVIDER}" \
    --location="global" \
    --workload-identity-pool="${WORKLOAD_IDENTITY_POOL}" >/dev/null 2>&1; then
    echo "✅ Provider '${WORKLOAD_IDENTITY_PROVIDER}' already exists"
else
    gcloud iam workload-identity-pools providers create-oidc "${WORKLOAD_IDENTITY_PROVIDER}" \
        --location="global" \
        --workload-identity-pool="${WORKLOAD_IDENTITY_POOL}" \
        --issuer-uri="https://oidc.vercel.com" \
        --attribute-mapping="google.subject=assertion.sub"
    echo "✅ Provider '${WORKLOAD_IDENTITY_PROVIDER}' created"
fi

# --- Service Account Setup ---
echo "👤 Setting up service account for Vercel..."
VERCEL_SA_NAME="vercel"
VERCEL_SA_EMAIL="${VERCEL_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "${VERCEL_SA_EMAIL}" >/dev/null 2>&1; then
    echo "✅ Service account '${VERCEL_SA_NAME}' already exists"
else
    gcloud iam service-accounts create "${VERCEL_SA_NAME}" \
        --display-name="Vercel Service Account" \
        --description="Service account for Vercel serverless functions"
    echo "✅ Service account '${VERCEL_SA_NAME}' created"
    sleep 10  # Wait for propagation
fi

# Grant storage permissions
echo "🔑 Granting storage permissions..."
gcloud storage buckets add-iam-policy-binding "gs://${STORAGE_BUCKET_NAME}" \
    --member="serviceAccount:${VERCEL_SA_EMAIL}" \
    --role="roles/storage.objectAdmin" \
    --condition=None 2>/dev/null || true

# Grant Vision API permissions
echo "🔑 Granting Vision API permissions..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${VERCEL_SA_EMAIL}" \
    --role="roles/visionai.user" 2>/dev/null || true

# Grant token creator (for signed URLs)
echo "🔑 Granting token creator permissions..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${VERCEL_SA_EMAIL}" \
    --role="roles/iam.serviceAccountTokenCreator" 2>/dev/null || true

# Allow Workload Identity Pool to impersonate service account
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
echo "🔗 Linking Workload Identity Pool to service account..."
gcloud iam service-accounts add-iam-policy-binding "${VERCEL_SA_EMAIL}" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WORKLOAD_IDENTITY_POOL}/*" \
    --role="roles/iam.workloadIdentityUser" 2>/dev/null || true

# --- Final Output ---
echo ""
echo "✅ GCP infrastructure setup complete!"
echo ""
echo "📋 Vercel Environment Variables:"
echo "   GCP_PROJECT_ID=${PROJECT_ID}"
echo "   GCP_PROJECT_NUMBER=${PROJECT_NUMBER}"
echo "   GCP_SERVICE_ACCOUNT_EMAIL=${VERCEL_SA_EMAIL}"
echo "   GCP_WORKLOAD_IDENTITY_POOL_ID=${WORKLOAD_IDENTITY_POOL}"
echo "   GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=${WORKLOAD_IDENTITY_PROVIDER}"
echo "   GCP_STORAGE_BUCKET=${STORAGE_BUCKET_NAME}"
echo ""
echo "💡 Add these to your Vercel project settings."
echo ""
