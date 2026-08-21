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
    const { email, subject, message } = await req.json()

    if (!email || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 })
    }

    const senderEmail = (process.env.GMAIL_SENDER_EMAIL || 'nwaobisikesamuel@gmail.com').trim()
    const transporter = getTransporter()

    if (!transporter) {
      console.log(`[Mock Email Route] To: ${email} | Subject: ${subject} | Message: ${message}`)
      return NextResponse.json({ success: true, mocked: true })
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject || 'De-echoi Limited Notice'}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #FDFBF7; padding: 20px; color: #0A2E1D; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #EAA823; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
    <div style="background-color: #072d1d; text-align: center; padding: 22px; border-bottom: 1px solid #e5e7eb;">
      <h1 style="color: #EAA823; margin: 0; font-size: 22px; font-weight: 900;">DE-ECHOI LIMITED</h1>
      <p style="color: #d1fae5; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Secure Transaction Service</p>
    </div>

    <div style="padding: 24px;">
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

    await transporter.sendMail({
      from: `"De-echoi Limited" <${senderEmail}>`,
      to: email,
      replyTo: senderEmail,
      subject: subject || 'De-echoi Notification',
      text: message,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API Email Dispatch Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}