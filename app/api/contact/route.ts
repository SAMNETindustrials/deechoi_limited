// app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendRawTelegramMessage } from '@/lib/email'
import { processCustomerMessageWithGemini } from '@/lib/ai/gemini-support-agent'

export const dynamic = 'force-dynamic'

// Helper to get admin/service client or fallback client
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
    const { name, email, phone, subject, message } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const now = new Date().toISOString()
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone?.trim() || null
    const cleanSubject = subject?.trim() || 'General Customer Inquiry'
    const cleanMessage = message.trim()

    // 1. Insert into customer_inquiries (handles both standard column naming schemes)
    let inquiryId: string | null = null

    const inquiryPayload = {
      customer_name: cleanName,
      customer_email: cleanEmail,
      customer_phone: cleanPhone,
      subject: cleanSubject,
      status: 'pending',
      last_message_at: now,
    }

    const { data: inquiryData, error: inquiryError } = await supabase
      .from('customer_inquiries')
      .insert(inquiryPayload)
      .select('id')
      .single()

    if (inquiryError) {
      console.warn('[Primary Inquiry Insert Warning]:', inquiryError.message)
      
      // Fallback try with generic column names if schema uses (name, email, phone)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('customer_inquiries')
        .insert({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message: cleanMessage,
          status: 'pending',
          created_at: now,
        })
        .select('id')
        .single()

      if (fallbackError) {
        console.error('[Fallback Inquiry Insert Error]:', fallbackError)
        return NextResponse.json(
          { error: fallbackError.message || 'Database error creating customer inquiry' },
          { status: 500 }
        )
      }

      inquiryId = fallbackData?.id
    } else {
      inquiryId = inquiryData?.id
    }

    // 2. Insert into inquiry_messages for the customer message
    if (inquiryId) {
      const { error: msgError } = await supabase
        .from('inquiry_messages')
        .insert({
          inquiry_id: inquiryId,
          sender_type: 'customer',
          sender_name: cleanName,
          message: cleanMessage,
          type: 'text',
          created_at: now,
        })

      if (msgError) {
        console.warn('[Child Message Insert Notice]:', msgError.message)
      }

      // 3. Process automated support response via Gemini AI Agent
      try {
        const geminiResult = await processCustomerMessageWithGemini({
          inquiryId: inquiryId,
          customerName: cleanName,
          conversationHistory: [{ sender: 'customer', text: cleanMessage }],
          incomingMessage: cleanMessage,
        })

        const adminMsgTime = new Date(Date.now() + 500).toISOString()

        // Insert AI/Admin auto-response into database so it persists permanently for the customer
        await supabase
          .from('inquiry_messages')
          .insert({
            inquiry_id: inquiryId,
            sender_type: 'admin',
            sender_name: 'De-echoi Support',
            message: geminiResult.message,
            type: geminiResult.type,
            metadata: geminiResult.metadata,
            created_at: adminMsgTime,
          })

        // Update parent thread last_message_at
        await supabase
          .from('customer_inquiries')
          .update({ last_message_at: adminMsgTime, status: 'replied' })
          .eq('id', inquiryId)

      } catch (aiErr) {
        console.warn('[Contact AI Auto-Reply Notice]:', aiErr)
      }
    }

    // 4. Dispatch instant Telegram alert so admin gets notified on their phone
    try {
      const timeString = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
      const telegramHtml = `
💬 <b>NEW CUSTOMER SUPPORT INQUIRY!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Name:</b> ${cleanName}
📧 <b>Email:</b> ${cleanEmail}
📱 <b>Phone:</b> ${cleanPhone || 'N/A'}
📌 <b>Subject:</b> ${cleanSubject}

📝 <b>Message:</b>
<i>${cleanMessage}</i>

⏰ <b>Time:</b> ${timeString} (WAT)
━━━━━━━━━━━━━━━━━━
<i>De-echoi Support Center Alert</i>
      `.trim()

      await sendRawTelegramMessage(telegramHtml)
    } catch (telegramErr) {
      console.warn('[Telegram Contact Notification Warning]:', telegramErr)
    }

    return NextResponse.json({
      success: true,
      inquiryId: inquiryId,
      autoReply: `Hello ${cleanName}, thank you for reaching out to De-echoi! We have received your inquiry and our team is reviewing it.`,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server processing error'
    console.error('[API /api/contact Exception]:', errorMsg)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}