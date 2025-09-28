import Stripe from 'stripe'
import { getSignedUrlForImage } from './.gcp-storage.js'
import { createFamilinkPrintOrder } from './familink.js'
import { getFamilinkConfig } from './.familink.js'

interface ShippingMetadata {
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

function parseShippingMetadata(session: Stripe.Checkout.Session): ShippingMetadata | null {
  const shippingJson = session.metadata?.shipping
  if (!shippingJson) {
    return null
  }

  try {
    return JSON.parse(shippingJson) as ShippingMetadata
  } catch (error) {
    console.error('[Fulfillment] Failed to parse shipping metadata JSON.', error)
    return null
  }
}

export async function handleCheckoutSessionFulfillment(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.client_reference_id ?? session.metadata?.orderId

  if (!orderId) {
    console.warn('[Fulfillment] Skipping session without order reference.', session.id)
    return
  }

  if (session.payment_status === 'unpaid') {
    console.info('[Fulfillment] Payment still pending, skipping for now.', {
      sessionId: session.id,
      orderId,
      paymentStatus: session.payment_status,
    })
    return
  }

  const shipping = parseShippingMetadata(session)

  if (!shipping) {
    console.warn('[Fulfillment] Missing shipping metadata; Familink order skipped.', orderId)
    return
  }

  console.log('[Fulfillment] Creating Familink order.', {
    sessionId: session.id,
    orderId,
    paymentStatus: session.payment_status,
  })

  const validatedPhotoUrl = await getSignedUrlForImage(orderId, 'validated-print.jpg')

  await createFamilinkPrintOrder({
    merchant_reference: orderId,
    recipient: {
      first_name: shipping.first_name,
      last_name: shipping.last_name,
      address_1: shipping.address_1,
      address_2: shipping.address_2,
      city: shipping.city,
      postal_or_zip_code: shipping.postal_or_zip_code,
      state: shipping.state,
      country_code: shipping.country_code,
      email: shipping.email,
      phone: shipping.phone,
    },
    photos: [
      {
        url: validatedPhotoUrl,
        copies: 1,
        format: '10x15cm',
      },
    ],
  })
}

/**
 * Dispatches incoming Stripe events to the appropriate fulfillment handler.
 */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log('[Fulfillment] Handling Stripe event.', {
    eventType: event.type,
    eventId: event.id,
  })

    switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('[Fulfillment] Handling checkout session fulfillment.', {
        sessionId: session.id,
        sessionStatus: session.status,
      })
      await handleCheckoutSessionFulfillment(session)
      break
    }
    default:
      console.log(`[Fulfillment] Ignoring unsupported Stripe event: ${event.type}`)
  }
}
