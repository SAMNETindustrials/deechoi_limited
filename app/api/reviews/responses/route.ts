import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// POST: Submit a new community reply/response to a review
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reviewId, userName, responseText } = body

    if (!reviewId || !userName || !responseText) {
      return NextResponse.json({ error: 'Missing required fields (reviewId, userName, responseText)' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('review_responses')
      .insert([
        {
          review_id: reviewId,
          user_name: userName,
          response_text: responseText.trim(),
          is_approved: false, // Requires admin approval by default
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('API Error submitting review response:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH: Admin approval / rejection toggle for review responses
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { responseId, isApproved } = body

    if (!responseId || typeof isApproved !== 'boolean') {
      return NextResponse.json({ error: 'Missing responseId or isApproved boolean' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('review_responses')
      .update({ is_approved: isApproved })
      .eq('id', responseId)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('API Error updating review response status:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}