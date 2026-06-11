# Monify Payment Gateway Integration Guide

## Overview

This guide explains how to integrate Monify payment gateway into the DEECHOI LIMITED food ordering system. Monify is a secure payment platform for Nigeria and is perfect for accepting payments from your customers.

---

## Prerequisites

1. **Monify Account**
   - Sign up at https://monify.ng
   - Verify your business account
   - Get your API keys (Public Key & Secret Key)

2. **Environment Variables**
   Add to `.env.local`:
   ```
   NEXT_PUBLIC_MONIFY_PUBLIC_KEY=your_public_key_here
   MONIFY_SECRET_KEY=your_secret_key_here
   ```

---

## Implementation Steps

### Step 1: Install Monify SDK

```bash
pnpm add monify-sdk
```

### Step 2: Update Cart Page (`/app/cart/page.tsx`)

Add Monify checkout initialization:

```typescript
'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useCart } from '@/lib/cart-context'

export default function CartPage() {
  const { items, total, removeItem, updateQuantity } = useCart()
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!items.length) return

    setLoading(true)

    try {
      // Initialize Monify Payment
      const handler = window.MonifyCheckout({
        key: process.env.NEXT_PUBLIC_MONIFY_PUBLIC_KEY,
        email: customerEmail,
        amount: Math.round(total * 100), // in kobo
        metadata: {
          custom_fields: [
            {
              display_name: 'Order Items',
              variable_name: 'order_items',
              value: JSON.stringify(items),
            },
          ],
        },
        onClose: () => {
          console.log('Payment window closed')
          setLoading(false)
        },
        callback: async (response) => {
          // Handle successful payment
          if (response.status === 'success') {
            // Verify payment on backend
            const verification = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: response.reference,
              }),
            })

            if (verification.ok) {
              // Create order in database
              const order = await createOrder(customerData, items)
              window.location.href = `/order-confirmation/${order.id}`
            }
          }
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment processing failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Monify Script */}
      <Script src="https://sdk.monify.ng/checkout.js" strategy="lazyOnload" />

      {/* Cart content */}
      <button onClick={handleCheckout} disabled={loading || !items.length}>
        {loading ? 'Processing...' : 'Pay with Monify'}
      </button>
    </div>
  )
}
```

### Step 3: Create Payment Verification API

Create `/app/api/verify-payment/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { reference } = await request.json()
    const supabase = await createClient()

    // Verify payment with Monify API
    const response = await fetch('https://api.monify.ng/verify/' + reference, {
      headers: {
        Authorization: `Bearer ${process.env.MONIFY_SECRET_KEY}`,
      },
    })

    const paymentData = await response.json()

    if (paymentData.status === 'success') {
      // Payment verified - safe to create order
      return new Response(JSON.stringify({ verified: true }), {
        status: 200,
      })
    }

    return new Response(JSON.stringify({ verified: false }), {
      status: 400,
    })
  } catch (error) {
    console.error('Payment verification failed:', error)
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 500,
    })
  }
}
```

### Step 4: Update Order Creation

Create `/app/api/create-order/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      paymentReference,
    } = await request.json()

    const supabase = await createClient()

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        total_amount: totalAmount,
        status: 'completed',
        payment_status: 'paid',
        stripe_payment_intent_id: paymentReference,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return new Response(JSON.stringify({ order }), { status: 200 })
  } catch (error) {
    console.error('Order creation failed:', error)
    return new Response(JSON.stringify({ error: 'Order creation failed' }), {
      status: 500,
    })
  }
}
```

---

## Monify Payment Flow

```
Customer
   ↓
[Add items to cart] → Cart stored in localStorage
   ↓
[Proceed to Checkout] → Monify popup opens
   ↓
[Customer enters card/transfer details]
   ↓
Monify processes payment
   ↓
Payment successful? → Yes → Callback triggered
   ↓
[Verify payment on backend]
   ↓
[Create order in database]
   ↓
[Redirect to confirmation page]
```

