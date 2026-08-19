// app/api/admin/messages/reply/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCustomerMessageEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { inquiryId, to, customerName, message, senderName = 'De-echoi Support' } = body

    if (!inquiryId || !message?.trim()) {
      return NextResponse.json({ error: 'Inquiry ID and message are required.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // 1. Insert message into inquiry_messages
    const { data: newMsg, error: insertError } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: inquiryId,
        sender_type: 'admin',
        sender_name: senderName,
        message: message.trim(),
        type: 'text',
        created_at: now,
      })
      .select('*')
      .single()

    if (insertError) throw insertError

    // 2. Update thread status and timestamp
    await supabase
      .from('customer_inquiries')
      .update({
        last_message_at: now,
        status: 'replied',
      })
      .eq('id', inquiryId)

    // 3. Dispatch Email notification if email exists
    if (to) {
      try {
        await sendCustomerMessageEmail({
          to,
          customerName: customerName || 'Customer',
          message: message.trim(),
          senderName,
          inquiryId,
        })
      } catch (mailErr) {
        console.warn('[Email dispatch notice]:', mailErr)
      }
    }

    return NextResponse.json({ success: true, data: newMsg })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}