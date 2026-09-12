import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
// @ts-ignore
import htmlPdf from 'html-pdf-node'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SENDER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { receipt, campaign, authorizedSignature, companyStamp } = body

    // Handle Campaign / Promotional Broadcast Emails
    if (campaign) {
      const { subject, messageBody, imageUrl, email } = campaign
      if (!email || !subject || !messageBody) {
        return NextResponse.json(
          { success: false, error: 'Missing campaign email details, subject, or message body.' },
          { status: 400 }
        )
      }

      const campaignHtmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${subject}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #111; }
              .email-wrapper { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
              .header { background: #0A2E1D; color: #ffffff; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
              .header p { margin: 5px 0 0 0; color: #EAA823; font-size: 12px; text-transform: uppercase; font-weight: bold; }
              .body-content { padding: 30px; }
              .campaign-banner { width: 100%; max-height: 280px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; }
              .message-text { font-size: 15px; line-height: 1.6; color: #374151; white-space: pre-wrap; }
              .footer { background: #0F1419; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <h1>DEECHOI LIMITED</h1>
                <p>Bakery, Kitchen & Event Catering Operations</p>
              </div>
              <div class="body-content">
                ${imageUrl ? `<img src="${imageUrl}" class="campaign-banner" alt="Promo Banner" />` : ''}
                <h2 style="color: #0A2E1D; margin-top: 0; font-size: 20px;">${subject}</h2>
                <div class="message-text">
                  ${messageBody}
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} De-echoi Limited. All rights reserved.<br/>Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State.</p>
              </div>
            </div>
          </body>
        </html>
      `

      await transporter.sendMail({
        from: `"De-echoi Limited" <${process.env.GMAIL_SENDER_EMAIL}>`,
        to: email,
        subject: subject,
        html: campaignHtmlContent,
      })

      return NextResponse.json({
        success: true,
        message: `Promotional campaign email successfully dispatched to ${email}`
      })
    }

    // Handle Standard Customer Receipts / Invoices
    if (!receipt || !receipt.customer_email) {
      return NextResponse.json(
        { success: false, error: 'Missing receipt details or customer email.' },
        { status: 400 }
      )
    }

    const rowsHtml = receipt.items && receipt.items.length > 0
      ? receipt.items.map((it: any, idx: number) => `
          <tr>
            <td style="border: 1px solid #e5e5e5; padding: 10px 12px; font-size: 13px;">${idx + 1}</td>
            <td style="border: 1px solid #e5e5e5; padding: 10px 12px; font-size: 13px;"><strong>${it.item_name || 'Item'}</strong> (${it.unit || 'pcs'})</td>
            <td style="border: 1px solid #e5e5e5; padding: 10px 12px; font-size: 13px; text-align:center;">${it.quantity}</td>
            <td style="border: 1px solid #e5e5e5; padding: 10px 12px; font-size: 13px; text-align:right;">₦${Number(it.unit_price || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e5e5; padding: 10px 12px; font-size: 13px; text-align:right;"><strong>₦${(Number(it.quantity || 1) * Number(it.unit_price || 0)).toLocaleString()}</strong></td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" style="border: 1px solid #e5e5e5; text-align:center; padding:15px; font-size: 13px;">Customer Order Items</td></tr>`

    const exactTemplateHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Customer Receipt - ${receipt.receipt_number}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #111; background-color: #ffffff; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; position: relative; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0A2E1D; padding-bottom: 15px; margin-bottom: 20px; }
            .brand h1 { margin: 0; color: #0A2E1D; font-size: 24px; }
            .brand p { margin: 2px 0 0 0; color: #666; font-size: 12px; }
            .doc-title { text-align: right; }
            .doc-title h2 { margin: 0; color: #0A2E1D; font-size: 20px; text-transform: uppercase; }
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; background: #fafafa; padding: 12px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            th, td { border: 1px solid #e5e5e5; padding: 10px 12px; text-align: left; }
            th { background-color: #0A2E1D; color: #fff; font-size: 12px; text-transform: uppercase; }
            .totals-section { width: 300px; margin-left: auto; margin-top: 20px; font-size: 13px; }
            .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .totals-row.grand { font-size: 16px; font-weight: bold; color: #0A2E1D; border-bottom: 2px solid #0A2E1D; margin-top: 5px; padding-top: 8px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; align-items: flex-end; }
            .sig-box { text-align: center; width: 200px; }
            .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 12px; font-weight: bold; }
            .stamp-img { max-height: 90px; max-width: 120px; object-fit: contain; }
            .sig-img { max-height: 50px; max-width: 120px; object-fit: contain; display: block; margin: 0 auto 5px auto; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="brand">
                <h1>DEECHOI LIMITED</h1>
                <p>Bakery, Kitchen & Event Catering Operations</p>
                <p>Eze Nvuigwe Avenue, Woji, Port Harcourt</p>
                <p>Email: deechoi01@gmail.com &bull; Tel: +234 7046145982</p>
              </div>
              <div class="doc-title">
                <h2>Official Order Invoice / Receipt</h2>
                <p><strong>Receipt Ref:</strong> ${receipt.receipt_number}</p>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <p><strong>Customer Name:</strong> ${receipt.customer_name}</p>
                <p><strong>Email:</strong> ${receipt.customer_email}</p>
                <p><strong>Phone:</strong> ${receipt.customer_phone}</p>
                <p><strong>Address:</strong> ${receipt.customer_address}</p>
              </div>
              <div style="text-align: right;">
                <p><strong>Date:</strong> ${new Date(receipt.created_at || Date.now()).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">PAID / CONFIRMED</span></p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Item Description</th>
                  <th style="text-align:center;">Quantity</th>
                  <th style="text-align:right;">Unit Price</th>
                  <th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>₦${Number(receipt.subtotal || 0).toLocaleString()}</span>
              </div>
              ${Number(receipt.vat_amount || 0) > 0 ? `
              <div class="totals-row">
                <span>VAT:</span>
                <span>₦${Number(receipt.vat_amount || 0).toLocaleString()}</span>
              </div>` : ''}
              ${Number(receipt.discount_amount || 0) > 0 ? `
              <div class="totals-row" style="color: #d97706;">
                <span>Discount:</span>
                <span>-₦${Number(receipt.discount_amount || 0).toLocaleString()}</span>
              </div>` : ''}
              <div class="totals-row grand">
                <span>Total Amount:</span>
                <span>₦${Number(receipt.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div class="signatures">
              <div class="sig-box">
                ${companyStamp ? `<img src="${companyStamp}" class="stamp-img" alt="Company Stamp" />` : '<div style="height:60px; border: 1px dashed #ccc; display:flex; align-items:center; justify-content:center; font-size:10px; color:#888;">Company Stamp</div>'}
                <p style="font-size:11px; margin-top:5px; color:#555;">Official Stamp</p>
              </div>
              <div class="sig-box">
                ${authorizedSignature ? `<img src="${authorizedSignature}" class="sig-img" alt="Authorized Signature" />` : ''}
                <div class="sig-line">Authorized Signature</div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your patronage! &bull; De-echoi Limited Customer Receipt</p>
            </div>
          </div>
        </body>
      </html>
    `

    const pdfFile = await htmlPdf.generatePdf({ content: exactTemplateHtml }, { format: 'A4', printBackground: true })

    const emailHtmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #111; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #0A2E1D; margin-top: 0;">DEECHOI LIMITED - Order Receipt</h2>
        <p>Dear <strong>${receipt.customer_name}</strong>,</p>
        <p>Thank you for your order with De-echoi Limited! Your transaction has been confirmed and processed successfully.</p>
        <p><strong>Receipt Reference:</strong> ${receipt.receipt_number}</p>
        <p><strong>Grand Total:</strong> ₦${Number(receipt.total_amount || 0).toLocaleString()}</p>
        <p style="background: #eef2f1; padding: 12px; border-radius: 8px; font-size: 13px; color: #0A2E1D;">
          <strong>Download Your Invoice PDF:</strong> Your official signed and stamped invoice PDF document is attached to this email. You can download or print it directly at any time.
        </p>
        <p style="margin-top: 25px; font-size: 12px; color: #666;">Warm regards,<br><strong>De-echoi Limited Team</strong><br>Woji, Port Harcourt</p>
      </div>
    `

    await transporter.sendMail({
      from: `"De-echoi Limited" <${process.env.GMAIL_SENDER_EMAIL}>`,
      to: receipt.customer_email,
      subject: `Official Order Invoice & Receipt - ${receipt.receipt_number}`,
      html: emailHtmlContent,
      attachments: [
        {
          filename: `De-echoi-Invoice-${receipt.receipt_number}.pdf`,
          content: pdfFile,
          contentType: 'application/pdf',
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: `Exact layout PDF invoice successfully attached and dispatched to ${receipt.customer_email}`
    })
  } catch (error: any) {
    console.error('Error generating PDF or sending email via Gmail SMTP:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}