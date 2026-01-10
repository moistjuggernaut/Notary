const DEFAULT_BASE_URL = 'https://web.familinkframe.com'

export interface FamilinkConfig {
  apiKey: string
  baseUrl: string
  sandbox: boolean
  envelope: 'auto' | 'with_tracking'
}

export function validateFamilinkConfig(): void {
  if (!process.env.FAMILINK_API_KEY) {
    throw new Error('FAMILINK_API_KEY is required for Familink integration')
  }
}

export function getFamilinkConfig(): FamilinkConfig {
  validateFamilinkConfig()

  const apiKey = process.env.FAMILINK_API_KEY!
  const baseUrl = process.env.FAMILINK_BASE_URL || DEFAULT_BASE_URL
  const sandbox = process.env.FAMILINK_SANDBOX === 'true'
  const envelope = 'auto'

  return {
    apiKey,
    baseUrl,
    sandbox,
    envelope,
  }
}
