import nodemailer from 'nodemailer'

interface SendWaitlistEmailParams {
  toEmail: string
  customerName: string
  promoCode: string
  favoriteDish: string
}

export async function sendWaitlistConfirmationEmail({
  toEmail,
  customerName,
  promoCode,
  favoriteDish,
}: SendWaitlistEmailParams) {
  const senderEmail = (process.env.GMAIL_SENDER_EMAIL || 'nwaobisikesamuel@gmail.com').trim()
  const rawPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim()

  if (!rawPass) {
    throw new Error('GMAIL_APP_PASSWORD is not configured in .env.local')
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: senderEmail,
      pass: rawPass,
    },
    connectionTimeout: 10000,
  })

  // 1. Plain Text Alternative (Crucial to prevent spam filter triggers)
  const textContent = `Hello ${customerName},

Welcome to De-echoi Limited VIP Priority List!

Your 15% Launch Discount Code: ${promoCode}

Selected Menu Summary:
${favoriteDish}

Kitchen Location: Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria.
Opening Hours: Monday – Friday: 9:00 AM – 5:30 PM | Sundays: 12:00 PM – 5:30 PM.

Thank you for choosing De-echoi Limited. We look forward to serving you on launch day!

Best regards,
The De-echoi Team`

  // 2. High-Deliverability Responsive HTML Template
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>De-echoi VIP Launch Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f6f8f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8e0; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          
          <!-- Clean Header -->
          <tr>
            <td style="background-color: #072d1d; padding: 28px 24px; text-align: center;">
              <h1 style="color: #EAA823; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: 0.5px;">DE-ECHOI LIMITED</h1>
              <p style="color: #d1fae5; font-size: 12px; margin: 4px 0 0 0; font-weight: 500;">VIP Priority Access Confirmation</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 30px 24px;">
              <h2 style="color: #072d1d; font-size: 18px; margin: 0 0 12px 0; font-weight: 700;">Hello ${customerName},</h2>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for joining our launch preview. Your priority reservation is confirmed, and your exclusive 15% discount voucher is ready for use on launch day.
              </p>

              <!-- Voucher Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fcf8ee; border: 1px dashed #d99a1c; border-radius: 14px; padding: 18px; text-align: center; margin: 20px 0;">
                <tr>
                  <td>
                    <span style="color: #78350f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px;">Your Personal Discount Code</span>
                    <span style="color: #072d1d; font-family: monospace, Courier, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: 3px; display: inline-block;">${promoCode}</span>
                    <p style="color: #92400e; font-size: 12px; margin: 6px 0 0 0; font-weight: 600;">15% discount applied at checkout</p>
                  </td>
                </tr>
              </table>

              <!-- Order Summary -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; margin: 20px 0;">
                <span style="color: #374151; font-size: 11px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">Your Selected Items:</span>
                <p style="color: #1f2937; font-size: 13px; margin: 0; line-height: 1.5;">${favoriteDish}</p>
              </div>

              <!-- Location & Hours -->
              <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                <strong>Kitchen Location:</strong> Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State.<br/>
                <strong>Opening Hours:</strong> Monday – Friday: 9:00 AM – 5:30 PM | Sundays: 12:00 PM – 5:30 PM.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.5;">
                De-echoi Limited &bull; Food Kitchen, Bakery &amp; Academy<br/>
                You received this because you registered on our website.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  // 3. Clean Subject & Professional Deliverability Headers
  const info = await transporter.sendMail({
    from: `"De-echoi Limited" <${senderEmail}>`,
    to: toEmail,
    replyTo: senderEmail,
    subject: `De-echoi Launch Confirmation - Code: ${promoCode}`,
    text: textContent,
    html: htmlContent,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Entity-Ref-ID': `DE-${Date.now()}`,
    },
  })

  return info
}