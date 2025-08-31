const serviceUrl = process.env.GCP_API_URL

export interface GCPRunRequest {
  eventType: 'quick-check' | 'validate-photo' | 'health';
  orderId?: string;
}

export interface GCPRunResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function triggerGCPRun(request: GCPRunRequest): Promise<GCPRunResponse> {
  try {
    // Make request to GCP Run service
    const response = await fetch(`${serviceUrl}/${request.eventType}${request.orderId ? `?orderId=${request.orderId}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GCP_RUN_AUTH_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`GCP Run request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to trigger GCP Run:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
