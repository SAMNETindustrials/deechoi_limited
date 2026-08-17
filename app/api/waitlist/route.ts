import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, favoriteDish } = body

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone number are required.' }, { status: 400 })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const cleanName = String(name).trim()
    const cleanPhone = String(phone).trim()
    const cleanDish = favoriteDish ? String(favoriteDish).trim() : null

    const supabase = createClient()

    // 1. Save entry in waitlist_entries
    const { data: entry, error: insertErr } = await supabase
      .from('waitlist_entries')
      .upsert(
        {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          favorite_dish: cleanDish,
        },
        { onConflict: 'email' }
      )
      .select()
      .single()

    if (insertErr) {
      console.error('Waitlist insertion error:', insertErr)
      throw insertErr
    }

    // 2. Send Telegram Notification
    try {
      const { data: settingsRecord } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'notification_settings')
        .single()

      const settings = settingsRecord?.value || {}
      if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
        const tgText =
          `🌟 *NEW WAITLIST SUBSCRIBER!*\n\n` +
          `👤 *Name:* ${cleanName}\n` +
          `📧 *Email:* ${cleanEmail}\n` +
          `📞 *Phone:* \`${cleanPhone}\`\n` +
          (cleanDish ? `🍽️ *Favorite Meal:* _${cleanDish}_\n\n` : '\n') +
          `🎉 _User joined the 10-day Launch Waitlist!_`

        fetch(`https://api.telegram.org/bot${settings.telegram_bot_token.trim()}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegram_chat_id.trim(),
            text: tgText,
            parse_mode: 'Markdown',
          }),
        }).catch((err) => console.warn('Telegram waitlist notify warning:', err))
      }
    } catch (tgEx) {
      console.warn('Telegram error:', tgEx)
    }

    // 3. Send VIP Confirmation Email if API key is provided
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FDFBF7; color: #0A2E1D; margin: 0; padding: 20px; }
              .card { max-width: 550px; margin: auto; background: #ffffff; border-radius: 20px; padding: 35px; border: 1px solid #e5e7eb; text-align: center; }
              .header h1 { margin: 0; color: #072d1d; font-size: 22px; }
              .badge { display: inline-block; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 12px; margin-top: 10px; }
              .code-box { background: #072d1d; color: #EAA823; font-size: 24px; font-weight: 900; letter-spacing: 2px; padding: 15px; border-radius: 12px; margin: 20px 0; }
              .footer { font-size: 11px; color: #9ca3af; margin-top: 25px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1>DE-ECHOI LIMITED</h1>
                <span class="badge">VIP WAITLIST CONFIRMATION</span>
              </div>
              <p style="font-size: 16px; margin-top: 20px;">Welcome aboard, <strong>${cleanName}</strong>!</p>
              <p style="font-size: 13px; color: #4b5563; line-height: 1.6;">
                You are officially on the priority waitlist. Our kitchen doors and live ordering system open in <strong>10 Days</strong>.
              </p>
              <p style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">Your Launch Day VIP Voucher:</p>
              <div class="code-box">DEECHOI15</div>
              <p style="font-size: 12px; color: #6b7280;">Enjoy 15% OFF your first meal or celebration cake order on launch day.</p>
              <div class="footer">
                <p>&copy; 2026 DE-ECHOI LIMITED &bull; Eze Nvuigwe Avenue, Woji, Port Harcourt</p>
              </div>
            </div>
          </body>
        </html>
      `

      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'De-echoi Limited <onboarding@resend.dev>',
        to: [cleanEmail],
        subject: '🎉 You are on the VIP Waitlist! - De-echoi Limited',
        html: htmlContent,
      }).catch((e) => console.warn('Resend waitlist email warning:', e))
    }

    return NextResponse.json({ success: true, entry })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}