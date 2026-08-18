// app/api/validate-receipt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import vision from '@google-cloud/vision'

export const dynamic = 'force-dynamic'

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

    return NextResponse.json({
      valid: true,
      reference: verification.reference,
      extractedAmount: verification.amount,
      message: 'Receipt verified successfully.',
    })
  } catch (error: any) {
    console.error('Google Cloud Vision Error:', error)
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
  const text = rawText.replace(/,/g, '') // remove commas to match 35000 from 35,000

  // 1. Check Amount match (exact integer/decimal match)
  const amountRegex = new RegExp(`(?:₦|ngn|naira|amt|amount|paid)?\\s*${expectedAmount}(?:\\.00)?\\b`, 'i')
  const hasMatchingAmount = amountRegex.test(text)

  if (!hasMatchingAmount) {
    return {
      valid: false,
      reason: `Amount mismatch: Receipt does not show the required total of ₦${expectedAmount.toLocaleString()}.`,
    }
  }

  // 2. Check for Transaction Reference / Session ID / Ref No
  const refRegex = /(?:ref(?:erence)?|session\s*id|trans(?:action)?\s*id|stan|fip\s*ref)[:\s#]*([a-zA-Z0-9_-]{8,35})/i
  const refMatch = rawText.match(refRegex)

  if (!refMatch) {
    return {
      valid: false,
      reason: 'Transaction Reference or Session ID not found. Ensure the receipt is complete.',
    }
  }

  // 3. Check for Date & Time Stamps
  const dateRegex = /(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})|(?:\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i
  const timeRegex = /\b(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s*[ap]m)?\b/i

  if (!dateRegex.test(rawText) || !timeRegex.test(rawText)) {
    return {
      valid: false,
      reason: 'Receipt is missing transaction date or timestamp details.',
    }
  }

  // 4. Check Beneficiary Account verification (1312120060 or De-echoi)
  const cleanAccount = expectedAccount.replace(/\s+/g, '')
  const hasAccountOrName =
    text.includes(cleanAccount) ||
    rawText.toLowerCase().includes('de-echoi') ||
    rawText.toLowerCase().includes('deechoi')

  if (!hasAccountOrName) {
    return {
      valid: false,
      reason: `Beneficiary account ${expectedAccount} or 'De-echoi Limited' was not found on the receipt.`,
    }
  }

  return {
    valid: true,
    reference: refMatch[1],
    amount: expectedAmount,
  }
}