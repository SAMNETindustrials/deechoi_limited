import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailReply } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Safely destructure variables mapping to the new Admin frontend payload
    // We include fallbacks for older payload formats just in case
    const { 
      inquiryId, 
      messageId, 
      message, 
      replyMessage, 
      replyText, 
      to, 
      toEmail, 
      customerEmail, 
      subject,
      type,
      metadata,
      senderName
    } = body

    // Fallbacks to handle both older requests and the new payload
    const finalInquiryId = inquiryId || messageId
    const finalEmail = to || toEmail || customerEmail
    const finalMessage = message || replyMessage || replyText
    const finalSubject = subject || 'Reply from De-echoi Support'

    if (!finalInquiryId || !finalEmail || !finalMessage) {
      return NextResponse.json(
        { error: 'Missing required fields (inquiryId, email, message)' },
        { status: 400 }
      )
    }

    // Initialize Supabase Admin client to bypass RLS for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    // 1. Send the email using the lib function
    const emailResult = await sendEmailReply(finalEmail, finalSubject, finalMessage)

    if (!emailResult.success) {
      console.warn('Failed to send email reply:', emailResult.error)
      // We log the warning but don't strictly fail the request, 
      // so the admin chat message still goes through successfully.
    }

    // 2. Insert the message into the database
    // The frontend expects the inserted message object back to replace the temporary optimistic message
    const { data: insertedMessage, error: dbError } = await supabase
      .from('inquiry_messages') 
      .insert({
        inquiry_id: finalInquiryId,
        sender_type: 'admin',
        sender_name: senderName || 'De-echoi Support',
        message: finalMessage,
        type: type || 'text',
        metadata: metadata || {}
      })
      .select('*')
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json(
        { error: 'Email processed but failed to save message to database.' },
        { status: 500 }
      )
    }
    
    // 3. Update the thread's last_message_at timestamp so it jumps to top of the admin inbox
    await supabase
      .from('customer_inquiries')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', finalInquiryId)

    // Return the inserted message back to the frontend so it replaces the loading state
    return NextResponse.json({ success: true, data: insertedMessage })

  } catch (error: any) {
    console.error('API Route Error (/api/admin/messages/reply):', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}