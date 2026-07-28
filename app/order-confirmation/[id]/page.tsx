'use client'

import { useEffect, useState, use } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, ChevronLeft, MapPin, Clock, Truck, Check } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_city: string
  delivery_state: string
  total_amount: number
  payment_method: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  items: any[]
  created_at: string
  confirmed_at: string | null
}

export default function OrderConfirmationPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params?.id) {
      fetchOrder()
      // Poll for status updates every 3 seconds
      const interval = setInterval(fetchOrder, 3000)
      return () => clearInterval(interval)
    }
  }, [params?.id])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/">
            <Button variant="outline" className="gap-2 mb-6">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-lg text-muted-foreground">Order not found</p>
          </div>
        </div>
      </div>
    )
  }

  const isConfirmed = order.status === 'confirmed' || order.status === 'completed'

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Button variant="outline" className="gap-2 mb-8">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        {/* Status Header */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8 text-center">
          {isConfirmed ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground">
                Your payment has been verified and your order is being prepared.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                  <Clock className="w-12 h-12 text-yellow-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Order Received</h1>
              <p className="text-muted-foreground">
                We&apos;re verifying your payment. This usually takes a few minutes.
              </p>
            </>
          )}
        </div>

        {/* Status Timeline */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Order Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Payment Received</p>
                <p className="text-sm text-muted-foreground">Your payment proof was uploaded</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isConfirmed
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Check className="w-6 h-6" />
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    isConfirmed ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Order Confirmed
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConfirmed
                    ? 'Order confirmed - Awaiting dispatch'
                    : 'Waiting for admin verification'}
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-4 ${isConfirmed ? 'opacity-100' : 'opacity-50'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  order.status === 'completed' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">On the Way</p>
                <p className="text-sm text-muted-foreground">Your order will arrive shortly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Address
            </h3>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{order.customer_name}</p>
              <p className="text-foreground">{order.delivery_address}</p>
              <p className="text-foreground">
                {order.delivery_city}{order.delivery_state ? `, ${order.delivery_state}` : ''}
              </p>
              <p className="text-foreground mt-2">{order.customer_phone}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold text-foreground mb-4">Order Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-foreground text-xs">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="text-foreground font-medium">
                  {order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="text-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="font-bold text-lg text-foreground mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => {
              const price = item.final_price ?? item.price ?? 0
              return (
                <div
                  key={idx}
                  className="flex justify-between items-center py-3 border-b border-border last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.product_name ?? item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-foreground">
                    ₦{(price * item.quantity).toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-lg font-bold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">
              ₦{order.total_amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-foreground mb-3">What Happens Next?</h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              We verify your payment details and uploaded receipt.
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              Your order status automatically updates to &quot;Confirmed&quot;.
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              Our team prepares and dispatches your order.
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">4.</span>
              Your items arrive at the provided delivery address.
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/" className="flex-1">
            <Button className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}