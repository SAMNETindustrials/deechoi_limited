import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCustomerMessageEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Accept fields from both frontend variants
    const { 
      messageId, 
      inquiryId, 
      replyText, 
      message, 
      replyMessage, 
      customerEmail, 
      to, 
      toEmail, 
      customerName, 
      subject,
      type,
      metadata,
      senderName 
    } = body

    const finalMessageId = messageId || inquiryId
    const finalReplyText = replyText || message || replyMessage

    if (!finalMessageId || !finalReplyText?.trim()) {
      return NextResponse.json(
        { error: 'messageId (or inquiryId) and replyText are required.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // 1. Insert the message directly into the database table so it persists permanently
    const { data: insertedMessage, error: dbError } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: finalMessageId,
        sender_type: 'admin',
        sender_name: senderName || 'De-echoi Support',
        message: finalReplyText.trim(),
        type: type || 'text',
        metadata: metadata || {}
      })
      .select('*')
      .single()

    if (dbError) {
      console.error('[Admin Reply Notice] Database insert error:', dbError.message)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 2. Update the thread's last message time to bump it to the top of the inbox
    await supabase
      .from('customer_inquiries')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', finalMessageId)

    // 3. Resolve customer email if not explicitly provided in the payload
    let targetEmail = customerEmail || to || toEmail
    let targetCustomerName = customerName

    if (!targetEmail || !targetCustomerName) {
      const { data: inquiryData } = await supabase
        .from('customer_inquiries')
        .select('customer_email, email, customer_name, name')
        .eq('id', finalMessageId)
        .maybeSingle()

      if (inquiryData) {
        targetEmail = targetEmail || inquiryData.customer_email || inquiryData.email
        targetCustomerName = targetCustomerName || inquiryData.customer_name || inquiryData.name
      }
    }

    // 4. Dispatch email notification to customer if email is successfully resolved
    if (targetEmail) {
      const emailSubject = subject || 'Reply to Your Inquiry - De-echoi Support'
      const formattedMessage = `Hello ${targetCustomerName || 'Valued Customer'},\n\n${finalReplyText.trim()}\n\nBest regards,\nDe-echoi Kitchen Support`

      sendCustomerMessageEmail(targetEmail, emailSubject, formattedMessage).catch((emailErr: any) => {
        console.warn('[Admin Reply Notice] Email dispatch warning:', emailErr)
      })
    }

    return NextResponse.json({
      success: true,
      data: insertedMessage,
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