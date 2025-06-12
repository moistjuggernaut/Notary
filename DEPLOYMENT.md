# Deployment Guide

This guide covers deploying the Baby Picture Validator in its hybrid architecture:
-   **Frontend**: React app deployed to Vercel.
-   **Backend**: Python API deployed to GCP Cloud Run.

## Prerequisites

### Required Tools
-   [Node.js](https://nodejs.org/) (v20+)
-   [Python](https://www.python.org/) (v3.12+)
-   [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
-   [Vercel CLI](https://vercel.com/docs/cli) (`npm install -g vercel`)

### Initial Setup
1.  **Clone the repository**.
2.  **Authenticate with services**:
    ```bash
    gcloud auth login
    gcloud auth application-default login
    vercel login
    ```
3.  **Set your GCP project**:
    ```bash
    gcloud config set project babypicturevalidator
    ```

---

## Local Development

The easiest way to run the entire stack locally is using the `npm` scripts.

### 1. Run the Backend (GCP API)
In a terminal, run the backend using Docker:
```bash
# This command builds the Docker image and starts the container on port 8080.
# It uses the production Dockerfile for consistency.
npm run gcp:run
```
The API will be available at `http://localhost:8080`.

### 2. Run the Frontend (Vercel)
In a second terminal, start the Vite development server:
```bash
# Install Node.js dependencies
npm install

# Create a local environment file for the frontend
echo "VITE_API_BASE_URL=http://localhost:3000" > .env.local

# Run the dev server
npm run dev
```
The frontend will be available at `http://localhost:3000`. The `vite.config.ts` is configured to proxy all `/api` requests to the running backend container at `http://localhost:8080`, mimicking the production setup.

### Running Backend Tests
You can run the Python unit and integration tests in an isolated Docker container:
```bash
npm run gcp:test
```

---

## Deployment Workflow

This project is set up for CI/CD via GitHub Actions, but manual deployment is also straightforward.

### 1. Deploy the Backend to GCP
Run the automated deployment script from the project root:
```bash
./scripts/deploy-gcp.sh
```
This script handles enabling APIs, building the image with Cloud Build, and deploying to Cloud Run.

**Important**: After deployment, the script will output the **Service URL**. Copy this URL.
Example: `https://baby-picture-validator-api-xxxxx-uc.a.run.app`

### 2. Configure the Vercel Frontend
You need to tell your Vercel project where to find the GCP backend.

1.  **Add the Environment Variable**:
    ```bash
    # Replace the placeholder with the actual URL from the previous step
    vercel env add GCP_API_URL https://your-gcp-service.run.app --prod
    ```
2.  **Link the Variable**: In your Vercel project dashboard, ensure the `GCP_API_URL` environment variable is exposed to your Production environment.

### 3. Deploy the Frontend to Vercel
With the environment variable set, deploy the frontend:
```bash
npm run deploy
```
This command runs `vercel --prod`, which builds and deploys the React application to Vercel.

---

## Troubleshooting & Monitoring

### View Backend Logs
To stream logs directly from the deployed GCP Cloud Run service:
```bash
npm run gcp:logs
```

### View Frontend Logs
Check your project's "Logs" tab in the Vercel dashboard.

### Common Issues
-   **CORS Errors**: Ensure the `GCP_API_URL` environment variable is correctly set in your Vercel project settings for the production environment.
-   **502 Bad Gateway**: This usually means the Vercel proxy can't reach the GCP backend. Check that your GCP service is running and that the URL is correct.
-   **503 Service Unavailable**: This can happen if the GCP service is starting up (cold start) or if the ML models failed to load on startup. Check the GCP logs (`npm run gcp:logs`) for critical errors. 