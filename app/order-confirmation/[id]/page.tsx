'use client'

import { useEffect, useState, use } from 'react'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Truck, 
  Check, 
  PackageCheck, 
  Loader2, 
  Phone, 
  ShoppingBag, 
  Star, 
  Send,
  HeartHandshake
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StorefrontHeader } from '@/components/storefront/header'

interface Order {
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
  status: 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled'
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
  const [updating, setUpdating] = useState(false)

  // Review Form States
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (params?.id) {
      fetchOrder()
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

  const handleMarkAsReceived = async () => {
    if (!order) return
    const confirmReceive = window.confirm(
      'Confirm that you have received your complete order package in good condition?'
    )
    if (!confirmReceive) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('store_orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (error) throw error
      setOrder(prev => prev ? { ...prev, status: 'completed' } : null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status.'
      alert(message)
    } finally {
      setUpdating(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewText.trim() || !order) return

    try {
      setSubmittingReview(true)
      const firstItem = order.items?.[0]?.name || order.items?.[0]?.product_name || 'Delicious Meal'

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customer_name,
          rating,
          reviewText: reviewText.trim(),
          itemOrdered: firstItem,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit review')
      setReviewSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review.'
      alert(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" />
        <p className="text-xs font-bold text-gray-500">Loading your order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D]">
        <StorefrontHeader />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Link href="/">
            <Button variant="outline" className="gap-2 mb-6 rounded-full font-bold text-xs border-gray-300">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-gray-800">Order Not Found</h2>
            <p className="text-xs text-gray-500 mt-1">We couldn&apos;t find an order matching this reference ID.</p>
          </div>
        </div>
      </div>
    )
  }

  const isConfirmed = order.status === 'confirmed' || order.status === 'dispatched' || order.status === 'completed'
  const isDispatched = order.status === 'dispatched' || order.status === 'completed'
  const isCompleted = order.status === 'completed'

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0A2E1D] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Status Header Banner */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 mb-6 text-center shadow-sm">
          {isCompleted ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                  <PackageCheck className="w-9 h-9" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A2E1D] mb-1">
                Order Delivered & Completed!
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Thank you for choosing De-echoi! We hope you loved your meal.
              </p>
            </>
          ) : order.status === 'dispatched' ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-[#EAA823] shadow-inner">
                  <Truck className="w-9 h-9 text-[#0A2E1D] animate-bounce" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A2E1D] mb-1">
                Your Order is Dispatched & On the Way!
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Our rider has picked up your package and is on the way to your delivery destination.
              </p>
            </>
          ) : order.status === 'confirmed' ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A2E1D] mb-1">
                Order Confirmed — Preparing in Kitchen
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Payment verified! Our kitchen team is freshly preparing and packaging your order.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-[#EAA823] animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A2E1D] mb-1">
                Order Received — Verifying Payment
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                We received your order and payment receipt. Our admin is verifying payment.
              </p>
            </>
          )}
        </div>

        {/* Live Progress Stages */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#0A2E1D]">
              Real-Time Tracking Progress
            </h2>
            <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Live Updates
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs sm:text-sm text-[#0A2E1D]">1. Order & Receipt Received</p>
                <p className="text-[11px] text-gray-500">Order logged into bakery system</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                isConfirmed ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                <Check className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-xs sm:text-sm ${isConfirmed ? 'text-[#0A2E1D]' : 'text-gray-400'}`}>
                  2. Confirmed by Admin
                </p>
                <p className="text-[11px] text-gray-500">
                  {isConfirmed ? 'Payment verified and kitchen preparation started.' : 'Awaiting verification'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : order.status === 'dispatched'
                    ? 'bg-[#0A2E1D] text-[#EAA823] shadow-md animate-pulse'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-xs sm:text-sm ${isDispatched ? 'text-[#0A2E1D]' : 'text-gray-400'}`}>
                  3. Order Dispatched & On the Way
                </p>
                <p className="text-[11px] text-gray-500">
                  {isCompleted
                    ? 'Delivery completed'
                    : order.status === 'dispatched'
                      ? 'Dispatched with rider — en-route to your address'
                      : 'Pending dispatch'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                isCompleted ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                <PackageCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-xs sm:text-sm ${isCompleted ? 'text-[#0A2E1D]' : 'text-gray-400'}`}>
                  4. Order Delivered
                </p>
                <p className="text-[11px] text-gray-500">
                  {isCompleted ? 'Delivered and confirmed received.' : 'Customer confirms arrival'}
                </p>
              </div>
            </div>
          </div>

          {isConfirmed && !isCompleted && (
            <div className="mt-6 pt-5 border-t border-gray-100 bg-[#FDFBF7] -mx-6 -mb-6 p-6 rounded-b-3xl text-center space-y-3">
              <p className="font-extrabold text-sm text-[#0A2E1D]">Has your order arrived?</p>
              <Button
                onClick={handleMarkAsReceived}
                disabled={updating}
                className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black py-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4 text-[#EAA823]" />}
                <span>I Have Received My Order</span>
              </Button>
            </div>
          )}
        </div>

        {/* Customer Star Rating & Feedback Form */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <HeartHandshake className="w-5 h-5 text-[#EAA823]" />
            <h3 className="font-black text-sm uppercase tracking-wider text-[#0A2E1D]">
              Rate Your De-echoi Experience
            </h3>
          </div>

          {reviewSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-[#0A2E1D]">Thank you for your review!</h4>
              <p className="text-xs text-gray-600">Your feedback is live on our storefront customer reviews section.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Select Your Star Rating:
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || rating)
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-2xl transition transform hover:scale-110 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            isFilled
                              ? 'fill-[#EAA823] text-[#EAA823]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    )
                  })}
                  <span className="text-xs font-bold text-[#0A2E1D] ml-2">
                    {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional!' : `${rating} Stars`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Your Review & Comments *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How was the meal taste, packaging, and delivery speed?"
                  className="w-full bg-[#FDFBF7] border border-gray-200 text-xs sm:text-sm text-[#0A2E1D] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                />
              </div>

              <Button
                type="submit"
                disabled={submittingReview || !reviewText.trim()}
                className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-extrabold py-5 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#EAA823]" />
                    <span>Submit Customer Review</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-2">
            <h3 className="font-black text-xs uppercase tracking-wider text-[#0A2E1D] flex items-center gap-1.5 mb-2">
              <MapPin className="w-4 h-4 text-[#EAA823]" />
              Delivery Destination
            </h3>
            <p className="font-bold text-xs text-[#0A2E1D]">{order.customer_name}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{order.delivery_address}</p>
            <p className="text-xs text-gray-500">
              {order.delivery_city}{order.delivery_state ? `, ${order.delivery_state}` : ''}
            </p>
            <p className="text-xs font-semibold text-[#0A2E1D] pt-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {order.customer_phone}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-2.5">
            <h3 className="font-black text-xs uppercase tracking-wider text-[#0A2E1D] mb-2">
              Order Reference
            </h3>
            <div className="flex justify-between text-xs pb-1.5 border-b border-gray-100">
              <span className="text-gray-400">Order ID:</span>
              <span className="font-mono font-bold text-[#0A2E1D] text-[11px] truncate max-w-[150px]">
                {order.id}
              </span>
            </div>
            <div className="flex justify-between text-xs pb-1.5 border-b border-gray-100">
              <span className="text-gray-400">Payment Method:</span>
              <span className="font-bold text-[#0A2E1D]">
                {order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Order Date:</span>
              <span className="font-bold text-[#0A2E1D]">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6 shadow-sm">
          <h3 className="font-black text-sm uppercase tracking-wider text-[#0A2E1D] mb-4">
            Items Ordered
          </h3>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any, idx: number) => {
              const price = item.final_price ?? item.price ?? item.unit_price ?? 0
              const options = item.selected_options || {}

              return (
                <div key={idx} className="py-3 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-[#0A2E1D]">
                      {item.product_name ?? item.name}
                    </p>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
                    {Object.keys(options).length > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </p>
                    )}
                  </div>
                  <p className="font-extrabold text-xs sm:text-sm text-[#0A2E1D]">
                    ₦{(price * (item.quantity || 1)).toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-xs">
            {order.delivery_fee !== undefined && (
              <div className="flex justify-between text-gray-500">
                <span>Delivery Fee</span>
                <span className="font-bold text-[#0A2E1D]">₦{Number(order.delivery_fee).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
              <span className="font-bold text-sm text-[#0A2E1D]">Total Amount Paid</span>
              <span className="text-xl font-black text-[#0A2E1D]">
                ₦{Number(order.total_amount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <Button className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold py-6 rounded-2xl text-xs sm:text-sm shadow-md transition-all">
              Return to Storefront
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}