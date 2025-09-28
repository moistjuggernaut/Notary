import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getStripe, getWebhookSecret } from './lib/.stripe.js'
import { getSignedUrlForImage, uploadImageToGCP } from './lib/.gcp-storage.js'
import { triggerGCPRun } from './lib/.gcp-run.js'
import { handleStripeWebhookEvent } from './lib/fulfillment.js'

const app = new Hono()

// Middleware
app.use('*', logger())

// Initialize Stripe
const stripe = getStripe()

// Validation schemas
const QuickCheckSchema = z.object({
  image: z.string().min(1, 'Image is required'),
  filename: z.string().min(1, 'Filename is required')
})

const ValidationSchema = z.object({
  orderId: z.string().uuid()
})

// Health routes
app.get('/api/health', async (c) => {
  const gcpResponse = await triggerGCPRun({
    eventType: 'health',
  })

  if (!gcpResponse.success) {
    return c.json({
      success: false,
      error: gcpResponse.error || 'GCP processing failed'
    }, 500)
  }

  return c.json({
    success: true,
    data: gcpResponse.data,
  })
})

// Photo routes
app.post('/api/photo/quick-check', zValidator('json', QuickCheckSchema), async (c) => {
  try {
    const { image } = c.req.valid('json')
    
    // 1. Upload image to GCP storage
    const uploadResult = await uploadImageToGCP(image, 'original.jpg')
    
    // 2. Trigger GCP Run for quick check
    const gcpResponse = await triggerGCPRun({
      eventType: 'quick-check',
      orderId: uploadResult.orderId,
    })
    
    if (!gcpResponse.success) {
      return c.json({ 
        success: false, 
        error: gcpResponse.error || 'GCP processing failed' 
      }, 500)
    }
    
    // 3. Return results to frontend
    return c.json({
      success: true,
      faceCount: gcpResponse.data.face_count,
      message: gcpResponse.data.message,
      imageUrl: uploadResult.imageUrl,
      orderId: uploadResult.orderId,
    })
  } catch (error) {
    console.error('Quick check error:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Quick check failed' 
    }, 500)
  }
})

app.post('/api/photo/validate', zValidator('json', ValidationSchema), async (c) => {
  try {
    // 1. Get orderId from request
    const { orderId } = c.req.valid('json')

    // 2. Trigger GCP Run for full validation
    const gcpResponse = await triggerGCPRun({
      eventType: 'validate-photo',
      orderId: orderId,
    })
    
    if (!gcpResponse.success) {
      return c.json({ 
        success: false, 
        error: gcpResponse.error || 'GCP processing failed' 
      }, 500)
    }

    const imageUrl = await getSignedUrlForImage(orderId, 'validated.jpg')

    
    // 3. Return results to frontend
    return c.json({
      success: true,
      recommendation: gcpResponse.data.recommendation,
      logs: gcpResponse.data.logs,
      orderId: orderId,
      imageUrl: imageUrl,
    })
  } catch (error) {
    console.error('Validation error:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Validation failed' 
    }, 500)
  }
})

// Stripe routes
app.post('/api/stripe/create-checkout-session', async (c) => {
  // Check if Stripe is configured
  try {
    const orderId = c.req.query('orderId')

    if (!orderId) {
      return c.json({ error: 'Order ID is required' }, 400)
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_PUBLIC_BASE_URL}/checkout/success?success=true`,
      cancel_url: `${process.env.APP_PUBLIC_BASE_URL}/checkout/cancel?canceled=true`,
      allow_promotion_codes: true,
      automatic_tax: { enabled: false },
      client_reference_id: orderId,
      shipping_address_collection: {
        allowed_countries: ['BE', 'NL', 'DE'],
      },
    })

    return c.redirect(session.url!, 303)
  } catch (error) {
    console.error('Stripe session error:', error)
    return c.json({ 
      error: "Stripe error", 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

app.post('/api/stripe/webhook', async (c) => {
  const signature = c.req.header('stripe-signature')
  const body = await c.req.text()

  if (!signature) {
    return c.json({ error: 'No signature provided' }, 400)
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      getWebhookSecret()
    )

    handleStripeWebhookEvent(event).catch((err) => {
      console.error('Fulfillment error:', err)
    })

    return c.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ error: 'Webhook signature verification failed' }, 400)
  }
})

export default app
