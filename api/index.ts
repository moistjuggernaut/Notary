import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import sharp from 'sharp'
import { getStripe, getWebhookSecret } from '../server/.stripe.js'
import { downloadImageFromGCP, getSignedUrlForImage, uploadImageToGCP } from '../server/.gcp-storage.js'
import { validatePhoto } from '../server/photo-validator.js'
import { base64ToBuffer, bufferToBase64 } from '../server/image-preprocessor.js'
import { handleStripeWebhookEvent } from '../server/fulfillment.js'
import { authMiddleware } from '../server/auth-middleware.js'
import { approveOrder, rejectOrder } from '../server/admin-actions.js'
import { createDatabaseConnection } from '../server/database.js'
import { orderService } from '../server/order-service.js'
import { getFamilinkOrder } from '../server/familink.js'

const app = new Hono()

// Middleware
app.use('*', logger())

// Initialize Stripe
const stripe = getStripe()

// Initialize database connection
await createDatabaseConnection();

// Validation schemas
const ValidationSchema = z.object({
  image: z.string().min(1, 'Image is required'),
  filename: z.string().min(1, 'Filename is required')
})

const RemoveBackgroundSchema = z.object({
  orderId: z.string().uuid()
})

// Health routes
app.get('/api/health', async (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    version: '2.0.0',
  })
})

// Photo routes
app.post('/api/photo/validate', zValidator('json', ValidationSchema), async (c) => {
  try {
    const { image } = c.req.valid('json')

    // 1. Create order and upload original image (converted to WebP lossless for archival)
    const order = await orderService.createOrder()
    const imageBuffer = base64ToBuffer(image)
    const originalWebP = await sharp(imageBuffer)
      .webp({ lossless: true })
      .toBuffer()
    const originalBase64 = bufferToBase64(originalWebP)
    await uploadImageToGCP(order.id, originalBase64, 'original.webp')
    await orderService.updateOrderStatus(order.id, 'original_uploaded')
    await orderService.updateOrderStatus(order.id, 'validation_started')

    // 2. Run photo validation directly (Cloud Vision API + preprocessing)
    const validationResult = await validatePhoto(imageBuffer)

    if (!validationResult.success) {
      await orderService.updateOrderStatus(order.id, 'validation_failed')
      return c.json({
        success: false,
        status: validationResult.status,
        reason_code: validationResult.reason_code,
        details: validationResult.details,
        orderId: order.id,
      }, 422)
    }

    // 3. Upload validated (processed) image
    if (validationResult.processedImage) {
      const processedBase64 = bufferToBase64(validationResult.processedImage)
      await uploadImageToGCP(order.id, processedBase64, 'validated.webp')
    }

    await orderService.updateOrderStatus(order.id, 'validation_completed')
    const imageUrl = await getSignedUrlForImage(order.id, 'validated.webp')

    // 4. Return results to frontend
    return c.json({
      success: true,
      status: validationResult.status,
      reason_code: validationResult.reason_code,
      orderId: order.id,
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

app.post('/api/photo/remove-background', zValidator('json', RemoveBackgroundSchema), async (c) => {
  try {
    const { orderId } = c.req.valid('json')

    const photoroomApiKey = process.env.PHOTOROOM_API_KEY
    if (!photoroomApiKey) {
      return c.json({
        success: false,
        error: 'PHOTOROOM_API_KEY is not configured'
      }, 500)
    }

    // The Remove Background API doesn't accept URLs - must download and upload as file
    // See: https://docs.photoroom.com/remove-background-api-basic-plan/can-i-use-the-url-of-an-image
    const imageBuffer = await downloadImageFromGCP(orderId, 'validated.webp')
    const formData = new FormData()
    formData.append('image_file', new Blob([new Uint8Array(imageBuffer)], { type: 'image/webp' }), 'validated.webp')

    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'Accept': 'image/png, application/json',
        'x-api-key': photoroomApiKey,
      },
      body: formData
    })

    if (!response.ok) {
      let errorMessage = `Photoroom request failed: ${response.status} ${response.statusText}`
      let errorDetails: unknown = null
      try {
        errorDetails = await response.json()
        console.error('PhotoRoom error response:', JSON.stringify(errorDetails, null, 2))
        if (typeof errorDetails === 'object' && errorDetails !== null) {
          const details = errorDetails as Record<string, unknown>
          if (details.error && typeof details.error === 'object') {
            const error = details.error as Record<string, unknown>
            if (error.message) errorMessage = String(error.message)
          }
          if (details.message) errorMessage = String(details.message)
        }
      } catch {
        console.error('PhotoRoom returned non-JSON error response')
      }

      return c.json({ success: false, error: errorMessage, details: errorDetails }, 502)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('image/png')) {
      let errorMessage = 'Photoroom did not return a PNG image'
      try {
        const json = await response.json()
        if (json?.error?.message) errorMessage = json.error.message
        if (json?.message) errorMessage = json.message
      } catch { /* ignore */ }

      return c.json({ success: false, error: errorMessage }, 502)
    }

    const pngBase64 = Buffer.from(await response.arrayBuffer()).toString('base64')
    const result = await uploadImageToGCP(orderId, pngBase64, 'validated_bg_removed.png')

    return c.json({
      success: true,
      orderId,
      imageUrl: result.imageUrl,
    })
  } catch (error) {
    console.error('Remove background error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Background removal failed'
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

    const order = await orderService.getOrderById(orderId)

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (order.status !== 'validation_completed') {
      return c.json({ error: 'Order is not in a valid state for checkout' }, 400)
    }

    await orderService.updateOrderStatus(order.id, 'checkout_started')

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
      client_reference_id: order.id,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'eur',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 4,
              },
            },
          },
        }],
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

    await handleStripeWebhookEvent(event).catch((err) => {
      console.error('Fulfillment error:', err)
    })

    return c.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ error: 'Webhook signature verification failed' }, 400)
  }
})

