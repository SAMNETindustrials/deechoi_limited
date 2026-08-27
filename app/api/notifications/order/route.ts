import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      autoDetect,
      botToken,
      isTest,
      order,
      orderData,
      transactionCode,
      sendBatchPendingEmails,
    } = body
    const supabase = getSupabaseClient()

    // ------------------------------------------------------------------------
    // 0. RETROACTIVE EMAIL DISPATCH FOR PREVIOUS ORDERS (IF REQUESTED)
    // ------------------------------------------------------------------------
    if (sendBatchPendingEmails) {
      const { data: pastOrders, error: fetchErr } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchErr || !pastOrders) {
        return NextResponse.json({ success: false, error: 'Could not fetch past orders.' })
      }

      let sentCount = 0
      for (const pastOrder of pastOrders) {
        const emailTo = pastOrder.customer_email || pastOrder.email
        if (emailTo) {
          try {
            const customerName = pastOrder.customer_name || pastOrder.name || 'Valued Customer'
            const orderIdStr = String(pastOrder.id || 'N/A')
            const subject = `Order Confirmation #${orderIdStr} - De-echoi Kitchen`
            
            let itemsListFormatted = '• Standard Food Menu Selection'
            if (Array.isArray(pastOrder.items) && pastOrder.items.length > 0) {
              itemsListFormatted = pastOrder.items
                .map((item: any) => {
                  const name = item.name || item.product_name || 'Item'
                  const qty = item.quantity || 1
                  const price = item.price || item.unit_price || 0
                  return `• ${name} x${qty} (₦${(price * qty).toLocaleString()})`
                })
                .join('\n')
            }

            const fulfillmentType = pastOrder.fulfillment_method === 'pickup' ? 'Direct Pickup Point (De-echoi Kitchen, Woji)' : 'Dispatch Delivery'
            const deliveryAddress = pastOrder.delivery_address || 'N/A'
            const phoneStr = pastOrder.customer_phone || pastOrder.phone || 'N/A'
            const totalAmountStr = Number(pastOrder.total_amount || pastOrder.total || 0).toLocaleString()

            const messageBody = `Hello ${customerName},\n\nThank you for your order with De-echoi Kitchen! We have successfully received your request and are processing it.\n\n============================\nORDER DETAILS (${orderIdStr})\n============================\n\n[CUSTOMER DETAILS]\n• Full Name: ${customerName}\n• Email: ${emailTo}\n• Phone: ${phoneStr}\n• Fulfillment Method: ${fulfillmentType}\n• Delivery Address: ${deliveryAddress}\n\n[ORDERED ITEMS]\n${itemsListFormatted}\n\n[PAYMENT & TOTAL]\n• Total Payable: ₦${totalAmountStr}\n\nWe will update you shortly once your meal is ready or dispatched.\n\nWarm regards,\nDe-echoi Kitchen Operations`

            const emailResult = await sendOrderConfirmationEmail(emailTo, subject, messageBody)
            if (emailResult && (emailResult as any).success !== false) {
              sentCount++
            }
          } catch (batchErr) {
            console.error(`[Batch Email Error for Order ${pastOrder.id}]:`, batchErr)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Retroactive emails processed successfully for ${sentCount} past orders.`,
        sentCount,
      })
    }

    // ------------------------------------------------------------------------
    // 1. AUTO-DETECT TELEGRAM CHAT ID
    // ------------------------------------------------------------------------
    if (autoDetect && botToken) {
      const cleanToken = botToken.trim()
      const url = `https://api.telegram.org/bot${cleanToken}/getUpdates`
      const tgRes = await fetch(url)
      const tgData = await tgRes.json()

      if (tgData.ok && tgData.result && tgData.result.length > 0) {
        const lastMsg = tgData.result[tgData.result.length - 1]
        const detectedChatId =
          lastMsg?.message?.chat?.id ||
          lastMsg?.channel_post?.chat?.id ||
          lastMsg?.my_chat_member?.chat?.id

        if (detectedChatId) {
          return NextResponse.json({
            success: true,
            detectedChatId: String(detectedChatId),
          })
        }
      }

      return NextResponse.json({
        success: false,
        error:
          'No recent messages found. Open Telegram, search for your bot, click START (or send a message to it), and try again.',
      })
    }

    // ------------------------------------------------------------------------
    // 2. RETRIEVE TELEGRAM CREDENTIALS (DATABASE OR ENV)
    // ------------------------------------------------------------------------
    let activeBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || ''
    let activeChatId = process.env.TELEGRAM_CHAT_ID?.trim() || ''

    try {
      const { data: dbSettings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'notification_settings')
        .maybeSingle()

      if (dbSettings?.value) {
        const settings = dbSettings.value
        if (settings.telegram_bot_token) {
          activeBotToken = settings.telegram_bot_token.trim()
        }
        if (settings.telegram_chat_id) {
          activeChatId = String(settings.telegram_chat_id).trim()
        }
      }
    } catch (dbErr) {
      console.warn('[Notification Settings DB Notice]:', dbErr)
    }

    const rawOrder = order || orderData
    let telegramSent = false
    let telegramError: string | null = null
    let emailSent = false

    // ------------------------------------------------------------------------
    // 3. DISPATCH TELEGRAM ALERT
    // ------------------------------------------------------------------------
    if (activeBotToken && activeChatId) {
      let textToSend = ''

      if (isTest) {
        textToSend = `
🔔 <b>DE-ECHOI TELEGRAM ALERT TEST</b>
━━━━━━━━━━━━━━━━━━
✅ Your Telegram bot is active and connected to the De-echoi Live Kitchen!
⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} (WAT)
━━━━━━━━━━━━━━━━━━
<i>De-echoi Automated Notification System</i>
`.trim()
      } else if (rawOrder) {
        let itemsListFormatted = 'Standard Food Menu Selection'

        if (Array.isArray(rawOrder.items) && rawOrder.items.length > 0) {
          itemsListFormatted = rawOrder.items
            .map((item: any) => {
              const name = item.name || item.product_name || 'Item'
              const qty = item.quantity || 1
              const price = item.price || item.unit_price || 0
              return `• <b>${name}</b> x${qty} (₦${(price * qty).toLocaleString()})`
            })
            .join('\n')
        }

        const orderIdStr = rawOrder.id ? `#${String(rawOrder.id).slice(0, 8)}` : '#NEW'
        const totalAmountStr = Number(rawOrder.total_amount || rawOrder.total || 0).toLocaleString()
        const fulfillmentType = rawOrder.fulfillment_method === 'pickup' ? 'Direct Pickup Point' : 'Dispatch Delivery'

        textToSend = `
🛍️ <b>NEW STORE ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${orderIdStr}</code>
🚚 <b>Fulfillment:</b> ${fulfillmentType}
👤 <b>Customer:</b> ${rawOrder.customer_name || rawOrder.name || 'Valued Customer'}
📱 <b>Phone:</b> ${rawOrder.customer_phone || rawOrder.phone || 'N/A'}
📧 <b>Email:</b> ${rawOrder.customer_email || rawOrder.email || 'N/A'}
📍 <b>Address:</b> ${rawOrder.delivery_address || 'N/A'}

🍽️ <b>Ordered Items:</b>
${itemsListFormatted}

💰 <b>Total Payable:</b> ₦${totalAmountStr}
━━━━━━━━━━━━━━━━━━
<i>De-echoi Kitchen Operations</i>
`.trim()
      }

      if (textToSend) {
        try {
          const sendRes = await fetch(
            `https://api.telegram.org/bot${activeBotToken}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: activeChatId,
                text: textToSend,
                parse_mode: 'HTML',
              }),
            }
          )
          const sendData = await sendRes.json()
          if (sendData.ok) {
            telegramSent = true
          } else {
            telegramError = sendData.description || 'Telegram rejected delivery.'
          }
        } catch (err: unknown) {
          telegramError = err instanceof Error ? err.message : 'Network error'
        }
      }
    }

    // ------------------------------------------------------------------------
    // 4. DISPATCH CUSTOMER ORDER EMAIL (VIA GMAIL SMTP)
    // ------------------------------------------------------------------------
    let emailRecipient = rawOrder?.customer_email || rawOrder?.email

    if (!emailRecipient && rawOrder?.id) {
      try {
        const { data: dbOrderMatch } = await supabase
          .from('store_orders')
          .select('customer_email, email')
          .eq('id', rawOrder.id)
          .maybeSingle()

        if (dbOrderMatch) {
          emailRecipient = dbOrderMatch.customer_email || dbOrderMatch.email
        }
      } catch (lookupErr) {
        console.warn('[Email Fallback Lookup Notice]:', lookupErr)
      }
    }

    if (rawOrder && emailRecipient) {
      try {
        const customerName = rawOrder.customer_name || rawOrder.name || 'Valued Customer'
        const orderIdStr = String(rawOrder.id || Date.now())
        const subject = `Order Confirmation #${orderIdStr} - De-echoi Kitchen`

        let itemsListFormatted = '• Standard Food Menu Selection'
        if (Array.isArray(rawOrder.items) && rawOrder.items.length > 0) {
          itemsListFormatted = rawOrder.items
            .map((item: any) => {
              const name = item.name || item.product_name || 'Item'
              const qty = item.quantity || 1
              const price = item.price || item.unit_price || 0
              return `• ${name} x${qty} (₦${(price * qty).toLocaleString()})`
            })
            .join('\n')
        }

        const fulfillmentType = rawOrder.fulfillment_method === 'pickup' ? 'Direct Pickup Point (De-echoi Kitchen, Woji)' : 'Dispatch Delivery'
        const deliveryAddress = rawOrder.delivery_address || 'N/A'
        const phoneStr = rawOrder.customer_phone || rawOrder.phone || 'N/A'
        const totalAmountStr = Number(rawOrder.total_amount || rawOrder.total || 0).toLocaleString()
        const deliveryFeeStr = Number(rawOrder.delivery_fee || 0).toLocaleString()

        const messageBody = `Hello ${customerName},\n\nThank you for choosing De-echoi Kitchen! Your order has been placed successfully and is currently being prepared.\n\n============================\nORDER RECEIPT (${orderIdStr})\n============================\n\n[CUSTOMER DETAILS]\n• Full Name: ${customerName}\n• Email: ${emailRecipient}\n• Phone: ${phoneStr}\n• Fulfillment Method: ${fulfillmentType}\n• Delivery Address: ${deliveryAddress}\n\n[ORDERED ITEMS]\n${itemsListFormatted}\n\n[PAYMENT SUMMARY]\n• Delivery Fee: ₦${deliveryFeeStr}\n• Total Amount Paid: ₦${totalAmountStr}\n\nWe will keep you updated as your meal gets ready for delivery or pickup.\n\nWarm regards,\nDe-echoi Kitchen Operations`

        const emailResult = await sendOrderConfirmationEmail(emailRecipient, subject, messageBody)
        emailSent = !!emailResult && (emailResult as any).success !== false
      } catch (emailErr) {
        console.error('[Order Confirmation Email Dispatch Warning]:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      telegramSent,
      telegramError,
      emailSent,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json(
      { success: false, telegramSent: false, telegramError: errorMsg },
      { status: 500 }
    )
  }
}