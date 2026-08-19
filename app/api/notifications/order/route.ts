import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { autoDetect, botToken, isTest, orderData } = body
    const supabase = getSupabaseClient()

    // 1. Auto-Detect Chat ID by querying getUpdates from Telegram
    if (autoDetect && botToken) {
      const cleanToken = botToken.trim()
      const url = `https://api.telegram.org/bot${cleanToken}/getUpdates`
      const tgRes = await fetch(url)
      const tgData = await tgRes.json()

      if (tgData.ok && tgData.result && tgData.result.length > 0) {
        const lastMsg = tgData.result[tgData.result.length - 1]
        const detectedChatId = lastMsg?.message?.chat?.id || lastMsg?.channel_post?.chat?.id

        if (detectedChatId) {
          return NextResponse.json({ success: true, detectedChatId: String(detectedChatId) })
        }
      }

      return NextResponse.json({
        success: false,
        error: 'No recent messages found. Open Telegram, search for your bot, and click START, then try again.',
      })
    }

    // 2. Fetch saved settings
    const { data: dbSettings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'notification_settings')
      .maybeSingle()

    const settings = dbSettings?.value || {}
    const activeBotToken = settings.telegram_bot_token?.trim() || process.env.TELEGRAM_BOT_TOKEN
    const activeChatId = settings.telegram_chat_id?.trim() || process.env.TELEGRAM_CHAT_ID

    if (!activeBotToken || !activeChatId) {
      return NextResponse.json({
        telegramSent: false,
        telegramError: 'Bot Token or Chat ID is missing in database settings.',
      })
    }

    let textToSend = ''

    if (isTest) {
      textToSend = `
🔔 <b>DE-ECHOI TELEGRAM ALERT TEST</b>
━━━━━━━━━━━━━━━━━━
✅ Your Telegram bot is active and successfully connected to the De-echoi Storefront!
⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })} (WAT)
━━━━━━━━━━━━━━━━━━
<i>De-echoi Kitchen System</i>
`.trim()
    } else if (orderData) {
      textToSend = `
🛍️ <b>NEW STORE ORDER RECEIVED</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> ${orderData.customer_name || 'Customer'}
📱 <b>Phone:</b> ${orderData.customer_phone || 'N/A'}
💰 <b>Amount:</b> ₦${Number(orderData.total_amount || 0).toLocaleString()}
📦 <b>Items:</b> ${orderData.items_summary || 'Food Menu Items'}
━━━━━━━━━━━━━━━━━━
<i>De-echoi Kitchen Orders</i>
`.trim()
    }

    const sendRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: activeChatId,
        text: textToSend,
        parse_mode: 'HTML',
      }),
    })

    const sendData = await sendRes.json()

    if (!sendData.ok) {
      return NextResponse.json({
        telegramSent: false,
        telegramError: sendData.description || 'Failed to deliver message via Telegram.',
      })
    }

    return NextResponse.json({ telegramSent: true, success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ telegramSent: false, telegramError: errorMsg }, { status: 500 })
  }
}