'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  ExternalLink,
  Package,
  Loader2,
  Check
} from 'lucide-react'
import Image from 'next/image'

interface OrderDetailsProps {
  order: {
    id: string
    customer_name: string
    customer_email: string
    customer_phone: string
    delivery_address: string
    delivery_city: string
    delivery_state: string
    delivery_fee?: number
    total_amount: number
    payment_method: string
    payment_proof_url?: string | null
    status: 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled'
    items: any[]
    created_at: string
  }
  onStatusChange?: (newStatus: string) => void
}

export function OrderDetails({ order, onStatusChange }: OrderDetailsProps) {
  const [currentStatus, setCurrentStatus] = useState(order.status || 'pending')
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  const handleUpdateStatus = async (newStatus: 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled') => {
    try {
      setUpdating(true)

      // Update store_orders table in Supabase directly
      const { error } = await supabase
        .from('store_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) {
        console.error('Supabase status update error:', error)
        throw new Error(error.message || 'Failed to update order in database')
      }

      setCurrentStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error: any) {
      console.error('Error updating order:', error)
      alert(error.message || 'Failed to update order status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'dispatched':
        return 'bg-amber-500/20 text-[#EAA823] border-amber-500/40 animate-pulse'
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-8 text-white">
      
      {/* Top Status Banner & Fulfillment Action Buttons */}
      <div className="bg-[#131821] p-6 rounded-2xl border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Current Order Status
          </span>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border capitalize ${getStatusBadge(currentStatus)}`}>
              {currentStatus}
            </span>
            <span className="text-xs text-gray-400">
              Placed {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-gray-400 mr-1 font-semibold">Change Status:</span>

          {currentStatus !== 'confirmed' && currentStatus !== 'completed' && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => handleUpdateStatus('confirmed')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl gap-1.5"
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Confirm Order</span>
            </Button>
          )}

          {currentStatus !== 'dispatched' && currentStatus !== 'completed' && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => handleUpdateStatus('dispatched')}
              className="bg-amber-500 hover:bg-amber-400 text-[#072d1d] font-black text-xs rounded-xl gap-1.5 shadow-md"
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
              <span>Mark Dispatched</span>
            </Button>
          )}

          {currentStatus !== 'completed' && (
            <Button
              size="sm"
              disabled={updating}
              onClick={() => handleUpdateStatus('completed')}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl gap-1.5"
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Mark Completed</span>
            </Button>
          )}

          {currentStatus !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={() => {
                if (confirm('Cancel this order?')) handleUpdateStatus('cancelled')
              }}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold rounded-xl"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Customer Info & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer & Destination Information */}
        <div className="bg-[#131821] p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#EAA823] flex items-center gap-2 pb-2 border-b border-white/10">
            <MapPin className="w-4 h-4" />
            Customer & Delivery Destination
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-gray-400">Customer Name</p>
              <p className="text-sm font-bold text-white mt-0.5">{order.customer_name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-gray-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#EAA823]" /> Phone
                </p>
                <a href={`tel:${order.customer_phone}`} className="text-sm font-bold text-[#EAA823] hover:underline mt-0.5 block">
                  {order.customer_phone}
                </a>
              </div>

              <div>
                <p className="text-gray-400 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#EAA823]" /> Email
                </p>
                <p className="text-xs font-semibold text-white mt-0.5 truncate">{order.customer_email}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-gray-400">Delivery Address</p>
              <p className="text-xs font-medium text-gray-200 mt-1 leading-relaxed">
                {order.delivery_address}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {order.delivery_city}{order.delivery_state ? `, ${order.delivery_state}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Payment & Receipt Verification */}
        <div className="bg-[#131821] p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#EAA823] flex items-center gap-2 pb-2 border-b border-white/10">
            <FileText className="w-4 h-4" />
            Payment & Bank Receipt
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-gray-400">Payment Method</span>
              <span className="font-bold text-white uppercase">{order.payment_method || 'Bank Transfer'}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-gray-400">Delivery Fee</span>
              <span className="font-bold text-white">₦{Number(order.delivery_fee || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-gray-400">Total Order Amount</span>
              <span className="text-xl font-black text-[#EAA823]">₦{Number(order.total_amount || 0).toLocaleString()}</span>
            </div>

            {/* Payment Proof Preview / Link */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-gray-400 mb-2">Attached Payment Proof:</p>
              {order.payment_proof_url ? (
                <div className="space-y-2">
                  <a
                    href={order.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#EAA823] hover:underline font-bold bg-[#EAA823]/10 px-3 py-1.5 rounded-xl border border-[#EAA823]/30"
                  >
                    <span>Open Full Receipt in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {order.payment_proof_url.match(/\.(jpeg|jpg|png|webp)/i) && (
                    <div className="relative w-full max-w-[200px] aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black/40 mt-2">
                      <Image
                        src={order.payment_proof_url}
                        alt="Payment Receipt"
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No receipt file attached.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Items Breakdown Table */}
      <div className="bg-[#131821] p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#EAA823] flex items-center gap-2">
          <Package className="w-4 h-4" />
          Ordered Items Breakdown
        </h3>

        <div className="divide-y divide-white/5">
          {order.items?.map((item: any, idx: number) => {
            const price = Number(item.price ?? item.unit_price ?? item.final_price ?? 0)
            const qty = Number(item.quantity || 1)
            const options = item.selected_options || {}

            return (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl bg-black/40 overflow-hidden border border-white/10 flex-shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name || 'Item'} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                        ITEM
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{item.name || item.product_name}</p>
                    <p className="text-xs text-gray-400">Qty: {qty} &bull; ₦{price.toLocaleString()} each</p>
                    {Object.keys(options).length > 0 && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>

                <p className="font-black text-sm text-white flex-shrink-0">
                  ₦{(price * qty).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}