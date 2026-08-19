import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWaitlistConfirmationEmail } from '@/lib/email/send-waitlist-email'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

function generateUniquePromoCode(name: string): string {
  const cleanPrefix = name
    .trim()
    .split(' ')[0]
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'DE'
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `${cleanPrefix}-${randomSuffix}-VIP`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, favoriteDish, selectedItems, wantsTraining } = body

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name, email, and phone number are required.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone.trim()

    // 1. DUAL CHECK: Check if user exists by either EMAIL OR PHONE NUMBER
    const { data: existingUsers } = await supabase
      .from('waitlist')
      .select('*')
      .or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`)
      .limit(1)

    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null

    if (existingUser) {
      // Extract original promo code
      let existingPromo = existingUser.promo_code
      if (!existingPromo && existingUser.favorite_dish && existingUser.favorite_dish.includes('Code: ')) {
        existingPromo = existingUser.favorite_dish.split('Code: ')[1]?.trim()
      }
      if (!existingPromo) {
        existingPromo = generateUniquePromoCode(existingUser.name || cleanName)
      }

      // Re-send verification email silently in the background
      try {
        await sendWaitlistConfirmationEmail({
          toEmail: cleanEmail,
          customerName: existingUser.name || cleanName,
          promoCode: existingPromo,
          favoriteDish: existingUser.favorite_dish || favoriteDish || 'General Kitchen Menu & Cakes',
        })
      } catch (err) {
        console.warn('[Email Notice]:', err)
      }

      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        name: existingUser.name || cleanName,
        promoCode: existingPromo,
        favoriteDish: existingUser.favorite_dish || favoriteDish || 'General Kitchen Menu & Cakes',
        discountPercent: 15,
        message: `Thank you, you're already a VIP! Forgotten your code? Click preview to view your code.`,
      })
    }

    // 2. New User Registration
    const activePromoCode = generateUniquePromoCode(cleanName)

    const { error: insertError } = await supabase
      .from('waitlist')
      .insert({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        favorite_dish: `${favoriteDish || 'General Kitchen Menu'} | Code: ${activePromoCode}`,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.warn('[Waitlist Insert Warning]:', insertError.message)
    }

    // 3. Dispatch Automated Confirmation Email
    try {
      await sendWaitlistConfirmationEmail({
        toEmail: cleanEmail,
        customerName: cleanName,
        promoCode: activePromoCode,
        favoriteDish: favoriteDish || 'General Kitchen Menu & Cakes',
      })
    } catch (emailErr) {
      console.error('[Email Dispatch Notice]:', emailErr)
    }

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      name: cleanName,
      promoCode: activePromoCode,
      favoriteDish: favoriteDish || 'General Kitchen Menu & Cakes',
      discountPercent: 15,
      message: `Welcome to the VIP list, ${cleanName}! Your unique launch code is ${activePromoCode}.`,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error submitting waitlist'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}