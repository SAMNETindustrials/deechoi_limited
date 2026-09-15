'use client'

import { useEffect, useState, useCallback } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  HeartHandshake,
  Lock,
  Hash,
  LogOut,
  MessageSquare,
  CornerDownRight,
  ShieldCheck
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

interface ReviewResponse {
  id: string
  review_id: string
  user_name: string
  responseText?: string
  response_text?: string
  is_approved: boolean
  created_at: string
}

interface ReviewItem {
  id: string
  order_id?: string
  customer_name: string
  rating: number
  review_text: string
  item_ordered: string
  created_at: string
  responses?: ReviewResponse[]
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'reviews'>('all')

  // Transaction Login States
  const [loginEmail, setLoginEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewedOrderIds, setReviewedOrderIds] = useState<string[]>([])

  // Storefront Reviews & View/Reply States
  const [storeReviews, setStoreReviews] = useState<ReviewItem[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [selectedReviewModal, setSelectedReviewModal] = useState<ReviewItem | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

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

  const fetchStorefrontReviews = useCallback(async () => {
    try {
      setLoadingReviews(true)
      const res = await fetch('/api/reviews')
      const data = await res.json()
      if (Array.isArray(data)) {
        setStoreReviews(data)
      }
    } catch (err) {
      console.error('Failed to load storefront reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }, [])

  const fetchCustomerOrders = useCallback(async (forcedEmail?: string) => {
    try {
      setLoading(true)
      if (typeof window === 'undefined') return

      const { data: { user } } = await supabase.auth.getUser()
      let session: CustomerSession = {}
      
      try {
        const storedSession = localStorage.getItem('deechoi_customer_session')
        if (storedSession) {
          session = JSON.parse(storedSession)
        }
      } catch (e) {
        console.warn('Failed to parse customer session from localStorage', e)
      }

      setCustomerSession(session)

      const targetEmail = forcedEmail 
        ? forcedEmail.trim().toLowerCase() 
        : (user?.email || session.email || '').trim().toLowerCase()

      // If no valid session email exists, clear orders
      if (!targetEmail || !targetEmail.includes('@')) {
        setOrders([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .ilike('customer_email', targetEmail)
        .neq('payment_method', 'contact_form_message')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const fetched = (data || []).filter(
        (o) => o.customer_email?.trim().toLowerCase() === targetEmail
      )

      setOrders(fetched)

      if (fetched.length > 0) {
        fetchExistingReviews(fetched.map(o => o.id))
      }
    } catch (err: any) {
      console.error('Error fetching customer orders:', err?.message || err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [supabase, fetchExistingReviews])

  useEffect(() => {
    fetchCustomerOrders()
    fetchStorefrontReviews()
  }, [fetchCustomerOrders, fetchStorefrontReviews])

  // Handle 5-digit code & email login
  const handleTransactionLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = loginEmail.trim().toLowerCase()
    const cleanCode = loginCode.trim()

    if (!cleanEmail || !cleanCode) {
      alert('Please fill in both your email address and transaction code.')
      return
    }

    if (!/^\d{5}$/.test(cleanCode)) {
      alert('Transaction code must be exactly 5 digits (numbers only, no alphabets).')
      return
    }

    setLoggingIn(true)

    try {
      const { data: account, error: accountError } = await supabase
        .from('customer_accounts')
        .select('id, customer_email, transaction_code')
        .ilike('customer_email', cleanEmail)
        .maybeSingle()

      if (accountError) {
        console.error('Transaction account lookup error:', accountError)
        alert('Unable to verify your account. Please try again.')
        return
      }

      if (account) {
        if (account.transaction_code === cleanCode) {
          localStorage.setItem('deechoi_customer_email', cleanEmail)
          localStorage.setItem('deechoi_customer_session', JSON.stringify({ email: cleanEmail }))
          fetchCustomerOrders(cleanEmail)
          return
        }
        alert('Incorrect Transaction Code. Please check your code and try again.')
        return
      }

      // Check if code is taken by another account
      const { data: existingCode, error: codeError } = await supabase
        .from('customer_accounts')
        .select('id, customer_email, transaction_code')
        .eq('transaction_code', cleanCode)
        .maybeSingle()

      if (codeError) {
        console.error('Transaction code lookup error:', codeError)
        alert('Unable to verify the transaction code. Please try again.')
        return
      }

      if (existingCode) {
        alert('This transaction code already belongs to another customer. Please use your registered email address or choose another code.')
        return
      }

      // Create new customer account entry
      const { error: createError } = await supabase
        .from('customer_accounts')
        .insert([{ customer_email: cleanEmail, transaction_code: cleanCode }])

      if (createError) {
        console.error('Customer account creation error:', createError)
        if (createError.code === '23505') {
          alert('This email address or transaction code is already registered. Please try your existing login details.')
        } else {
          alert('Could not create your customer account. Please try again later.')
        }
        return
      }

      localStorage.setItem('deechoi_customer_email', cleanEmail)
      localStorage.setItem('deechoi_customer_session', JSON.stringify({ email: cleanEmail }))
      window.dispatchEvent(new Event('storage'))
      fetchCustomerOrders(cleanEmail)

    } catch (err) {
      console.error('Transaction login error:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('deechoi_customer_email')
    localStorage.removeItem('deechoi_customer_session')
    setCustomerSession(null)
    setOrders([])
    setLoginEmail('')
    setLoginCode('')
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
      fetchStorefrontReviews()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review'
      alert(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleReplyToReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReviewModal || !replyText.trim()) return

    try {
      setSubmittingReply(true)
      const currentUserName = customerSession?.email ? customerSession.email.split('@')[0] : 'Community Member'

      const res = await fetch('/api/reviews/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReviewModal.id,
          userName: currentUserName,
          responseText: replyText.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to submit response')
      setReplyText('')
      alert('Your response has been submitted! It will appear publicly once approved by our admin team.')
      fetchStorefrontReviews()
      setSelectedReviewModal(null)
    } catch (err: any) {
      alert(err.message || 'Failed to submit response.')
    } finally {
      setSubmittingReply(false)
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

  const hasSession = Boolean(customerSession?.email && customerSession.email.includes('@'))

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Storefront
          </Link>

          {hasSession && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { fetchCustomerOrders(); fetchStorefrontReviews(); }}
                className="text-xs font-bold text-[#0A2E1D] hover:underline flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* IF NOT LOGGED IN: SHOW TRANSACTION LOGIN SCREEN */}
        {!hasSession ? (
          <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl border border-stone-200/80 shadow-md my-8">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Customer Dashboard Access
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Enter your email address and 5-digit transaction code to view your orders.
              </p>
            </div>

            <form onSubmit={handleTransactionLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-stone-400" />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. user@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="pl-10 text-xs sm:text-sm bg-stone-50/50 border-stone-200 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Transaction Code (5 Digits)
                </label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-3.5 w-4 h-4 text-stone-400" />
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="current-password"
                    placeholder="e.g. 12345"
                    value={loginCode}
                    onChange={(e) => {
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 5)
                      setLoginCode(numericOnly)
                    }}
                    required
                    className="pl-10 text-xs sm:text-sm bg-stone-50/50 border-stone-200 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-xl font-mono tracking-widest"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 pl-1">
                  Must be exactly 5 numbers (no letters).
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl transition shadow-sm cursor-pointer mt-2"
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>
          </div>
        ) : (
          /* IF LOGGED IN: SHOW DASHBOARD & ORDERS */
          <>
            {/* Hero Banner */}
            <div className="mb-8 bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <History className="w-4 h-4" />
                <span>Order History & Reviews</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Your Order History & Community Reviews
              </h1>
              
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-lg">
                Track live dispatches, view receipts, and click any community review below to read full details and view approved replies.
              </p>

              <div className="mt-4 pt-4 border-t border-emerald-800/60 flex flex-wrap gap-4 text-xs text-emerald-200">
                <span className="flex items-center gap-1.5 bg-[#041a11] px-3 py-1 rounded-full border border-emerald-700/40">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  {customerSession?.email}
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#0A2E1D] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'completed'
                    ? 'bg-[#0A2E1D] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                Delivered ({completedOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'bg-[#0A2E1D] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Storefront Reviews ({storeReviews.length})
              </button>
            </div>

            {/* TAB CONTENT: STOREFRONT REVIEWS FEED */}
            {activeTab === 'reviews' ? (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-4">
                  <h3 className="font-extrabold text-sm sm:text-base text-[#0A2E1D] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#EAA823]" />
                    <span>Storefront Customer Reviews &amp; Conversations</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Click any review card below to view the complete feedback, read approved replies, and add your own response!
                  </p>
                </div>

                {loadingReviews ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0A2E1D]" />
                    <p className="text-xs text-gray-400 mt-2">Loading storefront reviews...</p>
                  </div>
                ) : storeReviews.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8">
                    <p className="text-xs text-gray-500">No storefront reviews available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {storeReviews.map((rev) => {
                      const approvedCount = (rev.responses || []).filter(r => r.is_approved).length

                      return (
                        <div
                          key={rev.id}
                          onClick={() => setSelectedReviewModal(rev)}
                          className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs sm:text-sm text-[#0A2E1D] group-hover:text-amber-600 transition">
                                  {rev.customer_name}
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                                  Verified Meal
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Ordered: <span className="font-bold text-gray-600">{rev.item_ordered}</span> • {new Date(rev.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-[#EAA823] text-[#EAA823]' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-gray-700 font-medium line-clamp-2 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                            &ldquo;{rev.review_text}&rdquo;
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-gray-500 font-semibold flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-[#EAA823]" />
                              {approvedCount} approved repl{approvedCount !== 1 ? 'ies' : 'y'}
                            </span>
                            <span className="text-amber-600 font-bold group-hover:underline flex items-center gap-1">
                              View Complete Review &amp; Replies <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* TAB CONTENT: ORDERS LISTING */
              <>
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
                        : 'No order history associated with your email address.'}
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
              </>
            )}
          </>
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
                  {submittingQueryLoadingCheck(submittingReview)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Complete Review & Replies Modal */}
      {selectedReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#EAA823]" />
                <h3 className="font-extrabold text-base text-[#0A2E1D]">Complete Review &amp; Conversation</h3>
              </div>
              <button
                onClick={() => setSelectedReviewModal(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Review Details */}
            <div className="space-y-3 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#0A2E1D]">{selectedReviewModal.customer_name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      Verified Order
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Item Ordered: <span className="font-bold text-gray-600">{selectedReviewModal.item_ordered}</span> • {new Date(selectedReviewModal.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-4 h-4 ${s <= selectedReviewModal.rating ? 'fill-[#EAA823] text-[#EAA823]' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                &ldquo;{selectedReviewModal.review_text}&rdquo;
              </p>
            </div>

            {/* Approved Replies Thread */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#EAA823]" />
                Approved Community Replies &amp; Responses
              </h4>

              {(() => {
                const approvedResponses = (selectedReviewModal.responses || []).filter(r => r.is_approved)
                if (approvedResponses.length === 0) {
                  return (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                      No approved replies for this review yet. Be the first to respond below!
                    </p>
                  )
                }

                return (
                  <div className="space-y-2.5 pl-3 sm:pl-4 border-l-2 border-[#EAA823]">
                    {approvedResponses.map((resp) => (
                      <div key={resp.id} className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/60 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-[#0A2E1D] flex items-center gap-1">
                            <CornerDownRight className="w-3.5 h-3.5 text-[#EAA823]" />
                            {resp.user_name}
                          </span>
                          <span className="text-[9px] text-gray-400">{new Date(resp.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-700 pl-4">{resp.responseText || resp.response_text}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleReplyToReview} className="pt-3 border-t border-gray-100 space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Add Your Reply to this Review:
              </label>
              <textarea
                rows={2}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your friendly response or advice..."
                className="w-full text-xs bg-[#FDFBF7] border border-gray-200 p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#0A2E1D]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReviewModal(null)}
                  className="text-xs font-bold py-5 rounded-xl border-gray-200 cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold text-xs py-5 px-6 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[#EAA823]" />}
                  <span>Submit for Approval</span>
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}

function submittingQueryLoadingCheck(submittingReview: boolean) {
  return submittingReview ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Submitting...</span>
    </>
  ) : (
    <>
      <Send className="w-4 h-4 text-[#EAA823]" />
      <span>Post Review</span>
    </>
  )
}