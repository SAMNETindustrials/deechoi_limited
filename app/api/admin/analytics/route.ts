import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get order statistics
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (orderError) throw orderError

    // Calculate metrics
    const totalOrders = orderData?.length || 0
    const completedOrders = orderData?.filter(o => o.status === 'delivered').length || 0
    const totalRevenue = orderData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Payment breakdown
    const paymentBreakdown = orderData?.reduce((acc: Record<string, number>, order) => {
      const method = order.payment_method || 'cash'
      acc[method] = (acc[method] || 0) + (order.total_amount || 0)
      return acc
    }, {}) || {}

    // Daily revenue for the last N days
    const dailyData: Record<string, { date: string; revenue: number; orders: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyData[dateStr] = { date: dateStr, revenue: 0, orders: 0 }
    }

    orderData?.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (dailyData[date]) {
        dailyData[date].revenue += order.total_amount || 0
        dailyData[date].orders += 1
      }
    })

    // Status breakdown
    const statusBreakdown = {
      pending: orderData?.filter(o => o.status === 'pending').length || 0,
      accepted: orderData?.filter(o => o.status === 'accepted').length || 0,
      preparing: orderData?.filter(o => o.status === 'preparing').length || 0,
      dispatch: orderData?.filter(o => o.status === 'dispatch').length || 0,
      delivered: orderData?.filter(o => o.status === 'delivered').length || 0,
      cancelled: orderData?.filter(o => o.status === 'cancelled').length || 0
    }

    return NextResponse.json({
      metrics: {
        totalOrders,
        completedOrders,
        totalRevenue,
        averageOrderValue,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
      },
      paymentBreakdown,
      statusBreakdown,
      dailyRevenue: Object.values(dailyData),
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        days
      }
    })
  } catch (error) {
    console.error('[v0] Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
