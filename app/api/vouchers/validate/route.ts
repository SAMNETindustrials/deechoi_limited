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

    let claimRecord: any = null
    let discountPct = 15

    // 1. Check store_event_claims table first
    const { data: claim } = await supabase
      .from('store_event_claims')
      .select('*')
      .eq('promo_code', cleanCode)
      .maybeSingle()

    if (claim) {
      claimRecord = claim
      discountPct = Number(claim.discount_percentage) || 15
    }

    // 2. If not in claims, check vip_waitlist table (Waitlist & Launch codes)
    if (!claimRecord) {
      const { data: waitlistEntry } = await supabase
        .from('vip_waitlist')
        .select('*')
        .eq('promo_code', cleanCode)
        .maybeSingle()

      if (waitlistEntry) {
        claimRecord = {
          promo_code: waitlistEntry.promo_code,
          status: 'active',
          discount_percentage: 15
        }
        discountPct = 15

        // Mirror back into store_event_claims for tracking
        await supabase
          .from('store_event_claims')
          .upsert({
            customer_email: waitlistEntry.email || email || 'customer@deechoi.com',
            promo_code: waitlistEntry.promo_code,
            discount_percentage: 15,
            status: 'active',
            claimed_at: waitlistEntry.created_at || new Date().toISOString()
          }, { onConflict: 'promo_code' })
          .select('*')
          .maybeSingle()
      }
    }

    // 3. If code starts with LAUNCH- (Launch celebration vouchers) and wasn't pre-saved, allow it dynamically
    if (!claimRecord && cleanCode.startsWith('LAUNCH-')) {
      claimRecord = {
        promo_code: cleanCode,
        status: 'active',
        discount_percentage: 15 // 15% launch special
      }
      discountPct = 15
    }

    // 4. If code starts with VIP- (Waitlist VIP passes) and wasn't pre-saved, allow it dynamically
    if (!claimRecord && cleanCode.startsWith('VIP-')) {
      claimRecord = {
        promo_code: cleanCode,
        status: 'active',
        discount_percentage: 15
      }
      discountPct = 15
    }

    // If we found a valid claim record from any source
    if (claimRecord) {
      if (claimRecord.status === 'redeemed' || claimRecord.status === 'used') {
        return NextResponse.json({ 
          valid: false, 
          message: 'This voucher has already been redeemed and cannot be used again.' 
        })
      }

      return NextResponse.json({
        valid: true,
        discountPercentage: discountPct,
        code: claimRecord.promo_code,
        message: `Voucher applied: ${discountPct}% discount granted!`
      })
    }

    // 5. Fallback check on master store events (e.g. store_events table)
    const { data: event } = await supabase
      .from('store_events')
      .select('*')
      .eq('is_active', true)
      .ilike('discount_code', cleanCode)
      .maybeSingle()

    if (event) {
      const discountPercentage = parseFloat(String(event.discount_percentage)?.replace(/[^0-9.]/g, '') || '15') || 15
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
    console.error('Voucher Validation Error:', error)
    return NextResponse.json({ valid: false, message: error.message || 'Validation error' }, { status: 500 })
  }
}