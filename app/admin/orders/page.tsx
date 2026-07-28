'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, FileText, Eye, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_city: string
  delivery_state: string
  total_amount: number
  payment_method: 'bank_transfer' | 'card'
  payment_proof_url: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  items: any[]
  created_at: string
  confirmed_at: string | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/list')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('[v0] Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmOrder = async (orderId: string) => {
    setConfirming(orderId)
    try {
      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) throw new Error('Failed to confirm order')

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'confirmed' as const, confirmed_at: new Date().toISOString() }
          : order
      ))

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
      }

      alert('Order confirmed successfully! Customer will see "Order Completed - Awaiting Arrival"')
    } catch (error) {
      console.error('[v0] Error confirming order:', error)
      alert('Failed to confirm order')
    } finally {
      setConfirming(null)
    }
  }

  const viewPaymentProof = async (order: Order) => {
    if (!order.payment_proof_url) {
      alert('No payment proof available')
      return
    }

    try {
      const { data } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(order.payment_proof_url, 3600)

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('[v0] Error getting payment proof URL:', error)
      alert('Failed to view payment proof')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Check },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: null },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1`}>
        {Icon && <Icon className="w-4 h-4" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    )
  }

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Orders</h1>
          <p className="text-muted-foreground mt-1">Review and confirm orders</p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Status Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Filter by Status</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setStatusFilter('all')}
            variant={statusFilter === 'all' ? 'default' : 'outline'}
          >
            All Orders
          </Button>
          <Button
            onClick={() => setStatusFilter('pending')}
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            className="text-xs"
          >
            Pending
          </Button>
          <Button
            onClick={() => setStatusFilter('confirmed')}
            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
            className="text-xs"
          >
            Confirmed
          </Button>
          <Button
            onClick={() => setStatusFilter('completed')}
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            className="text-xs"
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Payment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{order.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{order.customer_email}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      ₦{order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Details
                      </Button>
                      {order.payment_proof_url && order.payment_method === 'bank_transfer' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewPaymentProof(order)}
                          title="View payment proof"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={confirming === order.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {confirming === order.id ? '...' : <Check className="w-4 h-4" />}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="pb-3 border-b border-border">
                <p className="text-muted-foreground">Order ID</p>
                <p className="font-mono text-foreground text-xs">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="text-foreground">{selectedOrder.customer_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="text-foreground">{selectedOrder.customer_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="text-foreground">{selectedOrder.customer_phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delivery Address</p>
                <p className="text-foreground">{selectedOrder.delivery_address}</p>
                <p className="text-foreground text-xs">
                  {selectedOrder.delivery_city}, {selectedOrder.delivery_state}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold text-primary">
                  ₦{selectedOrder.total_amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="text-foreground">
                  {selectedOrder.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground mb-2">Items ({selectedOrder.items?.length || 0})</p>
                <div className="space-y-1">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <p key={idx} className="text-foreground text-xs bg-muted p-1 rounded">
                      {item.product_name} x{item.quantity}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {selectedOrder.payment_proof_url && selectedOrder.payment_method === 'bank_transfer' && (
                <Button
                  onClick={() => viewPaymentProof(selectedOrder)}
                  variant="outline"
                  className="gap-2 flex-1"
                >
                  <FileText className="w-4 h-4" />
                  Payment Proof
                </Button>
              )}
              {selectedOrder.status === 'pending' && (
                <Button
                  onClick={() => {
                    handleConfirmOrder(selectedOrder.id)
                    setSelectedOrder(null)
                  }}
                  disabled={confirming === selectedOrder.id}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 gap-2"
                >
                  <Check className="w-4 h-4" />
                  {confirming === selectedOrder.id ? 'Confirming...' : 'Confirm Order'}
                </Button>
              )}
              <Button onClick={() => setSelectedOrder(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
