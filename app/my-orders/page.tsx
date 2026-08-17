'use client'

import { useEffect, useState, useCallback } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ShoppingBag, 
  ArrowLeft,
  RefreshCw,
  Loader2,
  MapPin,
  Calendar,
  Search,
  History,
  Mail,
  Phone,
  Star,
  Send,
  X,
  HeartHandshake
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  delivery_address: string
  delivery_city: string
  total_amount: number
  delivery_fee?: number
  status: 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled'
  items: any[]
  created_at: string
}

interface CustomerSession {
  name?: string
  email?: string
  phone?: string
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all')
  const [lookupInput, setLookupInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewedOrderIds, setReviewedOrderIds] = useState<string[]>([])

  const supabase = createClient()

  const fetchExistingReviews = useCallback(async (orderIds: string[]) => {
    if (orderIds.length === 0) return
    try {
      const { data } = await supabase
        .from('customer_reviews')
        .select('order_id')
        .in('order_id', orderIds)

      if (data) {
        setReviewedOrderIds(data.map((r: { order_id: string }) => r.order_id).filter(Boolean))
      }
    } catch (err) {
      console.warn('Could not check reviewed orders:', err)
    }
  }, [supabase])

  const fetchCustomerOrders = useCallback(async (manualIdentifier?: string) => {
    try {
      setLoading(true)
      if (typeof window === 'undefined') return

      const { data: { user } } = await supabase.auth.getUser()
      const session: CustomerSession = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
      const storedOrderIds: string[] = JSON.parse(localStorage.getItem('deechoi_customer_orders') || '[]')
      setCustomerSession(session)

      const targetEmail = manualIdentifier?.includes('@') 
        ? manualIdentifier.trim().toLowerCase() 
        : (user?.email || session.email || '').trim().toLowerCase()

      const targetPhone = manualIdentifier && !manualIdentifier.includes('@')
        ? manualIdentifier.trim()
        : (session.phone || '').trim()

      let query = supabase
        .from('store_orders')
        .select('*')
        .neq('payment_method', 'contact_form_message')
        .order('created_at', { ascending: false })

      if (targetEmail && targetPhone && storedOrderIds.length > 0) {
        query = query.or(
          `customer_email.ilike.${targetEmail},customer_phone.eq.${targetPhone},id.in.(${storedOrderIds.join(',')})`
        )
      } else if (targetEmail && targetPhone) {
        query = query.or(
          `customer_email.ilike.${targetEmail},customer_phone.eq.${targetPhone}`
        )
      } else if (targetEmail) {
        query = query.ilike('customer_email', targetEmail)
      } else if (targetPhone) {
        query = query.eq('customer_phone', targetPhone)
      } else if (storedOrderIds.length > 0) {
        query = query.in('id', storedOrderIds)
      } else {
        setOrders([])
        setLoading(false)
        return
      }

      const { data, error } = await query
      if (error) throw error
      
      const fetched = data || []
      setOrders(fetched)

      if (fetched.length > 0) {
        const mergedIds = Array.from(new Set([...storedOrderIds, ...fetched.map(o => o.id)]))
        localStorage.setItem('deechoi_customer_orders', JSON.stringify(mergedIds))
        fetchExistingReviews(fetched.map(o => o.id))
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [supabase, fetchExistingReviews])

  useEffect(() => {
    fetchCustomerOrders()
  }, [fetchCustomerOrders])

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupInput.trim()) return
    setIsSearching(true)
    fetchCustomerOrders(lookupInput.trim())
  }

  const handleOpenReviewModal = (order: Order) => {
    setReviewOrder(order)
    setRating(5)
    setReviewText('')
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewOrder || !reviewText.trim()) return

    try {
      setSubmittingReview(true)
      const firstItem = reviewOrder.items?.[0]?.name || reviewOrder.items?.[0]?.product_name || 'Delicious Meal'

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: reviewOrder.id,
          customerName: reviewOrder.customer_name,
          rating,
          reviewText: reviewText.trim(),
          itemOrdered: firstItem,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')

      setReviewedOrderIds((prev) => Array.from(new Set([reviewOrder.id, ...prev])))
      alert('Thank you! Your review is now live on our storefront.')
      setReviewOrder(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review'
      alert(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            Payment Verifying
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Kitchen Preparing
          </span>
        )
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-[#072d1d] border border-amber-400 text-[11px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
            <Truck className="w-3 h-3 text-amber-600" />
            On The Way
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 border border-green-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            Delivered
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize">
            {status}
          </span>
        )
    }
  }

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
  const completedOrders = orders.filter(o => o.status === 'completed')

  const displayedOrders = activeTab === 'active' 
    ? activeOrders 
    : activeTab === 'completed' 
      ? completedOrders 
      : orders

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Breadcrumb & Refresh Button */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Storefront
          </Link>

          <button
            onClick={() => fetchCustomerOrders()}
            className="text-xs font-bold text-[#0A2E1D] hover:underline flex items-center gap-1 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-xs active:scale-95 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Hero Banner */}
        <div className="mb-8 bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Order History & Reviews</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {customerSession?.name ? `Hello, ${customerSession.name.split(' ')[0]}!` : 'Your Order History'}
          </h1>
          
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-lg">
            Track live dispatches, view receipts, and rate any of your completed meals.
          </p>

          {(customerSession?.email || customerSession?.phone) && (
            <div className="mt-4 pt-4 border-t border-emerald-800/60 flex flex-wrap gap-4 text-xs text-emerald-200">
              {customerSession.email && (
                <span className="flex items-center gap-1.5 bg-[#041a11] px-3 py-1 rounded-full border border-emerald-700/40">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  {customerSession.email}
                </span>
              )}
              {customerSession.phone && (
                <span className="flex items-center gap-1.5 bg-[#041a11] px-3 py-1 rounded-full border border-emerald-700/40">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  {customerSession.phone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Lookup / Search Switcher Tool */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs mb-6">
          <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Find orders by email or phone number..."
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-gray-200 text-xs sm:text-sm text-[#0A2E1D] pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find My Orders'}
            </Button>
          </form>
        </div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0A2E1D] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-[#0A2E1D] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              Active ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-[#0A2E1D] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Delivered ({completedOrders.length})
            </button>
          </div>
        )}

        {/* Orders Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" />
            <p className="text-xs font-bold text-gray-500">Checking your live orders...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EAA823]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No Orders Found</h2>
            <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto">
              {activeTab !== 'all' 
                ? `You do not have any ${activeTab} orders at the moment.` 
                : 'No order history associated with this account. Type your checkout email or phone number above to sync your orders.'}
            </p>
            <Link href="/">
              <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6 text-xs cursor-pointer">
                Explore Menu & Order
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const itemCount = (order.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
              const firstItem = order.items?.[0]?.name || order.items?.[0]?.product_name || 'Delicious Meal'
              const isReviewed = reviewedOrderIds.includes(order.id)

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-[#EAA823]">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Order Content */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="font-extrabold text-sm sm:text-base text-[#0A2E1D]">
                        {firstItem} {itemCount > 1 ? `+ ${itemCount - 1} more item${itemCount > 2 ? 's' : ''}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{order.delivery_address}, {order.delivery_city}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Recipient: {order.customer_name} ({order.customer_phone})
                      </p>
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block sm:text-right">Total Paid</span>
                        <span className="text-base sm:text-lg font-black text-[#0A2E1D]">
                          ₦{Number(order.total_amount || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Review Button for Delivered Orders */}
                        {order.status === 'completed' && (
                          isReviewed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                              <Star className="w-3.5 h-3.5 fill-[#EAA823] text-[#EAA823]" />
                              Reviewed
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenReviewModal(order)}
                              className="bg-amber-500 hover:bg-amber-400 text-[#072d1d] font-bold rounded-xl text-xs gap-1 shadow-sm transition cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </Button>
                          )
                        )}

                        <Link href={`/order-confirmation/${order.id}`}>
                          <Button
                            size="sm"
                            className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <span>{order.status === 'completed' ? 'Receipt' : 'Track'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Review Modal Dialog */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#EAA823]" />
                <h3 className="font-extrabold text-base text-[#0A2E1D]">Rate & Review Order</h3>
              </div>
              <button
                onClick={() => setReviewOrder(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Reference</p>
              <p className="text-sm font-black text-[#0A2E1D]">
                #{reviewOrder.id.slice(0, 8).toUpperCase()} &bull; {reviewOrder.items?.[0]?.name || 'Delicious Meal'}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Select Rating:
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
                  Your Review / Feedback *
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

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewOrder(null)}
                  className="flex-1 text-xs font-bold py-5 rounded-xl border-gray-200 cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submittingReview || !reviewText.trim()}
                  className="flex-1 bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black py-5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#EAA823]" />
                      <span>Post Review</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}