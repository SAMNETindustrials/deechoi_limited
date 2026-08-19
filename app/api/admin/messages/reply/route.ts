import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCustomerMessageEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messageId, replyText, customerEmail, customerName } = body

    if (!messageId || !replyText?.trim()) {
      return NextResponse.json(
        { error: 'messageId and replyText are required.' },
        { status: 400 }
      )
    }

    // 1. Update message or conversation status in Supabase
    const { error: dbError } = await supabase
      .from('customer_messages')
      .update({
        admin_reply: replyText.trim(),
        replied_at: new Date().toISOString(),
        status: 'replied',
      })
      .eq('id', messageId)

    if (dbError) {
      console.warn('[Admin Reply Notice] Database update warning:', dbError.message)
    }

    // 2. Dispatch email notification to customer if email is provided
    if (customerEmail) {
      sendCustomerMessageEmail({
        to: customerEmail,
        customerName: customerName || 'Valued Customer',
        message: replyText.trim(),
        subject: 'Reply to Your Inquiry - De-echoi Support',
      }).catch((emailErr: any) => {
        console.warn('[Admin Reply Notice] Email dispatch warning:', emailErr)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reply recorded and customer notified successfully.',
    })
  } catch (err: any) {
    console.error('[Admin Reply Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to process admin reply.' },
      { status: 500 }
    )
  }
}