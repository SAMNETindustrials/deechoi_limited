// app/api/validate-receipt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import vision from '@google-cloud/vision'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Initialize Supabase Server Client for backend operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables.')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Initialize Cloud Vision Client with environment credentials
function getVisionClient() {
  const clientEmail = process.env.GOOGLE_VISION_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_VISION_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const projectId = process.env.GOOGLE_VISION_PROJECT_ID

  if (!clientEmail || !privateKey) {
    // Local development fallback if GOOGLE_APPLICATION_CREDENTIALS path is used
    return new vision.ImageAnnotatorClient()
  }

  return new vision.ImageAnnotatorClient({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const expectedAmount = Number(formData.get('expectedAmount'))
    const expectedAccount = (formData.get('expectedAccount') as string) || '1312120060'

    if (!file) {
      return NextResponse.json(
        { valid: false, message: 'No receipt file provided for scanning.' },
        { status: 400 }
      )
    }

    // Convert file to Buffer for Google Vision
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const client = getVisionClient()

    // Run Google Cloud Vision Document Text Detection (Optimized for receipts/documents)
    const [result] = await client.documentTextDetection({
      image: { content: buffer },
    })

    const fullText = result.fullTextAnnotation?.text || ''

    if (!fullText.trim()) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Unable to detect legible text on this receipt. Please upload a clearer image or PDF.',
        },
        { status: 422 }
      )
    }

    // Run verification checks
    const verification = verifyReceiptDetails(fullText, expectedAmount, expectedAccount)

    if (!verification.valid) {
      return NextResponse.json(
        { valid: false, message: verification.reason },
        { status: 422 }
      )
    }

    const supabase = getSupabaseClient()
    const reference = verification.reference!

    // 1. Check if reference has already been used in your database to prevent receipt reuse
    const { data: existingReceipt, error: searchError } = await supabase
      .from('verified_receipts')
      .select('reference')
      .eq('reference', reference)
      .maybeSingle()

    if (searchError) {
      console.error('Supabase Query Error:', searchError)
    }

    if (existingReceipt) {
      return NextResponse.json(
        { valid: false, message: 'This receipt reference has already been used.' },
        { status: 422 }
      )
    }

    // 2. Insert the newly verified reference to lock it against duplicate uploads
    const { error: insertError } = await supabase
      .from('verified_receipts')
      .insert([
        {
          reference: reference,
          amount: verification.amount,
          account: expectedAccount,
          verified_at: new Date().toISOString(),
        },
      ])

    if (insertError) {
      // Handles race conditions if two identical receipts are uploaded at the exact same millisecond
      if (insertError.code === '23505') {
        return NextResponse.json(
          { valid: false, message: 'This receipt reference has already been used.' },
          { status: 422 }
        )
      }
      console.error('Supabase Insert Error:', insertError)
    }

    return NextResponse.json({
      valid: true,
      reference: reference,
      extractedAmount: verification.amount,
      message: 'Receipt verified successfully.',
    })
  } catch (error: any) {
    console.error('Receipt Validation Server Error:', error)
    return NextResponse.json(
      {
        valid: false,
        message: error.message || 'Receipt scanner failed to process the image.',
      },
      { status: 500 }
    )
  }
}

// Receipt Validation Rules
function verifyReceiptDetails(
  rawText: string,
  expectedAmount: number,
  expectedAccount: string
): { valid: boolean; reason?: string; reference?: string; amount?: number } {
  // Normalize text spacing and commas for robust analysis
  const text = rawText.replace(/,/g, '') 

  // 1. Flexible Amount Check: Matches amounts with optional commas, currency symbols, and decimals
  const escapedAmount = expectedAmount.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const amountRegex = new RegExp(`(?:₦|ngn|naira|amt|amount|paid|total|sum)?\\s*${escapedAmount}(?:\\.\\d{1,2})?\\b`, 'i')
  const hasMatchingAmount = amountRegex.test(text)

  if (!hasMatchingAmount) {
    return {
      valid: false,
      reason: `Amount mismatch: Receipt does not show the required total of ₦${expectedAmount.toLocaleString()}.`,
    }
  }

  // 2. Enhanced Transaction Reference / Session ID Check
  const refRegex = /(?:ref(?:erence)?|session\s*id|trans(?:action)?\s*id|stan|fip\s*ref|code|receipt|trx|payment)[:\s#]*([a-zA-Z0-9_\-/]{6,40})/i
  let refMatch = rawText.match(refRegex)

  let extractedReference = refMatch ? refMatch[1].trim() : undefined

  // Fallback: Scan for long alphanumeric/dashed blocks typical of transaction references if label is missing
  if (!extractedReference) {
    const genericTokenRegex = /\b([A-Z0-9]{10,35}|[0-9]{10,25}-[A-Z0-9]+)\b/i
    const tokenMatch = text.match(genericTokenRegex)
    if (tokenMatch) {
      extractedReference = tokenMatch[1].trim()
    }
  }

  if (!extractedReference) {
    return {
      valid: false,
      reason: 'Transaction Reference or Session ID not found. Ensure the receipt is complete.',
    }
  }

  // 3. Flexible Date & Time Stamps Check
  const dateRegex = /(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})|(?:\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/i
  const timeRegex = /\b(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s*[ap]m)?\b/i

  const hasDate = dateRegex.test(rawText)
  const hasTime = timeRegex.test(rawText)

  if (!hasDate && !hasTime) {
    return {
      valid: false,
      reason: 'Receipt is missing transaction date or timestamp details.',
    }
  }

  // 4. Beneficiary Account & Entity Verification
  const cleanAccount = expectedAccount.replace(/\s+/g, '')
  const lowerRawText = rawText.toLowerCase()
  
  const hasAccountOrName =
    text.includes(cleanAccount) ||
    lowerRawText.includes('de-echoi') ||
    lowerRawText.includes('deechoi') ||
    lowerRawText.includes('zenith')

  if (!hasAccountOrName) {
    return {
      valid: false,
      reason: `Beneficiary account ${expectedAccount} or company identifier was not found on the receipt.`,
    }
  }

  return {
    valid: true,
    reference: extractedReference,
    amount: expectedAmount,
  }
}