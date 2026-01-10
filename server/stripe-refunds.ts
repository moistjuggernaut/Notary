import { getStripe } from './.stripe.js'

/**
 * Refund a payment via Stripe
 * @param paymentIntentId - The Stripe payment intent ID to refund
 * @param orderId - The order ID for logging
 * @param reason - The reason for the refund
 * @returns The refund ID from Stripe
 */
export async function refundPayment(
  paymentIntentId: string,
  orderId: string,
  reason: string
): Promise<string> {
  console.log('[Refund] Initiating refund:', {
    orderId,
    paymentIntentId,
    reason,
  })

  try {
    const stripe = getStripe()
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId,
        rejectionReason: reason,
      },
    })

    console.log('[Refund] Refund successful:', {
      orderId,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    })

    return refund.id
  } catch (error) {
    console.error('[Refund] Refund failed:', {
      orderId,
      paymentIntentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw new Error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

