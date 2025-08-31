import { Storage } from '@google-cloud/storage';
import { getVercelOidcToken } from '@vercel/functions/oidc';
import { ExternalAccountClient } from 'google-auth-library';
 
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER;
const GCP_SERVICE_ACCOUNT_EMAIL = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
const GCP_WORKLOAD_IDENTITY_POOL_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
const GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;

// Initialize the External Account Client
const authClient = ExternalAccountClient.fromJSON({
  type: 'external_account',
  audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`,
  subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
  token_url: 'https://sts.googleapis.com/v1/token',
  service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
  subject_token_supplier: {
    // Use the Vercel OIDC token as the subject token
    getSubjectToken: getVercelOidcToken,
  },
});

if (!authClient) {
  throw new Error('Failed to initialize External Account Client');
}

// Initialize GCP Storage
const storage = new Storage({
  authClient: authClient,
  projectId: GCP_PROJECT_ID,
});

const bucketName = process.env.GCP_STORAGE_BUCKET || 'baby-picture-validator';

export interface UploadResult {
  orderId: string;
  imageUrl: string;
}

export async function uploadImageToGCP(base64Image: string, filename: string): Promise<UploadResult> {
  try {
    // Generate UUID for this upload
    const orderId = crypto.randomUUID();
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Create file path with UUID
    const filePath = `${orderId}/${filename}`;
    
    // Upload to GCP Storage
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg', // Default to JPEG, could be made dynamic
      },
    });
    
    // Generate signed URL for GCP Run to access
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    
    return {
      orderId,
      imageUrl: signedUrl,
    };
  } catch (error) {
    console.error('Failed to upload image to GCP:', error);
    throw new Error('Failed to upload image to storage');
  }
}

export async function getSignedUrlForImage(orderId: string, filename: string): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(`${orderId}/${filename}`);
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return signedUrl;
}
