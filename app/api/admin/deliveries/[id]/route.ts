import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('order_deliveries')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        orders(*),
        riders(*)
      `)

    if (error) throw error

    // If delivery is marked as delivered, update order status
    if (body.status === 'delivered' && data[0]) {
      await supabase
        .from('orders')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', data[0].order_id)
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('[v0] Error updating delivery:', error)
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    )
  }
}
