import { createClient } from '@/lib/supabase/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import { NextRequest, NextResponse } from 'next/server'
import { sendCustomerInvoiceEmail } from '@/lib/email'

// Initialize Google Cloud Vision OCR Client with explicit service account credentials
const visionClient = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_VISION_PROJECT_ID || 'deechoi-limited',
  credentials: {
    client_email: process.env.GOOGLE_VISION_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_VISION_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
})

/**
 * Helper function to extract potential transaction reference codes from receipt text.
 * Looks for common patterns (e.g., alphanumeric strings, reference numbers, or numeric sequences).
 */
function extractReferenceFromText(fullText: string): string | null {
  if (!fullText) return null

  const lines = fullText.split('\n').map((l) => l.trim())
  const keywords = ['ref', 'reference', 'transaction id', 'trans id', 'session id', 'code', 'teller', 'receipt']

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase()
    for (const kw of keywords) {
      if (lineLower.includes(kw)) {
        const parts = lines[i].split(/[:\s]+/)
        const lastPart = parts[parts.length - 1]
        if (lastPart && lastPart.length >= 5 && !lastPart.toLowerCase().includes(kw)) {
          return lastPart.toUpperCase()
        }
        if (i + 1 < lines.length && lines[i + 1].length >= 5) {
          return lines[i + 1].toUpperCase()
        }
      }
    }
  }

  const words = fullText.replace(/[^\w\s]/gi, '').split(/\s+/)
  const candidate = words.find((w) => w.length >= 10 && /\d/.test(w) && /[A-Z]/i.test(w))
  if (candidate) return candidate.toUpperCase()

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, resend } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch the target order with all customer & financial details
    const { data: targetOrder, error: fetchError } = await supabase
      .from('store_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !targetOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let updatedOrder = targetOrder

    // If this is not a pure resend request, perform OCR verification and confirmation
    if (!resend) {
      let currentReference = targetOrder.transaction_reference
      let extractedRawText: string | null = null

      if (!currentReference && targetOrder.payment_proof_url) {
        try {
          const imageRes = await fetch(targetOrder.payment_proof_url)
          if (imageRes.ok) {
            const arrayBuffer = await imageRes.arrayBuffer()
            const inputBuffer = Buffer.from(arrayBuffer)

            const [result] = await visionClient.textDetection({
              image: { content: inputBuffer },
            })
            
            const detections = result.textAnnotations
            if (detections && detections.length > 0 && detections[0].description) {
              extractedRawText = detections[0].description
              const parsedRef = extractReferenceFromText(extractedRawText)

              if (parsedRef) {
                currentReference = parsedRef
              }
            }
          }
        } catch (ocrErr) {
          console.error('[v0] Google Vision OCR processing warning:', ocrErr)
        }

        if (!currentReference) {
          currentReference = targetOrder.payment_proof_url
        }
      }

      if (currentReference) {
        const { data: existingRefRecord, error: refLookupError } = await supabase
          .from('receipt_references')
          .select('order_id')
          .eq('transaction_reference', currentReference)
          .maybeSingle()

        if (existingRefRecord && existingRefRecord.order_id !== orderId) {
          return NextResponse.json(
            { 
              error: 'Duplicate Receipt Detected: This payment receipt or transaction reference has already been used and approved for another order. Reusing receipts is strictly prohibited.' 
            },
            { status: 400 }
          )
        }

        const { data: duplicateOrders } = await supabase
          .from('store_orders')
          .select('id, status')
          .eq('transaction_reference', currentReference)
          .neq('id', orderId)
          .in('status', ['confirmed', 'processing', 'completed', 'shipped', 'delivered'])

        if (duplicateOrders && duplicateOrders.length > 0) {
          return NextResponse.json(
            { 
              error: 'Duplicate Receipt Detected: This payment receipt or transaction reference has already been used and approved for another order. Reusing receipts is strictly prohibited.' 
            },
            { status: 400 }
          )
        }
      }

      const { data, error } = await supabase
        .from('store_orders')
        .update({
          status: 'confirmed',
          transaction_reference: currentReference,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      updatedOrder = data

      if (currentReference) {
        await supabase
          .from('receipt_references')
          .upsert(
            {
              order_id: orderId,
              transaction_reference: currentReference,
              receipt_url: targetOrder.payment_proof_url,
              extracted_text: extractedRawText,
            },
            { onConflict: 'transaction_reference' }
          )
      }
    }

    // 2. Prepare receipt items payload for email dispatch
    let formattedItems: Array<{ item_name: string; unit: string; quantity: number; unit_price: number }> = []
    
    if (Array.isArray(updatedOrder.items) && updatedOrder.items.length > 0) {
      formattedItems = updatedOrder.items.map((it: any) => ({
        item_name: it.name || it.item_name || 'Item',
        unit: it.unit || 'pcs',
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.price || it.unit_price || 0),
      }))
    } else {
      formattedItems = [{
        item_name: 'Standard Food / Order Selection',
        unit: 'unit',
        quantity: 1,
        unit_price: Number(updatedOrder.total_amount || updatedOrder.total || 0),
      }]
    }

    const customerEmail = updatedOrder.customer_email || updatedOrder.email
    let emailResult = { success: true }

    if (customerEmail) {
      const receiptPayload = {
        receipt_number: `RCP-${String(updatedOrder.id).slice(0, 8).toUpperCase()}`,
        customer_name: updatedOrder.customer_name || updatedOrder.name || 'Valued Customer',
        customer_email: customerEmail,
        customer_phone: updatedOrder.customer_phone || updatedOrder.phone || 'N/A',
        customer_address: updatedOrder.delivery_address || 'N/A',
        subtotal: Number(updatedOrder.total_amount || updatedOrder.total || 0),
        vat_amount: 0,
        discount_amount: 0,
        total_amount: Number(updatedOrder.total_amount || updatedOrder.total || 0),
        notes: `Order Confirmed & Verified. Payment Ref: ${updatedOrder.transaction_reference || 'N/A'}`,
        created_at: updatedOrder.created_at || new Date().toISOString(),
        items: formattedItems,
      }

      emailResult = await sendCustomerInvoiceEmail(receiptPayload)
    }

    return NextResponse.json({
      message: resend 
        ? 'Order invoice receipt successfully resent to client email' 
        : 'Order confirmed and receipt emailed successfully',
      order: updatedOrder,
      emailSent: emailResult.success,
    })
  } catch (error) {
    console.error('[v0] Error confirming/resending order invoice:', error)
    return NextResponse.json(
      { error: 'Failed to process order confirmation/invoice email' },
      { status: 500 }
    )
  }
}