import { getFamilinkConfig } from './.familink.js'

export interface FamilinkRecipient {
  company: string | null
  first_name: string | null
  last_name: string
  address_1: string
  address_2: string | null
  city: string
  postal_or_zip_code: string
  state: string | null
  country_code: string
}

export interface FamilinkPhotoPayload {
  url: string
  copies: number
  format: '10x15cm' | '15x20cm'
}

export interface FamilinkOrderRequest {
  merchant_reference: string
  recipient: FamilinkRecipient
  photos: FamilinkPhotoPayload[]
}

export interface FamilinkOrderResponse {
  pk: string
  status: string
  tracking_number?: string
}

export async function createFamilinkPrintOrder(
  payload: FamilinkOrderRequest
): Promise<FamilinkOrderResponse> {
  const config = getFamilinkConfig()
  const url = `${config.baseUrl}/api/prints/external-order`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sandbox: config.sandbox,
      envelope: config.envelope,
      merchant_reference: payload.merchant_reference,
      recipient: payload.recipient,
      photos: payload.photos,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Familink error ${response.status}: ${body}`)
  }

  const data = (await response.json()) as FamilinkOrderResponse
  return data
}

export async function getFamilinkOrder(
  familinkId: string
): Promise<unknown> {
  const config = getFamilinkConfig()
  const url = `${config.baseUrl}/api/prints/external-order/${familinkId}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Token ${config.apiKey}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Familink error ${response.status}: ${body}`)
  }

  return (await response.json())
}
