import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getStripe, getWebhookSecret } from './lib/.stripe.js'
import { getSignedUrlForImage, uploadImageToGCP } from './lib/.gcp-storage.js'
import { triggerGCPRun } from './lib/.gcp-run.js'
import { handleStripeWebhookEvent } from './lib/fulfillment.js'
import { authMiddleware } from './lib/auth-middleware.js'
import { approveOrder, rejectOrder } from './lib/admin-actions.js'
import { createDatabaseConnection } from './lib/database.js'
import { orderService } from './lib/order-service.js'
import { Order } from './lib/schema.js'
import { getFamilinkOrder } from './lib/familink.js'

const app = new Hono()

// Middleware
app.use('*', logger())

// Initialize Stripe
const stripe = getStripe()

// Initialize database connection
await createDatabaseConnection();

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


    const order = await orderService.createOrder()

    // 1. Upload image to GCP storage
    const uploadResult = await uploadImageToGCP(order.id, image, 'original.jpg')

    await orderService.updateOrderStatus(order.id, 'original_uploaded')
    
    // 2. Trigger GCP Run for quick check
    const gcpResponse = await triggerGCPRun({
      eventType: 'quick-check',
      orderId: order.id,
    })
    
    if (!gcpResponse.success) {
      await orderService.updateOrderStatus(order.id, 'quick_check_failed')
      return c.json({ 
        success: false, 
        error: gcpResponse.error || 'GCP processing failed' 
      }, 500)
    }
    
    await orderService.updateOrderStatus(order.id, 'quick_check_completed')

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

    const order = await orderService.getOrderById(orderId)

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    await orderService.updateOrderStatus(order.id, 'validation_started')

    // 2. Trigger GCP Run for full validation
    const gcpResponse = await triggerGCPRun({
      eventType: 'validate-photo',
      orderId: order.id,
    })
    
    if (!gcpResponse.success) {
      await orderService.updateOrderStatus(order.id, 'validation_failed')
      return c.json({ 
        success: false, 
        error: gcpResponse.error || 'GCP processing failed' 
      }, 500)
    }

    await orderService.updateOrderStatus(order.id, 'validation_completed')

    const imageUrl = await getSignedUrlForImage(order.id, 'validated.jpg')
    
    // 3. Return results to frontend - forward GCP response with added metadata
    return c.json({
      ...gcpResponse.data,
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

    handleStripeWebhookEvent(event).catch((err) => {
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
          const imageUrl = await getSignedUrlForImage(order.id, 'validated.jpg')
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
