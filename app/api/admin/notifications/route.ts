import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await (await supabase).auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch recent orders (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: orders, error } = await (await supabase)
      .from('orders')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    // Transform to notifications
    const notifications = orders.map((order) => ({
      id: order.id,
      orderId: order.id,
      message: `New order from ${order.customer_name || 'Customer'} - ${order.total_amount ? '₦' + order.total_amount.toLocaleString() : 'Amount pending'}`,
      type: 'new_order' as const,
      timestamp: new Date(order.created_at),
      read: false
    }))

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length
    })
  } catch (error) {
    console.error('[v0] Notification error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
