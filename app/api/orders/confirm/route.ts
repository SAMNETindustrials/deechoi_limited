import { createClient } from '@/lib/supabase/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import { NextRequest, NextResponse } from 'next/server'

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

  // Normalize text for matching keywords
  const lines = fullText.split('\n').map((l) => l.trim())
  
  // Example keywords that usually precede transaction references on bank receipts/transfer screenshots
  const keywords = ['ref', 'reference', 'transaction id', 'trans id', 'session id', 'code', 'teller', 'receipt']

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase()
    for (const kw of keywords) {
      if (lineLower.includes(kw)) {
        // Check if the value is on the same line after a colon or space
        const parts = lines[i].split(/[:\s]+/)
        const lastPart = parts[parts.length - 1]
        if (lastPart && lastPart.length >= 5 && !lastPart.toLowerCase().includes(kw)) {
          return lastPart.toUpperCase()
        }
        // Otherwise check the next immediate line
        if (i + 1 < lines.length && lines[i + 1].length >= 5) {
          return lines[i + 1].toUpperCase()
        }
      }
    }
  }

  // Fallback: search for long alphanumeric token blocks (e.g. 10-20 character unique transaction hashes)
  const words = fullText.replace(/[^\w\s]/gi, '').split(/\s+/)
  const candidate = words.find((w) => w.length >= 10 && /\d/.test(w) && /[A-Z]/i.test(w))
  if (candidate) return candidate.toUpperCase()

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch the target order
    const { data: targetOrder, error: fetchError } = await supabase
      .from('store_orders')
      .select('id, transaction_reference, payment_proof_url, status')
      .eq('id', orderId)
      .single()

    if (fetchError || !targetOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let currentReference = targetOrder.transaction_reference
    let extractedRawText: string | null = null

    // 2. If no reference is saved yet, but a payment proof URL/receipt image exists, run OCR extraction via Google Vision
    if (!currentReference && targetOrder.payment_proof_url) {
      try {
        // Fetch image buffer from URL or Supabase storage bucket link
        const imageRes = await fetch(targetOrder.payment_proof_url)
        if (imageRes.ok) {
          const arrayBuffer = await imageRes.arrayBuffer()
          const inputBuffer = Buffer.from(arrayBuffer)

          // Perform Google Cloud Vision Text Detection (OCR)
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

      // Fallback reference assignment if OCR cannot parse explicit transaction code string
      if (!currentReference) {
        currentReference = targetOrder.payment_proof_url
      }
    }

    // 3. Check the dedicated 'receipt_references' table for duplicate usage across orders
    if (currentReference) {
      const { data: existingRefRecord, error: refLookupError } = await supabase
        .from('receipt_references')
        .select('order_id')
        .eq('transaction_reference', currentReference)
        .maybeSingle()

      if (refLookupError) {
        console.error('[v0] Error querying receipt_references table:', refLookupError)
      }

      if (existingRefRecord && existingRefRecord.order_id !== orderId) {
        return NextResponse.json(
          { 
            error: 'Duplicate Receipt Detected: This payment receipt or transaction reference has already been used and approved for another order. Reusing receipts is strictly prohibited.' 
          },
          { status: 400 }
        )
      }

      // Fallback check against store_orders table transaction references
      const { data: duplicateOrders, error: dupError } = await supabase
        .from('store_orders')
        .select('id, status')
        .eq('transaction_reference', currentReference)
        .neq('id', orderId)
        .in('status', ['confirmed', 'processing', 'completed', 'shipped', 'delivered'])

      if (dupError) {
        console.error('[v0] Error querying store_orders for duplicate references:', dupError)
      }

      if (duplicateOrders && duplicateOrders.length > 0) {
        return NextResponse.json(
          { 
            error: 'Duplicate Receipt Detected: This payment receipt or transaction reference has already been used and approved for another order. Reusing receipts is strictly prohibited.' 
          },
          { status: 400 }
        )
      }
    }

    // 4. Update the order with the verified transaction reference and confirm status
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

    // 5. Save the verified reference securely into the 'receipt_references' lookup table
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

    return NextResponse.json({
      message: 'Order confirmed and receipt verified successfully',
      order: data,
    })
  } catch (error) {
    console.error('[v0] Error confirming order:', error)
    return NextResponse.json(
      { error: 'Failed to confirm order' },
      { status: 500 }
    )
  }
}