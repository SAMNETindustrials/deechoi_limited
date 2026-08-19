// app/api/contact/message/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processCustomerMessageWithGemini } from '@/lib/ai/gemini-support-agent'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { inquiryId, name, email, phone, subject, message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const cleanName = name?.trim() || 'Customer'
    const cleanEmail = email?.trim()?.toLowerCase() || 'customer@deechoi.com'
    const cleanPhone = phone?.trim() || null
    const cleanMessage = message.trim()
    let activeInquiryId = inquiryId

    // 1. Ensure Inquiry Thread Exists
    if (!activeInquiryId) {
      const { data: newInquiry, error: inquiryErr } = await supabase
        .from('customer_inquiries')
        .insert({
          customer_name: cleanName,
          customer_email: cleanEmail,
          customer_phone: cleanPhone,
          subject: subject?.trim() || 'Support Conversation',
          status: 'pending',
          last_message_at: now,
        })
        .select('id')
        .single()

      if (!inquiryErr) {
        activeInquiryId = newInquiry?.id
      }
    }

    // 2. Insert Customer Message
    const { data: insertedCustomerMsg } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: activeInquiryId,
        sender_type: 'customer',
        sender_name: cleanName,
        message: cleanMessage,
        type: 'text',
        created_at: now,
      })
      .select('*')
      .single()

    // 3. Fetch Previous Chat History for Gemini Context
    const { data: historyData } = await supabase
      .from('inquiry_messages')
      .select('*')
      .eq('inquiry_id', activeInquiryId)
      .order('created_at', { ascending: true })
      .limit(10)

    const conversationHistory = (historyData || []).map((h) => ({
      sender: h.sender_type as 'customer' | 'admin',
      text: h.message,
    }))

    // 4. Generate Gemini Auto-Response (with auto payment tool support)
    const geminiResult = await processCustomerMessageWithGemini({
      inquiryId: activeInquiryId,
      customerName: cleanName,
      conversationHistory,
      incomingMessage: cleanMessage,
    })

    // 5. Insert AI's Response as Admin Message
    const { data: insertedAdminMsg } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: activeInquiryId,
        sender_type: 'admin',
        sender_name: 'De-echoi AI Assistant',
        message: geminiResult.message,
        type: geminiResult.type,
        metadata: geminiResult.metadata,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    // 6. Update Parent Thread Status
    await supabase
      .from('customer_inquiries')
      .update({ last_message_at: new Date().toISOString(), status: 'replied' })
      .eq('id', activeInquiryId)

    return NextResponse.json({
      success: true,
      inquiryId: activeInquiryId,
      customerMessage: insertedCustomerMsg,
      adminMessage: insertedAdminMsg,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error'
    console.error('[API Exception]:', errorMsg)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}