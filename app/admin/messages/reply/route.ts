import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { sendCustomerMessageEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { inquiryId, replyMessage, customerEmail, customerName } = body

    if (!inquiryId || !replyMessage) {
      return NextResponse.json({ error: 'Inquiry ID and message are required' }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Insert admin reply into inquiry_messages
    const { error: insertErr } = await supabase.from('inquiry_messages').insert({
      inquiry_id: inquiryId,
      sender_type: 'admin',
      sender_name: 'De-echoi Support Team',
      message: replyMessage.trim(),
    })

    if (insertErr) throw insertErr

    // 2. Update thread status and timestamp
    await supabase
      .from('customer_inquiries')
      .update({
        last_message_at: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', inquiryId)

    // 3. Dispatch Email to Customer
    if (customerEmail) {
      sendCustomerMessageEmail({
        to: customerEmail.trim().toLowerCase(),
        customerName: customerName || 'Valued Customer',
        message: replyMessage.trim(),
        senderName: 'De-echoi Support Team',
        inquiryId,
        isAutoReply: false,
      }).catch((err) => console.warn('Customer reply email error:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent to customer dashboard and email inbox.',
    })
  } catch (err: any) {
    console.error('Admin reply error:', err)
    return NextResponse.json({ error: err.message || 'Failed to dispatch reply' }, { status: 500 })
  }
}