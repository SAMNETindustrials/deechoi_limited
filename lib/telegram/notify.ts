import { createClient } from '@supabase/supabase-js'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

// Fetch active Telegram configuration from Supabase app_settings table
async function getTelegramConfig() {
  try {
    const supabase = getSupabaseAdminClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'notification_settings')
      .maybeSingle()

    if (data?.value) {
      const settings = data.value
      if (settings.telegram_enabled !== false && settings.telegram_bot_token && settings.telegram_chat_id) {
        return {
          botToken: settings.telegram_bot_token.trim(),
          chatId: settings.telegram_chat_id.trim(),
        }
      }
    }
  } catch (err) {
    console.warn('[Telegram Config Fetch Notice]:', err)
  }

  // Fallback to environment variables if database row is empty
  const envToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
  const envChatId = (process.env.TELEGRAM_CHAT_ID || '').trim()

  if (envToken && envChatId) {
    return { botToken: envToken, chatId: envChatId }
  }

  return null
}

export async function sendTelegramWaitlistNotification({
  customerName,
  email,
  phone,
  promoCode,
  favoriteDish,
  isReturning,
}: {
  customerName: string
  email: string
  phone: string
  promoCode: string
  favoriteDish: string
  isReturning: boolean
}) {
  const config = await getTelegramConfig()

  if (!config) {
    console.warn('[Telegram Notice]: Telegram bot is not configured or disabled in Admin Notification Settings.')
    return false
  }

  const title = isReturning ? '🔁 <b>VIP RETURNED (PREVIEWED CODE)</b>' : '🌟 <b>NEW VIP WAITLIST REGISTRATION</b>'

  const message = `
${title}
━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${customerName}
📧 <b>Email:</b> ${email}
📱 <b>Phone:</b> ${phone}
🎟️ <b>VIP Promo Code:</b> <code>${promoCode}</code> (15% OFF)

🍽️ <b>Selected Dishes / Order Preview:</b>
${favoriteDish}

⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} (WAT)
━━━━━━━━━━━━━━━━━━
<i>De-echoi Automated Storefront Alert</i>
`.trim()

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('[Telegram API Delivery Error]:', data.description)
      return false
    }

    console.log('[Telegram Notification Delivered Successfully]')
    return true
  } catch (err) {
    console.error('[Telegram Dispatch Failed]:', err)
    return false
  }
}