import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryZip,
      paymentMethod,
      cartItems,
      totalAmount
    } = body

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          delivery_address: deliveryAddress,
          delivery_city: deliveryCity,
          delivery_state: deliveryState,
          delivery_zip: deliveryZip,
          status: 'pending',
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'card' ? 'pending' : 'pending',
          notes: ''
        }
      ])
      .select()

    if (orderError) throw orderError

    const orderId = orderData[0].id

    // Create order items
    const orderItems = cartItems.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.price,
      selected_options: item.selected_options || null,
      price_modifier: item.price_modifier || 0,
      subtotal: item.final_price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: 'pending',
          transaction_id: null
        }
      ])

    if (paymentError) throw paymentError

    // Create delivery record
    const { error: deliveryError } = await supabase
      .from('order_deliveries')
      .insert([
        {
          order_id: orderId,
          status: 'pending'
        }
      ])

    if (deliveryError) throw deliveryError

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order placed successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error processing checkout:', error)
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    )
  }
}
