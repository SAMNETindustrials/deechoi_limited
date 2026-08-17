'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { OrderDetails } from '@/components/admin/order-details'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrderDetailPage({ 
  params: paramsPromise 
}: { 
  params: Promise<{ id: string }> 
}) {
  const params = use(paramsPromise)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (params?.id) {
      fetchOrder()
    }
  }, [params?.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchErr } = await supabase
        .from('store_orders')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchErr) throw fetchErr
      setOrder(data)
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setOrder((prev: any) => prev ? { ...prev, status: newStatus } : null)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1419] text-white space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />
        <p className="text-xs text-gray-400">Loading order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-white p-6 sm:p-10 space-y-6">
        <Link href="/admin/dashboard">
          <Button variant="outline" className="gap-2 border-[#EAA823]/30 text-gray-300 hover:text-[#EAA823]">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
          {error || 'Order not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-4 sm:p-8 space-y-6">
      {/* Header with Back to Dashboard button */}
      <div className="flex items-center justify-between border-b border-[#EAA823]/20 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="icon" className="rounded-xl border-[#EAA823]/30 hover:bg-[#EAA823]/20 text-[#EAA823]">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Customer: <span className="text-white font-semibold">{order.customer_name}</span> ({order.customer_phone})
            </p>
          </div>
        </div>

        <Link href="/admin/dashboard">
          <Button variant="outline" className="text-xs font-bold border-[#EAA823]/30 hover:bg-[#EAA823]/20 text-gray-300 hover:text-[#EAA823]">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Order Details Component */}
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl border border-[#EAA823]/20 p-6 shadow-xl">
        <OrderDetails order={order} onStatusChange={handleStatusChange} />
      </div>
    </div>
  )
}