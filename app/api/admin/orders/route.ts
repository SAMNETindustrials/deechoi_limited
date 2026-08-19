import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders
 * Fetches orders with optional status filtering, pagination, and search.
 * Supports querying 'store_orders' with automatic fallback to 'orders'.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 1. Try querying primary 'store_orders' table
    let query = supabase
      .from('store_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search && search.trim()) {
      const s = search.trim()
      query = query.or(`customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,customer_email.ilike.%${s}%`)
    }

    const { data: storeOrdersData, error: storeOrdersError, count } = await query.range(
      offset,
      offset + limit - 1
    )

    if (!storeOrdersError && storeOrdersData) {
      return NextResponse.json({
        success: true,
        data: storeOrdersData,
        count: count || storeOrdersData.length,
        total: count || storeOrdersData.length,
      })
    }

    // 2. Fallback to legacy 'orders' table if 'store_orders' does not exist
    let legacyQuery = supabase
      .from('orders')
      .select(
        `
        *,
        order_items(*),
        order_deliveries(*)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      legacyQuery = legacyQuery.eq('status', status)
    }

    const { data: legacyData, error: legacyError, count: legacyCount } = await legacyQuery.range(
      offset,
      offset + limit - 1
    )

    if (legacyError) {
      throw legacyError
    }

    return NextResponse.json({
      success: true,
      data: legacyData || [],
      count: legacyCount || (legacyData || []).length,
      total: legacyCount || (legacyData || []).length,
    })
  } catch (error: any) {
    console.error('[Orders API Error] Failed to fetch orders:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders
 * Creates a new customer order.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    // 1. Attempt insert into primary 'store_orders' table
    let { data, error } = await supabase
      .from('store_orders')
      .insert([body])
      .select()
      .single()

    // 2. Fallback to 'orders' table if 'store_orders' fails
    if (error) {
      console.warn('[Orders API Notice] store_orders insert issue, trying orders table:', error.message)
      const fallbackResult = await supabase
        .from('orders')
        .insert([body])
        .select()
        .single()

      if (fallbackResult.error) {
        throw fallbackResult.error
      }
      data = fallbackResult.data
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('[Orders API Error] Failed to create order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/orders
 * Updates order status (e.g. 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')
 * Includes defensive fallback for missing schema columns like 'updated_at'.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { id, orderId, status, admin_notes } = body
    const targetId = id || orderId

    if (!targetId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required.' },
        { status: 400 }
      )
    }

    // 1. Construct primary update payload with timestamps
    const fullPayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (admin_notes !== undefined) {
      fullPayload.admin_notes = admin_notes
    }

    if (status === 'confirmed') {
      fullPayload.confirmed_at = new Date().toISOString()
    }

    // Try updating 'store_orders' first
    let { data, error } = await supabase
      .from('store_orders')
      .update(fullPayload)
      .eq('id', targetId)
      .select()
      .maybeSingle()

    // Handle missing column schema cache error gracefully
    if (error && error.message.includes('column')) {
      console.warn('[Orders API Notice] Retrying update with basic payload due to schema cache:', error.message)
      const basicPayload: Record<string, any> = { status }
      if (admin_notes !== undefined) basicPayload.admin_notes = admin_notes

      const retry = await supabase
        .from('store_orders')
        .update(basicPayload)
        .eq('id', targetId)
        .select()
        .maybeSingle()

      data = retry.data
      error = retry.error
    }

    // If not found in 'store_orders', try legacy 'orders' table
    if (!data && !error) {
      const legacyUpdate = await supabase
        .from('orders')
        .update(fullPayload)
        .eq('id', targetId)
        .select()
        .maybeSingle()

      if (legacyUpdate.error && legacyUpdate.error.message.includes('column')) {
        const legacyRetry = await supabase
          .from('orders')
          .update({ status })
          .eq('id', targetId)
          .select()
          .maybeSingle()

        data = legacyRetry.data
        error = legacyRetry.error
      } else {
        data = legacyUpdate.data
        error = legacyUpdate.error
      }
    }

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to "${status}" successfully.`,
      data,
    })
  } catch (error: any) {
    console.error('[Orders API Error] Failed to update order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}