import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const productId = params.id

    const { data: details, error } = await supabase
      .from('product_details')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({
      success: true,
      data: details || null
    })
  } catch (error: any) {
    console.error('[v0] Failed to fetch product details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch details' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const productId = params.id
    const body = await request.json()

    const {
      description,
      ingredients,
      allergens,
      preparation_time_minutes,
      servings,
      nutritional_info,
      storage_instructions
    } = body

    // Check if details exist
    const { data: existingDetails } = await supabase
      .from('product_details')
      .select('id')
      .eq('product_id', productId)
      .single()

    if (existingDetails) {
      // Update existing
      const { error } = await supabase
        .from('product_details')
        .update({
          description,
          ingredients: ingredients || [],
          allergens: allergens || [],
          preparation_time_minutes,
          servings,
          nutritional_info: nutritional_info || null,
          storage_instructions
        })
        .eq('product_id', productId)

      if (error) throw error
    } else {
      // Insert new
      const { error } = await supabase
        .from('product_details')
        .insert({
          product_id: productId,
          description,
          ingredients: ingredients || [],
          allergens: allergens || [],
          preparation_time_minutes,
          servings,
          nutritional_info: nutritional_info || null,
          storage_instructions
        })

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Details saved successfully'
    })
  } catch (error: any) {
    console.error('[v0] Failed to save product details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save details' },
      { status: 500 }
    )
  }
}
