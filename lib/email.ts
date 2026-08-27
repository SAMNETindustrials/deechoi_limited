import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  // Use Service Role Key first to bypass Supabase RLS on app_settings
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

/**
 * Escapes characters that break Telegram HTML parse mode (<, >, &)
 */
function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Resolves & sanitizes Telegram Bot Token & Chat ID from database or environment variables
 */
export async function getTelegramConfig() {
  let botToken = (
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ||
    ''
  ).trim()
  
  let chatId = (
    process.env.TELEGRAM_CHAT_ID ||
    process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID ||
    ''
  ).trim()

  try {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'notification_settings')
      .maybeSingle()

    if (!error && data?.value) {
      let settings = data.value
      // Parse stringified JSON if stored as text
      if (typeof settings === 'string') {
        try {
          settings = JSON.parse(settings)
        } catch (_) {}
      }

      if (settings?.telegram_bot_token) {
        botToken = String(settings.telegram_bot_token).trim()
      }
      if (settings?.telegram_chat_id) {
        chatId = String(settings.telegram_chat_id).trim()
      }
    }
  } catch (err) {
    console.warn('[Telegram Config Notice]:', err)
  }

  // Sanitize Bot Token (remove accidental 'bot' prefix if user pasted 'bot12345:...')
  if (botToken.startsWith('bot') && botToken.includes(':')) {
    botToken = botToken.replace(/^bot/, '')
  }

  if (botToken && chatId) {
    return { botToken, chatId }
  }

  return null
}

/**
 * Dispatches Telegram message with auto-fallback to plain text if HTML formatting fails
 */
export async function sendRawTelegramMessage(
  htmlText: string,
  plainFallbackText?: string
): Promise<{ success: boolean; error?: string }> {
  const config = await getTelegramConfig()

  if (!config) {
    const err =
      'Telegram Bot Token or Chat ID is missing in app_settings and environment variables.'
    console.warn(`[Telegram Alert Failed]: ${err}`)
    return { success: false, error: err }
  }

  const endpoint = `https://api.telegram.org/bot${config.botToken}/sendMessage`

  try {
    // 1. First Attempt: Send with HTML formatting
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    })

    const data = await response.json()

    if (data.ok) {
      console.log('[Telegram Notification]: Message delivered successfully!')
      return { success: true }
    }

    console.warn(
      `[Telegram HTML Delivery Warning]: ${data.description}. Attempting plain text fallback...`
    )

    // 2. Second Attempt (Fallback): Send as clean plain text if HTML had entity formatting errors
    const fallbackText = plainFallbackText || htmlText.replace(/<[^>]*>?/gm, '')
    const fallbackResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: fallbackText,
      }),
    })

    const fallbackData = await fallbackResponse.json()

    if (fallbackData.ok) {
      console.log(
        '[Telegram Notification]: Plain text fallback delivered successfully!'
      )
      return { success: true }
    }

    console.error(`[Telegram API Error]: ${fallbackData.description}`)
    return { success: false, error: fallbackData.description }
  } catch (networkError: any) {
    console.error('[Telegram Network Error]:', networkError)
    return { success: false, error: networkError.message || 'Network error' }
  }
}

/**
 * 1. New Store Order Notification Alert
 */
export async function sendTelegramOrderNotification(order: {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address: string
  total_amount: number
  delivery_fee: number
  payment_method: string
  items?: Array<{
    name: string
    quantity: number
    price: number
    selected_options?: any
  }>
  payment_proof_url?: string | null
}) {
  const safeId = escapeHtml(
    order.id ? `#${String(order.id).slice(0, 8)}` : '#NEW'
  )
  const safeName = escapeHtml(order.customer_name || 'Customer')
  const safePhone = escapeHtml(order.customer_phone || 'N/A')
  const safeEmail = escapeHtml(order.customer_email || 'N/A')
  const safeAddress = escapeHtml(order.delivery_address || 'Port Harcourt')
  const safePayment = escapeHtml(
    (order.payment_method || 'bank_transfer').toUpperCase()
  )
  const totalAmountStr = Number(order.total_amount || 0).toLocaleString()
  const deliveryFeeStr = Number(order.delivery_fee || 0).toLocaleString()

  // Format Items
  let itemsHtmlList = '• Standard Food Selection'
  let itemsPlainList = '• Standard Food Selection'

  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsHtmlList = order.items
      .map((item) => {
        const iName = escapeHtml(item.name || 'Item')
        const iQty = item.quantity || 1
        const iPrice = Number(item.price || 0) * iQty

        let optText = ''
        if (
          Array.isArray(item.selected_options) &&
          item.selected_options.length > 0
        ) {
          optText = `\n   └ <i>${escapeHtml(
            item.selected_options
              .map((o: any) => `${o.groupName}: ${o.optionName}`)
              .join(', ')
          )}</i>`
        }

        return `• <b>${iName}</b> x${iQty} (₦${iPrice.toLocaleString()})${optText}`
      })
      .join('\n')

    itemsPlainList = order.items
      .map(
        (item) =>
          `• ${item.name} x${item.quantity || 1} (₦${(
            Number(item.price || 0) * (item.quantity || 1)
          ).toLocaleString()})`
      )
      .join('\n')
  }

  const timeString = new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Lagos',
  })

  const htmlMessage = `
🛍️ <b>NEW STORE ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${safeId}</code>
👤 <b>Customer:</b> ${safeName}
📱 <b>Phone:</b> ${safePhone}
📧 <b>Email:</b> ${safeEmail}
📍 <b>Delivery Address:</b> ${safeAddress}

🍽️ <b>Ordered Items:</b>
${itemsHtmlList}

💰 <b>Total Amount:</b> ₦${totalAmountStr} (Includes ₦${deliveryFeeStr} delivery)
💳 <b>Payment Method:</b> ${safePayment}
${
  order.payment_proof_url
    ? `📎 <b>Payment Receipt:</b> <a href="${order.payment_proof_url}">View Uploaded Receipt</a>\n`
    : ''
}⏰ <b>Time:</b> ${timeString} (WAT)
━━━━━━━━━━━━━━━━━━
<i>De-echoi Live Kitchen Alert</i>
`.trim()

  const plainMessage = `
[NEW STORE ORDER RECEIVED]
Order ID: ${order.id ? `#${String(order.id).slice(0, 8)}` : '#NEW'}
Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Email: ${order.customer_email || 'N/A'}
Address: ${order.delivery_address}