---

## Testing Monify Integration

### Test Cards (Provided by Monify)

**Successful Payment:**
- Card: 4485 4944 7120 3010
- Expiry: Any future date
- CVV: Any 3 digits

**Failed Payment:**
- Card: 4485 0000 0000 0000
- Expiry: Any future date
- CVV: Any 3 digits

### Testing in Development

1. Use Monify's test/sandbox API keys
2. Test cards above will work
3. No real money charged

### Going Live

1. Switch to production API keys
2. Real test transactions charge ₦1 (refunded immediately)
3. Then accept live customer payments

---

## Monify Dashboard Features

After payments are received:

1. **Transaction History** - View all payments
2. **Settlement** - Money transfers to your bank account
3. **Analytics** - Track sales trends
4. **Receipts** - Issue customer receipts
5. **Webhook Logs** - Monitor payment callbacks

---

## Security Considerations

### Frontend
- Never expose Secret Key
- Only use Public Key in frontend code
- Always verify payments on backend

### Backend
- Verify all payments using Secret Key
- Store payment reference in database
- Only create orders after verification
- Log all transactions

### Best Practices
- Use HTTPS only (required by Monify)
- Implement rate limiting on payment endpoints
- Monitor for fraud patterns
- Regular security audits

---

## Webhook Implementation (Optional)

For real-time payment notifications:

Create `/app/api/webhooks/monify/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-monify-signature')
    const body = await request.text()

    // Verify signature
    const hash = crypto
      .createHmac('sha256', process.env.MONIFY_SECRET_KEY!)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return new Response('Unauthorized', { status: 401 })
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const supabase = await createClient()

      // Update order status
      await supabase
        .from('orders')
        .update({ payment_status: 'confirmed' })
        .eq('stripe_payment_intent_id', event.data.reference)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}
```

---

## Troubleshooting

### Payment not processing?
- Check API keys are correct
- Verify customer email is valid
- Ensure amount is in kobo (multiply by 100)
- Check internet connection

### Payment successful but order not created?
- Verify payment on backend
- Check database connection
- Review server logs
- Contact Monify support if needed

### Missing transactions?
- Check webhook configuration
- Verify signature verification code
- Review Monify dashboard logs
- Contact Monify support

---

## Customer Communication

### Payment Confirmation Email Template
```
Hi {customer_name},

Thank you for your order!

Order Details:
- Order ID: {order_id}
- Total: ₦{amount}
- Status: Payment Received

Items Ordered:
{items_list}

Your order will be prepared and delivered shortly.

For updates, contact us at:
📞 +234 704 614 5982
📧 deechoi01@gmail.com

Best regards,
DEECHOI LIMITED Team
```

---

## Monify Documentation

For more information:
- Official Docs: https://docs.monify.ng
- API Reference: https://api-docs.monify.ng
- Support: support@monify.ng

---

## Pricing (As of 2026)

- **Transaction Fee**: 1.5% + ₦10 per transaction
- **Settlement**: Daily to your bank account
- **Minimum**: ₦100
- **Maximum**: ₦10,000,000

**Example:**
- Customer pays ₦5,000
- Your fee: ₦75 + ₦10 = ₦85
- You receive: ₦4,915

---

## Implementation Timeline

- **Phase 1** (Week 1): Setup Monify account, get API keys
- **Phase 2** (Week 2): Implement payment integration
- **Phase 3** (Week 3): Testing with test cards
- **Phase 4** (Week 4): Go live with production keys

---

## Next Steps

1. Sign up for Monify account
2. Set up your bank account for settlements
3. Get API keys from Monify dashboard
4. Implement code changes from this guide
5. Test thoroughly before going live
6. Launch with confidence!

---

**For help:**
- Email: deechoi01@gmail.com
- Phone: +234 704 614 5982

---

**Happy payments! 💳**
