import { getFamilinkConfig } from './.familink.js'

export interface FamilinkRecipient {
  company?: string
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  postal_or_zip_code: string
  state?: string
  country_code: string
  email?: string
  phone?: string
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
  id: string
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
      enveloppe: config.envelope,
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
