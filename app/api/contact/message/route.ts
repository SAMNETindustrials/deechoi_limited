import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { sendCustomerMessageEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { inquiryId, name, message } = body

    if (!inquiryId || !message?.trim()) {
      return NextResponse.json({ error: 'Inquiry ID and message are required.' }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Insert customer reply into inquiry_messages
    const { data: newMsg, error: insertError } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: inquiryId,
        sender_type: 'customer',
        sender_name: name || 'Customer',
        message: message.trim(),
        type: 'text',
      })
      .select('*')
      .single()

    if (insertError) {
      throw insertError
    }

    // 2. Update thread timestamp
    await supabase
      .from('customer_inquiries')
      .update({
        last_message_at: new Date().toISOString(),
        status: 'customer_replied',
      })
      .eq('id', inquiryId)

    return NextResponse.json({ success: true, data: newMsg })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}