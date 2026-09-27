import { NextResponse } from 'next/server'
import { sendStudentMessageEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentMessage, to, subject, message } = body

    // Handle student messages from the training academy modal
    const targetEmail = studentMessage?.to || to
    const targetSubject = studentMessage?.subject || subject
    const targetMessage = studentMessage?.message || message

    if (!targetEmail || !targetSubject || !targetMessage) {
      return NextResponse.json(
        { success: false, error: 'Missing required email fields (to, subject, message).' },
        { status: 400 }
      )
    }

    const result = await sendStudentMessageEmail(targetEmail, targetSubject, targetMessage)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch email via SMTP.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email successfully dispatched to ${targetEmail}`,
    })
  } catch (error: any) {
    console.error('API Send Email Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}