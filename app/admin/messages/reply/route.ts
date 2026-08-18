import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { sendCustomerMessageEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      inquiryId, 
      replyMessage, 
      customerEmail, 
      customerName, 
      type = 'text', 
      metadata = null 
    } = body

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID is required.' }, { status: 400 })
    }

    // Only validate text content if sending a regular message
    const trimmedMessage = (replyMessage || '').trim()
    if (type !== 'payment_request' && !trimmedMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Insert admin message
    const { data: insertedMessage, error: messageError } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: inquiryId,
        sender_type: 'admin',
        sender_name: 'De-echoi Support',
        message: type === 'payment_request' ? '' : trimmedMessage,
        type,
        metadata,
      })
      .select('*')
      .single()

    if (messageError) {
      console.error('[Admin Reply Error]:', messageError)
      return NextResponse.json({ error: messageError.message }, { status: 500 })
    }

    // 2. Update inquiry status
    await supabase
      .from('customer_inquiries')
      .update({
        last_message_at: new Date().toISOString(),
        status: type === 'payment_request' ? 'awaiting_payment' : 'responded',
      })
      .eq('id', inquiryId)

    // 3. Email dispatch
    if (customerEmail) {
      const emailText = type === 'payment_request' 
        ? `An official payment request of ₦${Number(metadata?.amount || 0).toLocaleString()} has been issued for: "${metadata?.note || 'Custom Order'}". Please check your dashboard to complete payment.`
        : trimmedMessage

      sendCustomerMessageEmail({
        to: customerEmail,
        customerName: customerName || 'Customer',
        message: emailText,
        senderName: 'De-echoi Support',
        inquiryId,
        isAutoReply: false,
      }).catch((emailErr) => console.warn('[Email Warning]:', emailErr))
    }

    return NextResponse.json({ success: true, message: insertedMessage })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}