import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('riders')
      .select(`
        *,
        deliveries: order_deliveries(count)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching riders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch riders' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('riders')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating rider:', error)
    return NextResponse.json(
      { error: 'Failed to create rider' },
      { status: 500 }
    )
  }
}
