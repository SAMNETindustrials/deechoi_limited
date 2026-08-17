import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { sendCustomerMessageEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { inquiryId, replyMessage, customerEmail, customerName } = body

    if (!inquiryId || !replyMessage) {
      return NextResponse.json({ error: 'Inquiry ID and message are required' }, { status: 400 })
    }

    const cleanInquiryId = String(inquiryId).trim()
    const cleanMessage = String(replyMessage).trim()
    const cleanEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : ''
    const cleanName = customerName ? String(customerName).trim() : 'Customer'

    const supabase = createClient()

    // 1. Insert admin reply into inquiry_messages
    const { error: insertErr } = await supabase.from('inquiry_messages').insert({
      inquiry_id: cleanInquiryId,
      sender_type: 'admin',
      sender_name: 'De-echoi Support Team',
      message: cleanMessage,
    })

    if (insertErr) {
      console.error('Supabase message insert error:', insertErr)
      throw new Error(insertErr.message || 'Database rejected message insert')
    }

    // 2. Update thread status and timestamp (safely)
    try {
      await supabase
        .from('customer_inquiries')
        .update({
          last_message_at: new Date().toISOString(),
          status: 'resolved',
        })
        .eq('id', cleanInquiryId)
    } catch (updateErr) {
      console.warn('Thread update timestamp warning:', updateErr)
    }

    // 3. Dispatch Email to Customer if valid email exists
    if (cleanEmail && cleanEmail.includes('@')) {
      sendCustomerMessageEmail({
        to: cleanEmail,
        customerName: cleanName,
        message: cleanMessage,
        senderName: 'De-echoi Support Team',
        inquiryId: cleanInquiryId,
        isAutoReply: false,
      }).catch((err) => console.warn('Customer reply email background warning:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Reply recorded and synced successfully.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to dispatch reply'
    console.error('Admin reply API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}