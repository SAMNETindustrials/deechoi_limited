import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'De-echoi Limited <orders@deechoi.com>'

// ==========================================
// 1. Send Customer Support / Message Reply Email
// ==========================================
export interface CustomerMessageEmailProps {
  to: string
  customerName: string
  message: string
  senderName?: string
  inquiryId?: string
  isAutoReply?: boolean
}

export async function sendCustomerMessageEmail({
  to,
  customerName,
  message,
  senderName = 'De-echoi Support',
  inquiryId,
  isAutoReply = false,
}: CustomerMessageEmailProps) {
  if (!to) return { success: false, reason: 'Recipient email is missing' }

  if (!resend) {
    console.warn('[Email Notice]: RESEND_API_KEY is not set. Skipping message email dispatch.')
    return { success: false, reason: 'Resend API key not configured' }
  }

  const portalUrl = inquiryId 
    ? `https://deechoi-limited.vercel.app/my-messages?thread=${inquiryId}`
    : `https://deechoi-limited.vercel.app/my-messages`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: #072d1d; padding: 28px 24px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(234, 168, 35, 0.2); border: 1px solid #EAA823; color: #EAA823; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 8px; }
          .title { font-size: 20px; font-weight: 900; margin: 0; color: #ffffff; }
          .content { padding: 28px 24px; color: #0A2E1D; line-height: 1.6; font-size: 14px; }
          .message-box { background: #FDFBF7; border-left: 4px solid #EAA823; border-radius: 0 16px 16px 0; padding: 16px; margin: 20px 0; font-size: 13px; color: #1f2937; }
          .btn { display: inline-block; background: #072d1d; color: #ffffff !important; font-weight: 800; font-size: 12px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin-top: 16px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Support & Order Update</span>
            <h1 class="title">New Message from ${senderName}</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>You have received a response regarding your inquiry/order with De-echoi Limited:</p>
            
            <div class="message-box">
              ${message.replace(/\n/g, '<br/>')}
            </div>

            <div style="text-align: center;">
              <a href="${portalUrl}" class="btn">View & Reply in Customer Portal →</a>
            </div>

            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
              You can track your live orders, payment receipts, and active conversations directly in your dashboard.
            </p>
          </div>
          <div class="footer">
            <strong>De-echoi Limited</strong> &bull; Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State.<br>
            Hotline: +234 704 614 5982 &bull; Kitchen Hours: 8:00 AM – 9:00 PM
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `💬 Update from De-echoi Limited (${senderName})`,
      html: htmlContent,
    })
    return { success: true, data: result }
  } catch (err: any) {
    console.error('[Resend Customer Message Error]:', err)
    return { success: false, error: err.message }
  }
}

// ==========================================
// 2. Send VIP Waitlist Confirmation Email
// ==========================================
export interface WaitlistEmailProps {
  to: string
  customerName: string
  favoriteDish: string
  voucherCode?: string
  discountPercent?: string
}

export async function sendWaitlistConfirmationEmail({
  to,
  customerName,
  favoriteDish,
  voucherCode = 'DEECHOI15',
  discountPercent = '15%',
}: WaitlistEmailProps) {
  if (!to) return { success: false, reason: 'Recipient email is missing' }

  if (!resend) {
    console.warn('[Email Notice]: RESEND_API_KEY is not set. Skipping waitlist email dispatch.')
    return { success: false, reason: 'Resend API key not configured' }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: #072d1d; padding: 32px 24px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(234, 168, 35, 0.2); border: 1px solid #EAA823; color: #EAA823; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 900; margin: 0; color: #ffffff; }
          .content { padding: 32px 24px; color: #0A2E1D; line-height: 1.6; font-size: 14px; }
          .voucher-box { background: #072d1d; border: 2px dashed #EAA823; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
          .voucher-code { font-family: monospace; font-size: 28px; font-weight: 900; color: #EAA823; letter-spacing: 4px; margin: 8px 0; }
          .dish-card { background: #FDFBF7; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin: 16px 0; font-size: 13px; color: #374151; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">VIP Access Confirmed</span>
            <h1 class="title">You're on the De-echoi VIP List! 🎉</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>Thank you for joining our exclusive 10-day launch waitlist! Your <strong>${discountPercent} VIP Launch Voucher</strong> is ready for launch day:</p>
            
            <div class="voucher-box">
              <span style="color: #d1fae5; font-size: 11px; font-weight: bold; text-transform: uppercase;">Your ${discountPercent} Launch Voucher</span>
              <div class="voucher-code">${voucherCode}</div>
              <span style="color: #9ca3af; font-size: 11px;">Valid on your first order across Port Harcourt delivery zones.</span>
            </div>

            <div class="dish-card">
              <strong style="color: #072d1d; display: block; margin-bottom: 4px;">Your Selected Menu Preferences:</strong>
              <span>${favoriteDish}</span>
            </div>

            <p>We will notify you via WhatsApp and Email the instant ordering opens. Get ready for authentic taste crafted with love!</p>
          </div>
          <div class="footer">
            <strong>De-echoi Limited</strong> &bull; Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State.<br>
            Fresh Cooked Meals &bull; Shawarma &bull; Celebration Cakes &bull; Culinary Academy
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '🎉 Your 15% VIP Launch Voucher - De-echoi Limited',
      html: htmlContent,
    })
    return { success: true, data: result }
  } catch (err: any) {
    console.error('[Resend Waitlist Error]:', err)
    return { success: false, error: err.message }
  }
}