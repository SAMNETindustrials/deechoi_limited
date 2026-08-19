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
    } = body
    const supabase = getSupabaseClient()

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

    // Normalized incoming order payload
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
        // Format Items list
        let itemsListFormatted = 'Standard Food Menu Selection'

        if (Array.isArray(rawOrder.items) && rawOrder.items.length > 0) {
          itemsListFormatted = rawOrder.items
            .map((item: any) => {
              const name = item.name || item.product_name || 'Item'
              const qty = item.quantity || 1
              const price = item.price || item.unit_price || 0

              let optionsStr = ''
              if (Array.isArray(item.selected_options) && item.selected_options.length > 0) {
                optionsStr = `\n   └ <i>${item.selected_options.map((o: any) => `${o.groupName}: ${o.optionName}`).join(', ')}</i>`
              } else if (typeof item.selected_options === 'object' && item.selected_options !== null) {
                optionsStr = `\n   └ <i>${Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(', ')}</i>`
              }

              return `• <b>${name}</b> x${qty} (₦${(price * qty).toLocaleString()})${optionsStr}`
            })
            .join('\n')
        } else if (rawOrder.items_summary) {
          itemsListFormatted = rawOrder.items_summary
        }

        const orderIdStr = rawOrder.id ? `#${String(rawOrder.id).slice(0, 8)}` : '#NEW'
        const totalAmountStr = Number(rawOrder.total_amount || rawOrder.total || 0).toLocaleString()
        const deliveryFeeStr = Number(rawOrder.delivery_fee || 0).toLocaleString()
        const paymentMethodStr = (rawOrder.payment_method || 'bank_transfer').toUpperCase()

        textToSend = `
🛍️ <b>NEW STORE ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${orderIdStr}</code>
👤 <b>Customer:</b> ${rawOrder.customer_name || rawOrder.name || 'Valued Customer'}
📱 <b>Phone:</b> ${rawOrder.customer_phone || rawOrder.phone || 'N/A'}
📧 <b>Email:</b> ${rawOrder.customer_email || rawOrder.email || 'N/A'}
📍 <b>Delivery Address:</b> ${rawOrder.delivery_address || rawOrder.address || 'Port Harcourt'}

🍽️ <b>Ordered Items:</b>
${itemsListFormatted}

💰 <b>Total Payable:</b> ₦${totalAmountStr} (Includes ₦${deliveryFeeStr} delivery)
💳 <b>Payment Method:</b> ${paymentMethodStr}
${rawOrder.payment_proof_url ? `📎 <b>Payment Proof:</b> <a href="${rawOrder.payment_proof_url}">View Uploaded Receipt</a>\n` : ''}⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} (WAT)
━━━━━━━━━━━━━━━━━━
<i>De-echoi Kitchen & Delivery Operations</i>
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
                disable_web_page_preview: false,
              }),
            }
          )

          const sendData = await sendRes.json()
          if (sendData.ok) {
            telegramSent = true
          } else {
            telegramError = sendData.description || 'Telegram rejected delivery.'
            console.error('[Telegram Delivery Error]:', sendData.description)
          }
        } catch (err: unknown) {
          telegramError = err instanceof Error ? err.message : 'Network error'
          console.error('[Telegram Send Exception]:', err)
        }
      }
    } else {
      telegramError = 'Bot Token or Chat ID is not configured.'
      console.warn('[Telegram Alert]:', telegramError)
    }

    // ------------------------------------------------------------------------
    // 4. DISPATCH CUSTOMER ORDER EMAIL (IF EMAIL PROVIDED)
    // ------------------------------------------------------------------------
    if (rawOrder && (rawOrder.customer_email || rawOrder.email)) {
      const emailRecipient = rawOrder.customer_email || rawOrder.email
      try {
        const emailResult = await sendOrderConfirmationEmail({
          toEmail: emailRecipient,
          customerName: rawOrder.customer_name || rawOrder.name || 'Valued Customer',
          orderId: String(rawOrder.id || Date.now()),
          items: Array.isArray(rawOrder.items) ? rawOrder.items : [],
          totalAmount: Number(rawOrder.total_amount || rawOrder.total || 0),
          deliveryFee: Number(rawOrder.delivery_fee || 0),
          deliveryAddress: rawOrder.delivery_address || rawOrder.address || 'Port Harcourt',
          paymentMethod: rawOrder.payment_method || 'bank_transfer',
          transactionCode: transactionCode,
        })
        emailSent = !!emailResult?.success
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
    console.error('[Notification Route Fatal Error]:', err)
    return NextResponse.json(
      { success: false, telegramSent: false, telegramError: errorMsg },
      { status: 500 }
    )
  }
}