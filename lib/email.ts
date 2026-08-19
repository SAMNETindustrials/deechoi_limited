import nodemailer from 'nodemailer'

export interface SendWaitlistEmailParams {
  toEmail: string
  customerName: string
  promoCode?: string
  favoriteDish?: string
}

export interface CustomerMessageEmailParams {
  to: string
  customerName?: string
  message: string
  subject?: string
}

export interface SendOrderEmailParams {
  toEmail: string
  customerName: string
  orderId: string
  items: Array<{
    name: string
    quantity: number
    price: number
    selected_options?: any
  }>
  totalAmount: number
  deliveryFee: number
  deliveryAddress: string
  paymentMethod: string
  transactionCode?: string
}

function getTransporter() {
  const senderEmail = (
    process.env.GMAIL_SENDER_EMAIL ||
    process.env.EMAIL_FROM ||
    'nwaobisikesamuel@gmail.com'
  ).trim()
  const rawPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim()

  if (!rawPass) {
    console.warn(
      '[Email Service Alert] GMAIL_APP_PASSWORD is not configured in environment variables. Mocking email delivery.'
    )
    return null
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: senderEmail,
      pass: rawPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
  })
}

/**
 * 1. Customer Support Desk Inquiry Reply Email
 */
export async function sendCustomerMessageEmail({
  to,
  customerName = 'Valued Customer',
  message,
  subject = 'New Message from De-echoi Support',
}: CustomerMessageEmailParams) {
  const senderEmail = (
    process.env.GMAIL_SENDER_EMAIL || 'nwaobisikesamuel@gmail.com'
  ).trim()
  const transporter = getTransporter()

  if (!transporter) {
    console.log(`[Mock Support Reply Email] Sent to ${to} (${customerName}): "${message}"`)
    return { success: true, mocked: true }
  }

  const plainText = `Hello ${customerName},

${message}

---
De-echoi Limited Customer Support Desk
Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria.
Phone: +234 703 138 5337`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>De-echoi Support Reply</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #FDFBF7; padding: 20px; color: #0A2E1D; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #EAA823; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
    <div style="background-color: #072d1d; text-align: center; padding: 22px; border-bottom: 1px solid #e5e7eb;">
      <h1 style="color: #EAA823; margin: 0; font-size: 22px; font-weight: 900;">DE-ECHOI LIMITED</h1>
      <p style="color: #d1fae5; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Customer Support Desk</p>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 15px; font-weight: bold; margin-bottom: 16px;">Hello ${customerName},</p>
      <div style="font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-line; background-color: #FDFBF7; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb;">
        ${message}
      </div>
    </div>

    <div style="text-align: center; padding: 16px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
      <p style="margin: 0;">De-echoi Limited &bull; Eze Nvuigwe Avenue, Woji, Port Harcourt</p>
      <p style="margin: 4px 0 0 0;">Tel: +234 703 138 5337</p>
    </div>
  </div>
</body>
</html>
`

  try {
    const info = await transporter.sendMail({
      from: `"De-echoi Support Desk" <${senderEmail}>`,
      to,
      replyTo: senderEmail,
      subject,
      text: plainText,
      html,
    })
    return { success: true, data: info }
  } catch (error: any) {
    console.error('[Email Error] Failed to send support reply email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 2. Waitlist Priority Access Confirmation Email
 */
export async function sendWaitlistConfirmationEmail(
  paramsOrEmail: SendWaitlistEmailParams | string,
  maybeName?: string
) {
  let toEmail = ''
  let customerName = 'Valued Customer'
  let promoCode = 'DEECHOI15'
  let favoriteDish = 'Gourmet Kitchen Selection'

  if (typeof paramsOrEmail === 'string') {
    toEmail = paramsOrEmail
    customerName = maybeName || 'Valued Customer'
  } else {
    toEmail = paramsOrEmail.toEmail
    customerName = paramsOrEmail.customerName || 'Valued Customer'
    promoCode = paramsOrEmail.promoCode || 'DEECHOI15'
    favoriteDish = paramsOrEmail.favoriteDish || 'Gourmet Kitchen Selection'
  }

  const senderEmail = (
    process.env.GMAIL_SENDER_EMAIL || 'nwaobisikesamuel@gmail.com'
  ).trim()
  const transporter = getTransporter()

  if (!transporter) {
    console.log(
      `[Mock Waitlist Email] Sent to ${toEmail} for ${customerName} (Code: ${promoCode})`
    )
    return { success: true, mocked: true }
  }

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>De-echoi VIP Launch Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f6f8f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8e0; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <tr>
            <td style="background-color: #072d1d; padding: 28px 24px; text-align: center;">
              <h1 style="color: #EAA823; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: 0.5px;">DE-ECHOI LIMITED</h1>
              <p style="color: #d1fae5; font-size: 12px; margin: 4px 0 0 0; font-weight: 500;">VIP Priority Access Confirmation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 24px;">
              <h2 style="color: #072d1d; font-size: 18px; margin: 0 0 12px 0; font-weight: 700;">Hello ${customerName},</h2>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for joining our launch preview. Your priority reservation is confirmed, and your exclusive 15% discount voucher is ready for use on launch day.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fcf8ee; border: 1px dashed #d99a1c; border-radius: 14px; padding: 18px; text-align: center; margin: 20px 0;">
                <tr>
                  <td>
                    <span style="color: #78350f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px;">Your Personal Discount Code</span>
                    <span style="color: #072d1d; font-family: monospace, Courier, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: 3px; display: inline-block;">${promoCode}</span>
                    <p style="color: #92400e; font-size: 12px; margin: 6px 0 0 0; font-weight: 600;">15% discount applied at checkout</p>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; margin: 20px 0;">
                <span style="color: #374151; font-size: 11px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">Your Selected Items:</span>
                <p style="color: #1f2937; font-size: 13px; margin: 0; line-height: 1.5;">${favoriteDish}</p>
              </div>
              <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                <strong>Kitchen Location:</strong> Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State.<br/>
                <strong>Opening Hours:</strong> Monday – Friday: 9:00 AM – 5:30 PM | Sundays: 12:00 PM – 5:30 PM.
              </p>
            </td>
          </tr>
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

  try {
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
        Importance: 'high',
        'X-Entity-Ref-ID': `DE-${Date.now()}`,
      },
    })
    return { success: true, data: info }
  } catch (error: any) {
    console.error('[Email Error] Failed to send waitlist confirmation:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 3. Customer Order Confirmation Email
 */
export async function sendOrderConfirmationEmail({
  toEmail,
  customerName,
  orderId,
  items,
  totalAmount,
  deliveryFee,
  deliveryAddress,
  paymentMethod,
  transactionCode,
}: SendOrderEmailParams) {
  const senderEmail = (
    process.env.GMAIL_SENDER_EMAIL || 'nwaobisikesamuel@gmail.com'
  ).trim()
  const transporter = getTransporter()

  if (!transporter) {
    console.log(`[Mock Order Email] Dispatched to ${toEmail} for Order #${orderId}`)
    return { success: true, mocked: true }
  }

  const itemsHtml = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 12px 0; font-size: 13px; color: #1f2937;">
          <strong>${item.name}</strong> x ${item.quantity}
          ${
            item.selected_options &&
            Array.isArray(item.selected_options) &&
            item.selected_options.length > 0
              ? `<br/><span style="font-size: 11px; color: #6b7280;">${item.selected_options
                  .map((o: any) => `${o.groupName}: ${o.optionName}`)
                  .join(', ')}</span>`
              : ''
          }
        </td>
        <td style="padding: 12px 0; font-size: 13px; text-align: right; font-weight: bold; color: #0A2E1D;">
          ₦${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('')

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - De-echoi Limited</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f6f8f5; padding: 25px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8e0; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <tr>
            <td style="background-color: #072d1d; padding: 26px 20px; text-align: center;">
              <h1 style="color: #EAA823; font-size: 22px; margin: 0; font-weight: 900; letter-spacing: 0.5px;">DE-ECHOI LIMITED</h1>
              <p style="color: #d1fae5; font-size: 12px; margin: 4px 0 0 0; font-weight: bold; text-transform: uppercase;">Order Confirmation & Receipt</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 22px;">
              <h2 style="color: #072d1d; font-size: 17px; margin: 0 0 10px 0;">Hello ${customerName},</h2>
              <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 0 0 18px 0;">
                Your order has been received and is being prepared in our kitchen!
              </p>
              <div style="background-color: #FDFBF7; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
                <table width="100%" style="font-size: 12px; color: #4b5563;">
                  <tr>
                    <td style="padding-bottom: 6px;"><strong>Order ID:</strong> #${orderId.slice(0, 8)}</td>
                    <td style="text-align: right; padding-bottom: 6px;"><strong>Payment:</strong> ${paymentMethod.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td><strong>Delivery Destination:</strong> ${deliveryAddress}</td>
                    ${
                      transactionCode
                        ? `<td style="text-align: right;"><strong>5-Digit PIN:</strong> <code style="font-size: 14px; font-weight: bold; color: #0A2E1D;">${transactionCode}</code></td>`
                        : ''
                    }
                  </tr>
                </table>
              </div>
              <h3 style="color: #072d1d; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 800;">Order Items Summary</h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                ${itemsHtml}
              </table>
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #6b7280;">
                  <span>Delivery Fee:</span>
                  <span style="font-weight: bold; color: #111827;">₦${deliveryFee.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #072d1d; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  <span>Total Paid / Payable:</span>
                  <span style="color: #072d1d;">₦${totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0;">
                📍 <strong>Kitchen Location:</strong> Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State.<br/>
                🕒 <strong>Service Hours:</strong> Monday – Friday: 9:00 AM – 5:30 PM | Sundays: 12:00 PM – 5:30 PM.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 18px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
              De-echoi Limited &bull; Quality made just for You &bull; Tel: +234 703 138 5337
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    const info = await transporter.sendMail({
      from: `"De-echoi Limited" <${senderEmail}>`,
      to: toEmail,
      replyTo: senderEmail,
      subject: `Order Confirmed #${orderId.slice(0, 8)} - De-echoi Limited`,
      text: `Hello ${customerName}, your order #${orderId.slice(0, 8)} for ₦${totalAmount.toLocaleString()} has been received and is being prepared for delivery to ${deliveryAddress}.`,
      html: htmlContent,
    })
    console.log(`[Order Email Success] Sent to ${toEmail} for #${orderId}`)
    return { success: true, data: info }
  } catch (error: any) {
    console.error('[Order Email Error]:', error)
    return { success: false, error: error.message }
  }
}