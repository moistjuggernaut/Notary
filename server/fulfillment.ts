import Stripe from 'stripe'
import { orderService } from './order-service.js'


export async function handleCheckoutSessionFulfillment(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.client_reference_id ?? session.metadata?.orderId

  if (!orderId) {
    console.warn('[Fulfillment] Skipping session without order reference.', session.id)
    return
  }

  const order = await orderService.getOrderById(orderId)

  if (!order) {
    console.warn('[Fulfillment] Order not found.', orderId)
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

  // Save payment information
  await orderService.updateOrderStripeSessionId(order.id, session.id)
  if (session.payment_intent) {
    await orderService.updateOrderStripePaymentIntentId(order.id, session.payment_intent as string)
  }
  await orderService.updateOrderStatus(order.id, 'checkout_completed')

  console.log('[Fulfillment] Order marked as paid, awaiting manual review:', orderId)
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
