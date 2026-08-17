import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: product, error } = await supabase
      .from('store_products')
      .select('customization_options')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ option_groups: product?.customization_options || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('store_products')
      .update({
        customization_options: body.option_groups || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}