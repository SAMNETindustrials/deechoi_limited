// app/api/agent/call-customer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, agentPhone } = await req.json()

    if (!orderId || !agentPhone) {
      return NextResponse.json(
        { success: false, message: 'Missing order ID or agent contact details.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // 1. Fetch order and customer details securely
    const { data: order, error: orderError } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: 'Dispatch order not found.' },
        { status: 404 }
      )
    }

    const customerPhone = order.customer_phone
    const companyVirtualNumber = process.env.VIRTUAL_PHONE_NUMBER // e.g., +234123456789 or shortcode

    // 2. Trigger CPaaS Voice API (Example structure for Africa's Talking / Twilio Call Bridging)
    // Here we implement the server request to your telephony provider's REST API
    const callResult = await initiateCloudCall({
      agentPhone,
      customerPhone,
      fromNumber: companyVirtualNumber!,
    })

    // 3. Log the call attempt in Supabase
    await supabase.from('agent_call_logs').insert([
      {
        agent_id: order.agent_id,
        customer_phone: customerPhone,
        call_session_id: callResult.sessionId || 'mock-session-id',
        status: 'initiated',
      },
    ])

    return NextResponse.json({
      success: true,
      message: 'Connecting call... Your phone will ring shortly, followed by the customer.',
    })
  } catch (error: any) {
    console.error('Click-to-Call Error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to initiate call.' },
      { status: 500 }
    )
  }
}

// Helper function to interact with your chosen Voice API Gateway (e.g., Africa's Talking / Twilio)
async function initiateCloudCall({
  agentPhone,
  customerPhone,
  fromNumber,
}: {
  agentPhone: string
  customerPhone: string
  fromNumber: string
}) {
  // Example configuration using Africa's Talking Voice API or Twilio Client
  // For production, replace this block with your provider's SDK fetch payload.
  
  const payload = {
    username: process.env.AT_USERNAME, // e.g., 'sandbox' or live username if using Africa's Talking
    to: [agentPhone, customerPhone].join(','),
    from: fromNumber,
  }

  // Example fetch call to Africa's Talking Voice endpoint (or Twilio equivalent)
  /*
  const response = await fetch('https://voice.africastalking.com/call', {
    method: 'POST',
    headers: {
      'ApiKey': process.env.AT_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams(payload),
  })
  const data = await response.json()
  return { sessionId: data.entries?.[0]?.sessionId }
  */

  return { sessionId: 'AT_Voice_' + Date.now() }
}