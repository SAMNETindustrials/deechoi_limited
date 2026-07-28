import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = createClient()

    // Fetch product options from the database
    const { data, error } = await supabase
      .from('products')
      .select('option_groups')
      .eq('id', productId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ option_groups: data?.option_groups || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const body = await request.json()
    const { option_groups } = body

    if (!Array.isArray(option_groups)) {
      return NextResponse.json(
        { error: 'Invalid option groups format' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Save option_groups JSON to product row
    const { data, error } = await supabase
      .from('products')
      .update({ option_groups })
      .eq('id', productId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Options updated successfully',
      product: data?.[0],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}