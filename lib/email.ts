import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://deechoi-limited.vercel.app'

export async function sendCustomerMessageEmail({
  to,
  customerName,
  message,
  senderName,
  inquiryId,
  isAutoReply = false,
}: {
  to: string
  customerName: string
  message: string
  senderName: string
  inquiryId: string
  isAutoReply?: boolean
}) {
  const resend = getResendClient()

  if (!resend) {
    console.warn('[Resend]: Skipping email dispatch. RESEND_API_KEY is not defined.')
    return { success: false, error: 'RESEND_API_KEY missing' }
  }

  const threadLink = `${APP_URL}/my-messages?thread=${inquiryId}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #FDFBF7; color: #0A2E1D; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e7eb; }
          .header { background: #072d1d; color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; color: #EAA823; letter-spacing: 1px; }
          .header p { margin: 5px 0 0 0; font-size: 12px; color: #a7f3d0; }
          .body { padding: 30px 25px; }
          .badge { display: inline-block; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 12px; margin-bottom: 15px; }
          .message-box { background: #FDFBF7; border-left: 4px solid #072d1d; padding: 18px; border-radius: 10px; margin: 15px 0 25px 0; font-size: 14px; line-height: 1.6; color: #1f2937; }
          .cta-btn { display: inline-block; background: #072d1d; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 28px; border-radius: 12px; margin: 10px 0; text-align: center; }
          .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; font-size: 11px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DE-ECHOI LIMITED</h1>
            <p>Authentic Flavors, Kitchen & Catering Support</p>
          </div>
          <div class="body">
            <span class="badge">${isAutoReply ? 'Instant AI Auto-Response' : 'Support Response from Admin'}</span>
            <p style="font-size: 15px; margin: 0 0 10px 0;">Hello <strong>${customerName}</strong>,</p>
            <p style="font-size: 13px; color: #4b5563; margin: 0 0 15px 0;">
              ${senderName} has sent you a message regarding your inquiry:
            </p>
            <div class="message-box">
              "${message}"
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${threadLink}" class="cta-btn">View & Reply on Your Dashboard</a>
            </div>
            <p style="font-size: 11px; color: #6b7280; text-align: center;">
              You can also reply to this thread anytime by visiting your <a href="${threadLink}" style="color: #072d1d; font-weight: bold;">Support Portal</a>.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2026 DE-ECHOI LIMITED &bull; Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'De-echoi Support <onboarding@resend.dev>'
    const response = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: isAutoReply ? 'We received your inquiry - De-echoi Limited' : 'New Response from De-echoi Support',
      html: htmlContent,
    })

    return { success: true, data: response.data }
  } catch (error) {
    console.error('[Resend Error]:', error)
    return { success: false, error }
  }
}