Items:
${itemsPlainList}

Total Amount: ₦${totalAmountStr} (Delivery: ₦${deliveryFeeStr})
Payment: ${order.payment_method?.toUpperCase()}
Time: ${timeString} (WAT)
`.trim()

  return sendRawTelegramMessage(htmlMessage, plainMessage)
}

/**
 * 2. Waitlist Registration Alert (Captures all selected dish configs and training choices)
 */
export async function sendTelegramWaitlistNotification({
  customerName,
  email,
  phone,
  promoCode,
  favoriteDish,
  selectedItems,
  wantsTraining,
  isReturning,
}: {
  customerName: string
  email: string
  phone: string
  promoCode: string
  favoriteDish: string
  selectedItems?: string[]
  wantsTraining?: boolean
  isReturning: boolean
}) {
  const safeName = escapeHtml(customerName)
  const safeEmail = escapeHtml(email)
  const safePhone = escapeHtml(phone)
  const safeCode = escapeHtml(promoCode)
  const safeDish = escapeHtml(favoriteDish)
  
  const timeString = new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Lagos',
  })

  const title = isReturning
    ? '🔁 <b>VIP RETURNED (PREVIEWED CODE)</b>'
    : '🌟 <b>NEW VIP WAITLIST REGISTRATION</b>'

  const htmlMessage = `
${title}
━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${safeName}
📧 <b>Email:</b> ${safeEmail}
📱 <b>Phone:</b> ${safePhone}
🎟️ <b>VIP Promo Code:</b> <code>${safeCode}</code> (15% OFF)

🍽️ <b>Selected Dishes & Configurations:</b>
<i>${safeDish}</i>

🎓 <b>Academy Training Interest:</b> ${wantsTraining ? '✅ Yes (Interested in Catering & Baking Training)' : '❌ No'}

⏰ <b>Time:</b> ${timeString} (WAT)
━━━━━━━━━━━━━━━━━━
<i>De-echoi Automated Storefront Alert</i>
`.trim()

  const plainMessage = `
[VIP WAITLIST REGISTRATION]
Customer: ${customerName}
Email: ${email}
Phone: ${phone}
Promo Code: ${promoCode} (15% OFF)
Selected Dishes: ${favoriteDish}
Training Interest: ${wantsTraining ? 'Yes' : 'No'}
Time: ${timeString} (WAT)
`.trim()

  return sendRawTelegramMessage(htmlMessage, plainMessage)
}

/**
 * 3. Send Customer Order Confirmation Email via Gmail SMTP
 */
export async function sendOrderConfirmationEmail(
  toEmail: string,
  subject: string,
  messageBody: string
) {
  try {
    const userEmail = process.env.GMAIL_SENDER_EMAIL
    const appPassword = process.env.GMAIL_APP_PASSWORD

    if (!userEmail || !appPassword) {
      console.warn('[Email Notice]: GMAIL_SENDER_EMAIL or GMAIL_APP_PASSWORD not configured. Email logged to console:', { toEmail, subject, messageBody })
      return { success: true }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail,
        pass: appPassword,
      },
    })

    const info = await transporter.sendMail({
      from: `"De-echoi Support" <${userEmail}>`,
      to: toEmail,
      subject: subject,
      text: messageBody,
    })

    return { success: true, data: info }
  } catch (err: any) {
    console.error('[Gmail Email Dispatch Error]:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 4. Send Customer Message / Support Reply Email
 */
export async function sendCustomerMessageEmail(
  toEmail: string,
  subject: string,
  messageBody: string
) {
  return sendOrderConfirmationEmail(toEmail, subject, messageBody)
}

/**
 * 5. Send Email Reply to Customer (Admin Support)
 */
export async function sendEmailReply(
  toEmail: string,
  subject: string,
  messageBody: string
) {
  return sendOrderConfirmationEmail(toEmail, subject, messageBody)
}