'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { OrderDetails } from '@/components/admin/order-details'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/orders/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch order')

      const data = await response.json()
      setOrder(data)
    } catch (err) {
      console.error('[v0] Error fetching order:', err)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setOrder({ ...order, status: newStatus })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/orders">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/admin/orders">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="text-center py-8 text-muted-foreground">
          Order not found
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="icon">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Order {order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground mt-1">
            From {order.customer_name}
          </p>
        </div>
      </div>

      {/* Order Details */}
      <OrderDetails order={order} onStatusChange={handleStatusChange} />
    </div>
  )
}
