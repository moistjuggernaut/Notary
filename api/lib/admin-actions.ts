import { orderService } from './order-service.js'
import { getSignedUrlForImage } from './.gcp-storage.js'
import { createFamilinkPrintOrder } from './familink.js'
import { refundPayment } from './stripe-refunds.js'
import Stripe from 'stripe'
import { getStripe } from './.stripe.js'
import { Order } from './schema.js'

interface ShippingDetails {
  address: {
    city: string,
    country: string,
    line1: string,
    line2: string | null,
    postal_code: string,
    state: string | null
    },
  carrier: string | null,
  name: string,
  phone: string | null,
  tracking_number: string | null
}
/**
 * Approve an order and send it to Familink for printing
 */
export async function approveOrder(orderId: string): Promise<void> {
  console.log('[AdminActions] Approving order:', orderId)

  const order: Order | null = await orderService.getOrderById(orderId)
  
  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status !== 'checkout_completed') {
    throw new Error(`Order cannot be approved. Current status: ${order.status}`)
  }
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId!)
  const shipping_details = parseShippingDetails(session)

  if (!shipping_details) {
    throw new Error('Order missing shipping information')
  }

  try {
    // Get the validated print image
    const validatedPhotoUrl = await getSignedUrlForImage(orderId, 'validated.jpg')

    // Create Familink print order
    await createFamilinkPrintOrder({
      merchant_reference: orderId,
      recipient: {
        company: null,
        first_name: null,
        last_name: shipping_details.name,
        address_1: shipping_details.address.line1,
        address_2: shipping_details.address.line2,
        city: shipping_details.address.city,
        postal_or_zip_code: shipping_details.address.postal_code,
        state: shipping_details.address.state,
        country_code: shipping_details.address.country,
      },
      photos: [
        {
          url: validatedPhotoUrl,
          copies: 1,
          format: '10x15cm',
        },
      ],
    })

    // Update status to sent
    await orderService.updateOrderStatus(orderId, 'familink_order_created')

    console.log('[AdminActions] Order approved and sent to Familink:', orderId)
  } catch (error) {
    console.error('[AdminActions] Failed to send order to Familink:', error)
    // Mark as failed instead of reverting to checkout_completed
    await orderService.updateOrderStatus(orderId, 'familink_order_creation_failed')
    throw new Error(`Failed to send order to printer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Reject an order and initiate a refund
 */
export async function rejectOrder(orderId: string, reason: string): Promise<void> {
  console.log('[AdminActions] Rejecting order:', { orderId, reason })

  const order = await orderService.getOrderById(orderId)
  
  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status !== 'checkout_completed') {
    throw new Error(`Order cannot be rejected. Current status: ${order.status}`)
  }

  if (!order.stripePaymentIntentId) {
    throw new Error('Order missing payment information')
  }

  // Update status to rejected
  await orderService.updateOrderStatus(orderId, 'rejected')

  try {
    // Process refund
    await refundPayment(order.stripePaymentIntentId, orderId, reason)
    
    // Update status to refund succeeded
    await orderService.updateOrderStatus(orderId, 'refund_succeeded')

    console.log('[AdminActions] Order rejected and refunded:', orderId)
  } catch (error) {
    console.error('[AdminActions] Failed to refund order:', error)
    // Update status to refund failed
    await orderService.updateOrderStatus(orderId, 'refund_failed')
    throw new Error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
function parseShippingDetails(session: Stripe.Checkout.Session): ShippingDetails | null {
  const shippingDetails = session.shipping_details as ShippingDetails | null
  if (!shippingDetails) {
    console.error('[AdminActions] Failed to parse shipping details:', session)
  }
  return shippingDetails
}

