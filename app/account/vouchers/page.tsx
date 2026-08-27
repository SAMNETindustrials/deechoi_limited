'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { 
  Tag, 
  Gift, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  ChevronLeft, 
  ArrowRight,
  ShieldCheck, 
  AlertCircle, 
  ShoppingBag,
  UtensilsCrossed
} from 'lucide-react'
import Link from 'next/link'

interface ClaimedVoucher {
  id: string
  promo_code: string
  discount_percentage: number
  status: 'active' | 'redeemed' | 'expired'
  claimed_at: string
  redeemed_at?: string
  store_events?: {
    title: string
    event_type: string
  }
}

export default function CustomerVouchersPage() {
  const [vouchers, setVouchers] = useState<ClaimedVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  // 10-Day Countdown State (Target: 10 days from component mount/current time)
  const [timeLeft, setTimeLeft] = useState({ days: 10, hours: 0, minutes: 0, seconds: 0 })
  const supabase = createClient()

  useEffect(() => {
    loadUserVouchers()

    // Set target end date to exactly 10 days from now (persisted in localStorage or freshly calculated)
    const expiryKey = 'deechoi_lunch_vouchers_expiry'
    let targetTime = localStorage.getItem(expiryKey)
    
    if (!targetTime) {
      const tenDaysFromNow = new Date().getTime() + 10 * 24 * 60 * 60 * 1000
      localStorage.setItem(expiryKey, tenDaysFromNow.toString())
      targetTime = tenDaysFromNow.toString()
    }

    const endTime = parseInt(targetTime, 10)

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const difference = endTime - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(timer)
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft({ days, hours, minutes, seconds })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const loadUserVouchers = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      const session = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
      const email = (user?.email || session.email || localStorage.getItem('deechoi_customer_email') || '').trim().toLowerCase()

      if (!email) {
        const localVoucherCode = localStorage.getItem('active_checkout_voucher')
        if (localVoucherCode) {
          setVouchers([{
            id: 'local-cached-vouch',
            promo_code: localVoucherCode,
            discount_percentage: 15,
            status: 'active',
            claimed_at: new Date().toISOString(),
            store_events: { title: 'Lunch Voucher Reward', event_type: 'lunch_voucher' }
          }])
        }
        setLoading(false)
        return
      }

      setUserEmail(email)

      const { data, error } = await supabase
        .from('store_event_claims')
        .select('*, store_events(title, event_type)')
        .ilike('customer_email', email)
        .order('claimed_at', { ascending: false })

      if (error) {
        console.warn('Supabase voucher query warning:', error.message)
      }

      let fetchedVouchers: ClaimedVoucher[] = data || []

      const localVoucherCode = localStorage.getItem('active_checkout_voucher')
      if (localVoucherCode && !fetchedVouchers.some(v => v.promo_code === localVoucherCode)) {
        fetchedVouchers.unshift({
          id: 'local-cached-vouch',
          promo_code: localVoucherCode,
          discount_percentage: 15,
          status: 'active',
          claimed_at: new Date().toISOString(),
          store_events: { title: 'Lunch Voucher Campaign Reward', event_type: 'lunch_voucher' }
        })
      }

      setVouchers(fetchedVouchers)
    } catch (e: any) {
      console.warn('Vouchers load note:', e)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (code: string, id: string) => {
    if (!code) return
    localStorage.setItem('active_checkout_voucher', code)
    setCopiedId(id)

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch((err) => {
        console.warn('Clipboard write failed:', err)
      })
    } else {
      // Fallback for older browsers or restricted contexts
      const textArea = document.createElement('textarea')
      textArea.value = code
      textArea.style.position = 'fixed'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.warn('Fallback copy failed', err)
      }
      document.body.removeChild(textArea)
    }

    setTimeout(() => setCopiedId(null), 3000)
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-24">
      <StorefrontHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0A2E1D] mb-2">
              <ChevronLeft className="w-4 h-4" /> Back to Storefront
            </Link>
            <div className="flex items-center gap-2.5">
              <Tag className="w-6 h-6 text-[#EAA823]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2E1D]">Your Claimed Vouchers &amp; Rewards</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Track your active discounts and used voucher history for De-echoi purchases.
            </p>
          </div>

          <Link href="/#our-menu-section">
            <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold text-xs rounded-xl gap-2 cursor-pointer shadow-md">
              <ShoppingBag className="w-4 h-4" />
              Shop Food Menu
            </Button>
          </Link>
        </div>

        {/* User Status Notice (Moved above countdown card) */}
        {!userEmail ? (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
              <AlertCircle className="w-4 h-4" />
              <span>Guest Session Notice</span>
            </div>
            <p>
              Your device vouchers apply automatically during checkout. Sign in or enter your checkout email to view your permanent voucher wallet and history.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Logged in voucher wallet for: <b className="font-mono text-emerald-950">{userEmail}</b></span>
          </div>
        )}

        {/* Campaign Update Banner & Countdown */}
        <div className="bg-gradient-to-r from-[#0A2E1D] to-[#123F27] text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAA823] text-[#0A2E1D] rounded-full text-[11px] font-black uppercase tracking-wider">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              VIP Waitlist Concluded • Lunch Vouchers Active
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold">Claim Your Special Lunch Vouchers Now!</h2>
            <p className="text-xs text-gray-300 max-w-lg">
              The VIP waitlist period has officially ended. Transitioning to our exclusive lunch voucher campaign—grab yours before the countdown runs out!
            </p>
          </div>

          {/* Countdown Display */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3 text-center z-10 shrink-0">
            <div className="flex flex-col">
              <span className="text-lg font-black text-[#EAA823]">{timeLeft.days}</span>
              <span className="text-[10px] text-gray-300 uppercase font-semibold">Days</span>
            </div>
            <span className="text-gray-400 font-bold">:</span>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] text-gray-300 uppercase font-semibold">Hours</span>
            </div>
            <span className="text-gray-400 font-bold">:</span>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] text-gray-300 uppercase font-semibold">Mins</span>
            </div>
            <span className="text-gray-400 font-bold">:</span>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] text-gray-300 uppercase font-semibold">Secs</span>
            </div>
          </div>
        </div>

        {/* Voucher Cards */}
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-xs">Loading your rewards and voucher history...</div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
            <Gift className="w-10 h-10 text-[#EAA823] mx-auto opacity-60" />
            <h3 className="font-bold text-sm text-[#0A2E1D]">No vouchers found in your wallet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Participate in our active 10-day lunch voucher campaign on the storefront to unlock your discount code!
            </p>
            <div className="pt-2">
              <Link href="/#our-menu-section">
                <Button className="bg-[#EAA823] hover:bg-[#0A2E1D] text-[#0A2E1D] hover:text-white font-bold text-xs rounded-xl py-2 px-4 cursor-pointer">
                  Explore Menu &amp; Claim Vouchers
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((v) => {
              const isRedeemed = v.status === 'redeemed' || v.status === 'expired'
              return (
                <div 
                  key={v.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm space-y-3 transition-all ${
                    isRedeemed ? 'border-gray-200 opacity-75 bg-gray-50/50' : 'border-[#EAA823]/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isRedeemed ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {v.status.toUpperCase()}
                      </span>
                      <h4 className="font-extrabold text-sm text-[#0A2E1D] mt-1.5">
                        {v.store_events?.title || 'Lunch Voucher Reward'}
                      </h4>
                    </div>

                    <span className="text-base font-black text-[#0A2E1D] bg-[#FDFBF7] px-2.5 py-1 rounded-xl border border-gray-200">
                      {v.discount_percentage}% OFF
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#FDFBF7] p-2.5 rounded-xl border border-gray-200">
                    <span className="font-mono font-bold text-sm text-[#0A2E1D] tracking-wider">
                      {v.promo_code}
                    </span>

                    {!isRedeemed ? (
                      <button
                        onClick={() => copyCode(v.promo_code, v.id)}
                        className="text-xs font-bold bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedId === v.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-gray-400 italic">Used / Redeemed</span>
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100">
                    <span>Claimed: {new Date(v.claimed_at).toLocaleDateString()}</span>
                    {v.redeemed_at && <span>Used: {new Date(v.redeemed_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}