'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

interface OrderConfirmationPageProps {
  params: {
    id: string
  }
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
}

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price_at_purchase: number
  subtotal: number
}

interface Product {
  id: string
  name: string
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<(OrderItem & { product: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single()

      if (orderError) throw orderError
      setOrder(orderData)

      // Fetch order items with product names
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          price_at_purchase,
          subtotal,
          store_products:product_id (id, name)
        `)
        .eq('order_id', params.id)

      if (itemsError) throw itemsError

      setItems(
        itemsData.map((item: any) => ({
          ...item,
          product: item.store_products,
        }))
      )
    } catch (error) {
      console.error('[v0] Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StorefrontHeader />
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Loading order details...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <StorefrontHeader />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-6">Order not found</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
              <Check className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground">
            Thank you for your order. We&apos;ll prepare and deliver your food soon.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-semibold text-foreground">{order.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-semibold text-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold text-foreground capitalize">
                {order.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <p className="font-semibold text-foreground capitalize">
                {order.payment_status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Delivery To</p>
              <p className="font-semibold text-foreground">{order.customer_name}</p>
              <p className="text-sm text-muted-foreground">{order.customer_email}</p>
              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">Order Total</p>
              <p className="text-2xl font-bold text-primary">
                ₦{order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center pb-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    ₦{item.subtotal.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
