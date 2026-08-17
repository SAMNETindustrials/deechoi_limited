import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order, isTest, autoDetect, botToken } = body

    const supabase = createClient()

    // Auto-detect chat ID feature
    if (autoDetect && botToken) {
      const cleanToken = botToken.trim()
      const updatesRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates`)
      const updatesData = await updatesRes.json()

      if (!updatesData.ok) {
        return NextResponse.json({
          success: false,
          error: updatesData.description || 'Invalid Bot Token. Check token from @BotFather.',
        })
      }

      const results = updatesData.result || []
      if (results.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No messages found yet. Please open your bot in Telegram and click START, then try again.',
        })
      }

      // Grab the latest sender's chat ID
      const latestUpdate = results[results.length - 1]
      const detectedChatId = latestUpdate.message?.chat?.id || latestUpdate.channel_post?.chat?.id

      if (!detectedChatId) {
        return NextResponse.json({
          success: false,
          error: 'Could not extract Chat ID. Please send a message to your bot first.',
        })
      }

      return NextResponse.json({
        success: true,
        detectedChatId: String(detectedChatId),
      })
    }

    // 1. Fetch admin notification settings
    const { data: settingsRecord } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'notification_settings')
      .single()

    const settings = settingsRecord?.value || {
      telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
      telegram_chat_id: process.env.TELEGRAM_CHAT_ID || '',
      telegram_enabled: true,
      admin_email: process.env.ADMIN_NOTIFICATION_EMAIL || 'deechoi01@gmail.com',
      email_enabled: true,
    }

    const { telegram_bot_token, telegram_chat_id, telegram_enabled } = settings
    const cleanToken = String(telegram_bot_token || '').trim()
    const cleanChatId = String(telegram_chat_id || '').trim()

    let telegramSent = false
    let telegramError = null

    // 2. Format & Send Telegram Alert
    if (telegram_enabled && cleanToken && cleanChatId) {
      const itemsList = (order?.items || [])
        .map((it: any, idx: number) => {
          const name = it.name || it.product_name || 'Item'
          const qty = it.quantity || 1
          const price = Number(it.price || it.unit_price || 0)
          const options = it.selected_options
            ? Object.entries(it.selected_options).map(([k, v]) => `${k}: ${v}`).join(', ')
            : ''
          return `  ${idx + 1}. *${name}* x${qty} - ₦${(price * qty).toLocaleString()}${options ? `\n     _${options}_` : ''}`
        })
        .join('\n')

      const message = isTest
        ? `🔔 *DEECHOI NOTIFICATION TEST*\n\n✅ Your Telegram notification link is active and working correctly! You will receive instant order alerts directly to this chat.`
        : `🚨 *NEW ORDER RECEIVED!* 🎂🍲\n\n` +
          `👤 *Customer:* ${order.customer_name}\n` +
          `📞 *Phone:* \`${order.customer_phone}\`\n` +
          `📧 *Email:* ${order.customer_email}\n` +
          `📍 *Delivery Address:*\n${order.delivery_address}, ${order.delivery_city}\n\n` +
          `🛒 *Items Ordered:*\n${itemsList || '  (No items parsed)'}\n\n` +
          `🛵 *Delivery Fee:* ₦${Number(order.delivery_fee || 0).toLocaleString()}\n` +
          `💰 *Total Amount:* ₦${Number(order.total_amount || 0).toLocaleString()}\n` +
          `💳 *Payment Method:* ${order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card'}\n` +
          `🆔 *Order ID:* \`${order.id}\`\n\n` +
          (order.payment_proof_url ? `📎 [View Payment Proof Receipt](${order.payment_proof_url})\n\n` : '') +
          `⚡ _Log in to the Admin Dashboard to verify payment and dispatch!_`

      try {
        const tgRes = await fetch(
          `https://api.telegram.org/bot${cleanToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              text: message,
              parse_mode: 'Markdown',
              disable_web_page_preview: false,
            }),
          }
        )

        const tgData = await tgRes.json()
        telegramSent = tgData.ok
        if (!tgData.ok) {
          telegramError = tgData.description
        }
      } catch (err: any) {
        telegramError = err.message
      }
    }

    return NextResponse.json({
      success: true,
      telegramSent,
      telegramError,
    })
  } catch (error: any) {
    console.error('Notification dispatch error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}