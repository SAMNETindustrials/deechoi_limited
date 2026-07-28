'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, CheckCircle, Clock, Truck, MapPin } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  status: string
  payment_method: string
  payment_status: string
  created_at: string
  order_items: OrderItem[]
}

interface OrderListProps {
  onSelectOrder?: (order: Order) => void
  selectedStatus?: string | null
}

export function OrderList({ onSelectOrder, selectedStatus }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [selectedStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/admin/orders', window.location.origin)
      if (selectedStatus) {
        url.searchParams.append('status', selectedStatus)
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch orders')

      const result = await response.json()
      setOrders(result.data || [])
    } catch (error) {
      console.error('[v0] Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      dispatch: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      preparing: <Clock className="w-4 h-4" />,
      dispatch: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />
    }
    return icons[status]
  }

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm)
  )

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search by name, email, or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />

      <div className="space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No orders found
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {order.customer_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    ₦{order.total_amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                >
                  {getStatusIcon(order.status)}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <div className="text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-full">
                  {order.payment_method}
                </div>
                <div
                  className={`text-xs px-3 py-1 rounded-full ${
                    order.payment_status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.payment_status}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{order.id.slice(0, 8)}</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/orders/${order.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                {onSelectOrder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectOrder(order)}
                  >
                    Select
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
