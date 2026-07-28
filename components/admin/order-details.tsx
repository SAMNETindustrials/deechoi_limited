'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Truck, MapPin, Phone, Mail, Clock } from 'lucide-react'

interface OrderDetailsProps {
  order: any
  onStatusChange?: (status: string) => void
}

export function OrderDetails({ order, onStatusChange }: OrderDetailsProps) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update order')
      onStatusChange?.(newStatus)
    } catch (error) {
      console.error('[v0] Error updating order:', error)
      alert('Failed to update order status')
    } finally {
      setLoading(false)
    }
  }

  const getNextStatus = (currentStatus: string): { status: string; label: string } | null => {
    const statusFlow: Record<string, { status: string; label: string }> = {
      pending: { status: 'accepted', label: 'Accept Order' },
      accepted: { status: 'preparing', label: 'Start Preparing' },
      preparing: { status: 'dispatch', label: 'Send for Dispatch' },
      dispatch: { status: 'delivered', label: 'Mark Delivered' }
    }
    return statusFlow[currentStatus] || null
  }

  const nextAction = getNextStatus(order.status)

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.customer_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.customer_phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">
                {order.delivery_address}
                {order.delivery_city && `, ${order.delivery_city}`}
                {order.delivery_state && `, ${order.delivery_state}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">Order Items</h3>
          <div className="space-y-2">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₦{item.subtotal.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    ₦{item.unit_price.toLocaleString()} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center font-bold">
            <span>Total:</span>
            <span className="text-lg">₦{order.total_amount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Payment Information */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Payment Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Method</p>
            <p className="font-medium capitalize">{order.payment_method}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`font-medium capitalize ${
              order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {order.payment_status}
            </p>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Order Status</h3>
        <div className="flex items-center gap-2 mb-4">
          <div className="px-4 py-2 rounded-full font-medium capitalize bg-primary/10 text-primary">
            {order.status}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        {nextAction && (
          <Button
            onClick={() => handleStatusChange(nextAction.status)}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Updating...' : nextAction.label}
          </Button>
        )}

        {order.status === 'delivered' && (
          <div className="flex items-center gap-2 text-green-600 mt-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Order completed</span>
          </div>
        )}
      </div>
    </div>
  )
}
