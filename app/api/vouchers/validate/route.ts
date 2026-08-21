import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { code, email } = await req.json()
    const cleanCode = (code || '').trim().toUpperCase()

    if (!cleanCode) {
      return NextResponse.json({ valid: false, message: 'Please enter a voucher code.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // 1. Check if the unique claim exists in store_event_claims
    const { data: claim } = await supabase
      .from('store_event_claims')
      .select('*, store_events(title, is_active)')
      .eq('promo_code', cleanCode)
      .maybeSingle()

    if (claim) {
      if (claim.status === 'redeemed') {
        return NextResponse.json({ valid: false, message: 'This unique voucher has already been redeemed.' })
      }

      return NextResponse.json({
        valid: true,
        discountPercentage: claim.discount_percentage || 15,
        code: claim.promo_code,
        message: `Voucher applied: ${claim.discount_percentage}% discount granted!`
      })
    }

    // 2. Fallback check on master promo events (e.g. DEECHOI15)
    const { data: event } = await supabase
      .from('store_events')
      .select('*')
      .eq('is_active', true)
      .ilike('discount_code', cleanCode)
      .maybeSingle()

    if (event) {
      const discountPercentage = parseFloat(event.discount_percentage?.replace(/[^0-9.]/g, '') || '15') || 15
      return NextResponse.json({
        valid: true,
        discountPercentage,
        code: cleanCode,
        message: `Promo code applied: ${discountPercentage}% discount granted!`
      })
    }

    return NextResponse.json({
      valid: false,
      message: 'Invalid or expired voucher code. Check your code and try again.'
    })
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: error.message || 'Validation error' }, { status: 500 })
  }
}