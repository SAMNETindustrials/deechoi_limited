import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return NextResponse.json({ success: true, reviews: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch reviews'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, customerName, rating, reviewText, itemOrdered } = body

    if (!customerName || !rating || !reviewText) {
      return NextResponse.json(
        { error: 'Name, star rating, and review message are required.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: review, error } = await supabase
      .from('customer_reviews')
      .insert({
        order_id: orderId || null,
        customer_name: String(customerName).trim(),
        rating: Math.min(5, Math.max(1, Number(rating))),
        review_text: String(reviewText).trim(),
        item_ordered: itemOrdered ? String(itemOrdered).trim() : null,
        is_verified: Boolean(orderId),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, review })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save review'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}