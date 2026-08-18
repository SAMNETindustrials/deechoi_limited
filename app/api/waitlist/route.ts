// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { sendWaitlistConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, favoriteDish, selectedItems = [], wantsTraining = false } = body

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and phone number are required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()
    const cleanPhone = phone.trim()
    const cleanDish = (favoriteDish || 'General Kitchen Menu & Celebration Cakes').trim()

    const supabase = createClient()

    // 1. Column-Safe Insert / Upsert into 'waitlist' or 'customer_inquiries'
    const recordPayload: Record<string, any> = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      favorite_dish: cleanDish,
      status: 'vip_registered',
      created_at: new Date().toISOString(),
    }

    // Try inserting into waitlist table
    const { data: waitlistRecord, error: insertError } = await supabase
      .from('waitlist')
      .upsert(recordPayload, { onConflict: 'email' })
      .select('*')
      .maybeSingle()

    // Fallback if 'waitlist' table does not exist: save into customer_inquiries
    if (insertError) {
      console.warn('[Waitlist DB Warning]:', insertError.message)
      await supabase
        .from('customer_inquiries')
        .insert({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          category: 'VIP Waitlist & Training',
          status: 'vip_waitlist',
          message: `VIP Waitlist Registration: ${cleanDish} | Wants Training: ${wantsTraining ? 'Yes' : 'No'}`,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle()
    }

    // 2. Dispatch Confirmation Email in a safe try-catch so email provider issues never fail the submission
    let emailSent = false
    try {
      await sendWaitlistConfirmationEmail({
        to: cleanEmail,
        customerName: cleanName,
        favoriteDish: cleanDish,
        voucherCode: 'DEECHOI15',
        discountPercent: '15%',
      })
      emailSent = true
    } catch (emailErr) {
      console.error('[Waitlist Email Error]:', emailErr)
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: 'Successfully registered for De-echoi Limited VIP Waitlist.',
      voucherCode: 'DEECHOI15',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error occurred.'
    console.error('[Waitlist Fatal Route Error]:', err)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}