// Admin routes (protected)
app.get('/api/admin/orders', authMiddleware, async (c) => {
  try {    
    const orders = await orderService.getOrdersByStatus('checkout_completed')

    // Add image URLs to each order
    const ordersWithImages = await Promise.all(
      orders.map(async (order) => {
        try {
          const imageUrl = await getSignedUrlForImage(order.id, 'validated.webp')
          return { ...order, imageUrl }
        } catch (error) {
          console.error(`Failed to get image URL for order ${order.id}:`, error)
          return { ...order, imageUrl: null }
        }
      })
    )

    return c.json({ 
      success: true,
      orders: ordersWithImages 
    })
  } catch (error) {
    console.error('Admin orders list error:', error)
    return c.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders' 
    }, 500)
  }
})

app.post('/api/admin/orders/:orderId/approve', authMiddleware, async (c) => {
  try {
    const orderId = c.req.param('orderId')
    
    await approveOrder(orderId)
    
    return c.json({ 
      success: true,
      message: 'Order approved and sent to printer' 
    })
  } catch (error) {
    console.error('Admin approve error:', error)
    return c.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve order' 
    }, 500)
  }
})

const RejectOrderSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required')
})

app.post('/api/admin/orders/:orderId/reject', authMiddleware, zValidator('json', RejectOrderSchema), async (c) => {
  try {
    const orderId = c.req.param('orderId')
    const { reason } = c.req.valid('json')
    
    await rejectOrder(orderId, reason)
    
    return c.json({ 
      success: true,
      message: 'Order rejected and refunded' 
    })
  } catch (error) {
    console.error('Admin reject error:', error)
    return c.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject order' 
    }, 500)
  }
})

app.get('/api/admin/familink/:orderId', authMiddleware, async (c) => {
  try {
    const orderId = c.req.param('orderId')

    const order = await orderService.getOrderById(orderId)

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (!order.familinkId) {
      return c.json({ error: 'Order has no Familink ID' }, 400)
    }

    const familinkOrder = await getFamilinkOrder(order.familinkId)
    
    return c.json({ 
      success: true,
      data: familinkOrder 
    })
  } catch (error) {
    console.error('Familink order fetch error:', error)
    return c.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Familink order' 
    }, 500)
  }
})

export default app
