import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTelegramWaitlistNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customerName, name, email, phone, favoriteDish, promoCode, selectedItems, wantsTraining } = body

    const finalName = customerName || name
    if (!finalName || !email || !phone || !promoCode) {
      return NextResponse.json(
        { error: 'Name, email, phone, and promo code are required.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = promoCode.trim().toUpperCase()
    const cleanFavoriteDish = favoriteDish || 'General Menu'

    // 1. Check if already registered
    const { data: existing } = await supabase
      .from('vip_waitlist')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle()

    let isReturning = false
    if (existing) {
      isReturning = true
    } else {
      // Insert into vip_waitlist
      const { error: waitlistErr } = await supabase
        .from('vip_waitlist')
        .insert({
          customer_name: finalName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          favorite_dish: cleanFavoriteDish,
          promo_code: cleanCode,
        })

      if (waitlistErr) {
        console.warn('Waitlist insert notice:', waitlistErr.message)
      }
    }

    // 2. Ensure voucher claim is recorded in store_event_claims
    try {
      await supabase
        .from('store_event_claims')
        .upsert({
          customer_email: cleanEmail,
          promo_code: cleanCode,
          discount_percentage: 15,
          status: 'active',
          claimed_at: new Date().toISOString(),
        }, { onConflict: 'customer_email,promo_code' })
    } catch (claimErr) {
      console.warn('Store event claim sync notice:', claimErr)
    }

    // 3. Send detailed Telegram Notification with selected items
    try {
      await sendTelegramWaitlistNotification({
        customerName: finalName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        promoCode: cleanCode,
        favoriteDish: cleanFavoriteDish,
        selectedItems: selectedItems || [],
        wantsTraining: Boolean(wantsTraining),
        isReturning,
      })
    } catch (telegramErr) {
      console.warn('Waitlist Telegram alert notice:', telegramErr)
    }

    return NextResponse.json({
      success: true,
      promoCode: cleanCode,
      alreadyRegistered: isReturning,
      message: 'VIP registration successful and voucher saved to your wallet!',
    })
  } catch (err: any) {
    console.error('Waitlist API Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to process waitlist registration.' },
      { status: 500 }
    )
  }
}