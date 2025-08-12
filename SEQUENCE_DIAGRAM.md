# Photo Validator Application Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Proxy
    participant REST_API
    participant Database
    participant GCS as Google Cloud Storage
    participant Stripe
    participant EmailService

    Note over User,EmailService: Photo Upload & Validation Flow
    User->>Frontend: Upload photo
    Frontend->>Proxy: POST /api/validate_photo (photo + filename)
    Proxy->>REST_API: Forward request
    REST_API->>REST_API: Validate photo (compliance check)
    REST_API->>Database: Create validation record (order_id, validation_status, timestamp)
    
    alt Validation Successful
        REST_API->>REST_API: Generate order ID
        REST_API->>Database: Update validation record (order_id, status: 'validated', image_urls)
        REST_API->>GCS: Store original image (order_id/original.jpg)
        REST_API->>GCS: Store validated image (order_id/validated.jpg)
        REST_API->>REST_API: Generate signed URL for validated image
        REST_API->>Proxy: Return success + signed URL + order ID
        Proxy->>Frontend: Forward response
        Frontend->>User: Show preview + "Proceed to Order" button
    else Validation Failed
        REST_API->>Database: Update validation record (order_id, status: 'failed', error_reasons)
        REST_API->>Proxy: Return error reasons
        Proxy->>Frontend: Forward error
        Frontend->>User: Show error message
    end

    Note over User,EmailService: Order Process Flow
    User->>Frontend: Click "Proceed to Order"
    Frontend->>Proxy: GET /api/order-preview (order_id)
    Proxy->>REST_API: Forward request
    REST_API->>Database: Log order preview request (order_id, timestamp)
    REST_API->>GCS: Fetch validated image (order_id/validated.jpg)
    GCS->>REST_API: Return image data
    REST_API->>REST_API: Transform image to print format
    REST_API->>GCS: Store print format image (order_id/print-format.jpg)
    REST_API->>REST_API: Generate signed URL for print format image
    REST_API->>Database: Update order with print format URL (order_id, print_format_url)
    REST_API->>Proxy: Return signed URL + order data
    Proxy->>Frontend: Forward signed URL + order data
    Frontend->>User: Show order preview screen with print format image
    User->>Frontend: Click "Order" button
    Frontend->>User: Prompt for email address
    User->>Frontend: Enter email address
    Frontend->>Proxy: POST /api/create-payment-intent (order_id, email)
    Proxy->>REST_API: Forward request
    REST_API->>Database: Create order record (order_id, email, status: 'pending_payment')
    REST_API->>Stripe: Create payment intent
    Stripe->>REST_API: Return payment intent
    REST_API->>Database: Update order with payment intent ID (order_id, payment_intent_id)
    REST_API->>Proxy: Return payment intent
    Proxy->>Frontend: Forward payment intent
    Frontend->>Stripe: Redirect to Stripe checkout
    Stripe->>User: Show payment form
    User->>Stripe: Complete payment
    
    alt Payment Successful
        Stripe->>Frontend: Payment success webhook
        Frontend->>Proxy: POST /api/payment-success (order_id, payment_id)
        Proxy->>REST_API: Forward request
        REST_API->>Database: Store order (order_id, email, payment_id, status: 'paid')
        Database->>REST_API: Order stored confirmation
        REST_API->>EmailService: Send payment confirmation email (email + order_id)
        EmailService->>User: Payment confirmation email
        REST_API->>Proxy: Return order confirmation
        Proxy->>Frontend: Forward confirmation
        Frontend->>User: Show "Payment Confirmed - Order Queued for Printing" message
    else Payment Failed
        Stripe->>Frontend: Payment failed
        Frontend->>User: Show payment error
        User->>Frontend: Retry payment
    end
```

## Batch Print Processing Flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant REST_API
    participant Database
    participant GCS as Google Cloud Storage
    participant PrintOrg as Print Organization
    participant EmailService

    Note over Scheduler,EmailService: Daily Batch Print Processing (Once per day)
    Scheduler->>REST_API: Trigger daily batch processing
    REST_API->>Database: Query pending orders (status: 'paid', not yet sent to print)
    Database->>REST_API: Return list of orders with order_id, email, payment_id
    
    loop For each pending order
        REST_API->>REST_API: Generate signed URL for print format image (order_id/print-format.jpg)
        REST_API->>PrintOrg: Submit order (order_id, print_format_image_url)
        PrintOrg->>REST_API: Order confirmation with print_reference_id
        REST_API->>Database: Update order status to 'sent_to_print' + print_reference_id
        REST_API->>EmailService: Send order confirmation email (email + order_id + print_reference_id)
        EmailService->>User: Order confirmation with tracking details
    end
    
    REST_API->>Scheduler: Batch processing complete
    Scheduler->>REST_API: Log batch summary (total orders processed)
```

## Flow Description

### 1. Photo Upload & Validation
- **User uploads photo** in the React frontend
- **Frontend sends** photo to Vercel proxy (`/api/[...path]`)
- **Proxy forwards** to Python Flask REST API (`/api/validate_photo`)
- **REST API validates** using compliance checker (face detection, size, quality, etc.)

### 2. Storage & Response
- **If validation fails**: Return error reasons to frontend
- **If validation succeeds**: 
  - Generate unique order ID (Cloud Run request ID or timestamp-UUID)
  - Upload original and validated images to Google Cloud Storage
  - Return preview image + order ID to frontend

### 3. Order Process
- **User proceeds** to order copies
- **Request order preview** from backend (`/api/order-preview`)
- **Show order preview screen** with print format image
- **User presses Order** button

### 4. Payment Flow
- **Collect email address** for order tracking
- **Forward to Stripe** for payment processing
- **If payment fails**: Return to payment screen
- **If payment succeeds**: Continue to print organization

### 5. Batch Print Processing
- **Daily scheduler** triggers batch processing
- **Query database** for all paid orders not yet sent to print
- **For each order**:
  - Generate signed URL for the already existing print format image
  - Submit to print organization (order_id + signed URL only)
  - Update order status to 'sent_to_print'
  - Send confirmation email with print reference ID

## Key Components

- **Frontend**: React + TypeScript (Vite)
- **Proxy**: Vercel serverless function
- **Backend**: Python Flask API (Cloud Run)
- **Database**: Order and validation tracking
- **Storage**: Google Cloud Storage
- **Payment**: Stripe integration
- **Email**: Email service for tracking
- **Print Service**: External print organization API
- **Scheduler**: Daily batch processing trigger

## File Structure in GCS

```
order_id/
├── original.jpg          # Original uploaded image
├── validated.jpg         # Validated image (face detection, etc.)
└── print-format.jpg      # Image formatted for printing (generated once)
```
