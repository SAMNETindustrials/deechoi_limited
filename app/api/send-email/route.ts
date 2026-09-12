import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

function getTransporter() {
  const senderEmail = (
    process.env.GMAIL_SENDER_EMAIL ||
    process.env.EMAIL_FROM ||
    'nwaobisikesamuel@gmail.com'
  ).trim()
  const rawPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim()

  if (!rawPass) {
    console.warn('[Email Service Alert] GMAIL_APP_PASSWORD is not configured.')
    return null
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, subject, message, receipt } = body

    if (!email && !receipt?.customer_email) {
      return NextResponse.json({ error: 'Email destination is required' }, { status: 400 })
    }

    const recipientEmail = email || receipt?.customer_email
    const emailSubject = subject || (receipt ? `Official Order Invoice & Receipt - Ref: ${receipt.receipt_number}` : 'De-echoi Notification')
    
    let messageContent = message
    let itemsHtmlTable = ''

    if (receipt) {
      const itemsList = receipt.items || []
      const itemsTextList = itemsList
        .map(
          (item: any, idx: number) =>
            `${idx + 1}. ${item.item_name} (${item.quantity} ${item.unit}) @ ₦${Number(item.unit_price).toLocaleString()} = ₦${(item.quantity * item.unit_price).toLocaleString()}`
        )
        .join('\n')

      messageContent = `
Dear ${receipt.customer_name || 'Valued Customer'},

Thank you for your order! Below is your official order invoice and payment receipt.

INVOICE REF: ${receipt.receipt_number}
DATE: ${new Date(receipt.created_at || Date.now()).toLocaleDateString(undefined, { dateStyle: 'full' })}
STATUS: PAID / CONFIRMED

----------------------------------------
ORDERED ITEMS:
----------------------------------------
${itemsTextList}

----------------------------------------
FINANCIAL SUMMARY:
----------------------------------------
Subtotal: ₦${Number(receipt.subtotal || 0).toLocaleString()}
${receipt.vat_amount > 0 ? `VAT: ₦${Number(receipt.vat_amount || 0).toLocaleString()}\n` : ''}${receipt.discount_amount > 0 ? `Discount: -₦${Number(receipt.discount_amount || 0).toLocaleString()}\n` : ''}TOTAL AMOUNT PAID: ₦${Number(receipt.total_amount || 0).toLocaleString()}

Notes: ${receipt.notes || 'N/A'}
      `.trim()

      itemsHtmlTable = `
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
          <thead>
            <tr style="background-color: #072d1d; color: #fff;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">#</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item Description</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Unit Price</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList.map((it: any, idx: number) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${idx + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>${it.item_name}</strong> (${it.unit})</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${it.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₦${Number(it.unit_price).toLocaleString()}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>₦${(it.quantity * it.unit_price).toLocaleString()}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 15px; font-size: 14px;">
          <p style="margin: 4px 0;">Subtotal: <strong>₦${Number(receipt.subtotal || 0).toLocaleString()}</strong></p>
          ${receipt.vat_amount > 0 ? `<p style="margin: 4px 0;">VAT: <strong>₦${Number(receipt.vat_amount || 0).toLocaleString()}</strong></p>` : ''}
          ${receipt.discount_amount > 0 ? `<p style="margin: 4px 0; color: #d97706;">Discount: <strong>-₦${Number(receipt.discount_amount || 0).toLocaleString()}</strong></p>` : ''}
          <p style="margin: 8px 0; font-size: 16px; color: #072d1d;"><strong>Grand Total: ₦${Number(receipt.total_amount || 0).toLocaleString()}</strong></p>
        </div>
      `
    }

    if (!messageContent) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const senderEmail = (process.env.GMAIL_SENDER_EMAIL || 'nwaobisikesamuel@gmail.com').trim()
    const transporter = getTransporter()

    if (!transporter) {
      console.log(`[Mock Email Route] To: ${recipientEmail} | Subject: ${emailSubject} | Message: ${messageContent}`)
      return NextResponse.json({ success: true, mocked: true })
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #FDFBF7; padding: 20px; color: #0A2E1D; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #EAA823; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
    <div style="background-color: #072d1d; text-align: center; padding: 22px; border-bottom: 1px solid #e5e7eb;">
      <h1 style="color: #EAA823; margin: 0; font-size: 22px; font-weight: 900;">DE-ECHOI LIMITED</h1>
      <p style="color: #d1fae5; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Official Transaction Receipt & Invoice</p>
    </div>

    <div style="padding: 24px;">
      ${receipt ? `
        <div style="margin-bottom: 15px; font-size: 13px; color: #374151;">
          <p style="margin: 2px 0;"><strong>Customer:</strong> ${receipt.customer_name}</p>
          <p style="margin: 2px 0;"><strong>Receipt Ref:</strong> ${receipt.receipt_number}</p>
          <p style="margin: 2px 0;"><strong>Date:</strong> ${new Date(receipt.created_at || Date.now()).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
        </div>
        ${itemsHtmlTable}
      ` : `
        <div style="font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-line; background-color: #FDFBF7; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb;">
          ${messageContent}
        </div>
      `}
    </div>

    <div style="text-align: center; padding: 16px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
      <p style="margin: 0;">De-echoi Limited &bull; Eze Nvuigwe Avenue, Woji, Port Harcourt</p>
      <p style="margin: 4px 0 0 0;">Tel: +234 704 614 5982 &bull; Email: deechoi01@gmail.com</p>
    </div>
  </div>
</body>
</html>
`

    await transporter.sendMail({
      from: `"De-echoi Limited" <${senderEmail}>`,
      to: recipientEmail,
      replyTo: senderEmail,
      subject: emailSubject,
      text: messageContent,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API Email Dispatch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}