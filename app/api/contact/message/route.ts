import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { sendCustomerMessageEmail } from '@/lib/email'

function generateAIAutoReply(message: string, name: string): { category: string; reply: string } {
  const lower = (message || '').toLowerCase()
  const firstName = name.split(' ')[0] || 'there'

  if (lower.includes('cake') || lower.includes('flavor') || lower.includes('tier') || lower.includes('birthday')) {
    return {
      category: 'Cakes & Bakes',
      reply: `Hello ${firstName}! Thank you for reaching out regarding our bespoke celebration cakes. We bake fresh 6-inch and 7-inch tiered cakes (Vanilla, Chocolate, and Red Velvet combinations) customizable with personal inscriptions. Our team is reviewing your request and will confirm availability and sizing options with you shortly!`,
    }
  }

  if (lower.includes('event') || lower.includes('catering') || lower.includes('wedding') || lower.includes('party')) {
    return {
      category: 'Event Catering',
      reply: `Dear ${firstName}, thank you for considering De-echoi Limited for your event! We offer full buffet platters, finger foods, and cocktail service across Port Harcourt. Our event coordinator is reviewing your details to provide a customized menu quotation.`,
    }
  }

  if (lower.includes('delivery') || lower.includes('order') || lower.includes('rider') || lower.includes('track')) {
    return {
      category: 'Order & Delivery Support',
      reply: `Hi ${firstName}, regarding your order delivery: you can track your live rider route in real-time under the "My Orders" tab on our website. Our Woji kitchen logistics team is monitoring your dispatch.`,
    }
  }

  return {
    category: 'General Inquiry',
    reply: `Hello ${firstName}, thank you for contacting De-echoi Limited! We have received your inquiry. A member of our support team is reviewing your message and will get back to you shortly.`,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message, inquiryId } = body

    const cleanMessage = String(message || '').trim()

    if (!cleanMessage) {
      return NextResponse.json({ error: 'Message content cannot be empty.' }, { status: 400 })
    }

    if (!inquiryId && (!name || !email || !phone)) {
      return NextResponse.json({ error: 'Name, email, and phone number are required.' }, { status: 400 })
    }

    const supabase = createClient()
    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanName = String(name || 'Customer').trim()
    const cleanPhone = String(phone || '').trim()
    let targetInquiryId = inquiryId

    if (!targetInquiryId) {
      // 1. Auto-create or update Customer Profile
      try {
        await supabase
          .from('customer_profiles')
          .upsert(
            {
              email: cleanEmail,
              name: cleanName,
              phone: cleanPhone,
            },
            { onConflict: 'email' }
          )
      } catch (profileErr) {
        console.warn('Customer profile upsert warning:', profileErr)
      }

      // 2. Generate Context-Aware AI reply
      const { category, reply: aiReply } = generateAIAutoReply(cleanMessage, cleanName)

      // 3. Create Inquiry Thread (guaranteeing message is not null)
      const inquiryPayload = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        message: cleanMessage,
        category,
        ai_suggested_reply: aiReply,
        reply_status: 'pending',
        status: 'open',
        last_message_at: new Date().toISOString(),
      }

      let newInquiry: any = null
      const { data: insertedData, error: inqError } = await supabase
        .from('customer_inquiries')
        .insert(inquiryPayload)
        .select()
        .single()

      if (inqError) {
        console.warn('Primary insert failed, retrying with required fields:', inqError.message)
        const fallbackPayload = {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message: cleanMessage,
          category,
          ai_suggested_reply: aiReply,
          reply_status: 'pending',
        }

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('customer_inquiries')
          .insert(fallbackPayload)
          .select()
          .single()

        if (fallbackError) throw fallbackError
        newInquiry = fallbackData
      } else {
        newInquiry = insertedData
      }

      targetInquiryId = newInquiry.id

      // 4. Save Customer Message and AI Reply in Thread
      try {
        await supabase.from('inquiry_messages').insert([
          {
            inquiry_id: targetInquiryId,
            sender_type: 'customer',
            sender_name: cleanName,
            message: cleanMessage,
          },
          {
            inquiry_id: targetInquiryId,
            sender_type: 'admin',
            sender_name: 'De-echoi Support AI',
            message: aiReply,
          },
        ])
      } catch (msgErr) {
        console.warn('inquiry_messages table insert warning:', msgErr)
      }

      // 5. Send Email to Customer's Registered Email Address
      if (cleanEmail && cleanEmail.includes('@')) {
        sendCustomerMessageEmail({
          to: cleanEmail,
          customerName: cleanName,
          message: aiReply,
          senderName: 'De-echoi Support Team',
          inquiryId: targetInquiryId,
          isAutoReply: true,
        }).catch((err) => console.warn('Customer auto-reply email error:', err))
      }

      // 6. Send Telegram notification to admin
      try {
        const { data: settingsRecord } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'notification_settings')
          .single()

        const settings = settingsRecord?.value || {}
        if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
          const tgText =
            `📩 *NEW CUSTOMER MESSAGE*\n\n` +
            `👤 *From:* ${cleanName}\n` +
            `📧 *Email:* ${cleanEmail}\n` +
            `📞 *Phone:* \`${cleanPhone}\`\n` +
            `🏷️ *Category:* _${category}_\n\n` +
            `💬 *Message:*\n"${cleanMessage}"\n\n` +
            `🤖 *Auto-Reply Dispatched:* \n_${aiReply}_\n\n` +
            `⚡ _Check Admin Messages to reply back._`

          fetch(`https://api.telegram.org/bot${settings.telegram_bot_token.trim()}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegram_chat_id.trim(),
              text: tgText,
              parse_mode: 'Markdown',
            }),
          }).catch((err) => console.warn('Telegram notify error:', err))
        }
      } catch (tgEx) {
        console.warn('Telegram processing error:', tgEx)
      }

      return NextResponse.json({
        success: true,
        inquiryId: targetInquiryId,
        autoReply: aiReply,
        category,
      })
    } else {
      // Subsequent reply to existing inquiry thread
      await supabase.from('inquiry_messages').insert({
        inquiry_id: targetInquiryId,
        sender_type: 'customer',
        sender_name: cleanName,
        message: cleanMessage,
      })

      try {
        await supabase
          .from('customer_inquiries')
          .update({ 
            last_message_at: new Date().toISOString(), 
            status: 'open' 
          })
          .eq('id', targetInquiryId)
      } catch (updateErr) {
        console.warn('Failed to update last_message_at:', updateErr)
      }

      return NextResponse.json({ success: true, inquiryId: targetInquiryId })
    }
  } catch (err: any) {
    console.error('Contact route error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}