'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Sparkles, 
  Gift, 
  X, 
  Loader2, 
  PartyPopper,
  Flame
} from 'lucide-react'

// 10-day launch countdown target: August 27, 2026 at 00:00:00 GMT+1
const LAUNCH_TARGET_DATE = new Date('2026-08-27T00:00:00+01:00').getTime()

export function WaitlistCountdownSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 10,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    favoriteDish: 'Jumbo Shawarma & Fried Rice',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const difference = Math.max(0, LAUNCH_TARGET_DATE - now)

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Please complete your name, email address, and phone number.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist')

      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error joining waitlist'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* 10-Day Waitlist Countdown Bar */}
      <section className="bg-gradient-to-r from-[#051B10] via-[#072d1d] to-[#051B10] text-white py-5 sm:py-6 px-4 border-b-2 border-[#EAA823]/40 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:12px_12px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Header & Value Proposition */}
          <div className="text-center lg:text-left space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-[#EAA823]/20 border border-[#EAA823]/40 text-[#EAA823] text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
              <Flame className="w-3.5 h-3.5 text-[#EAA823] animate-pulse" />
              <span>Official 10-Day Launch Preview</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              We Are Launching in 10 Days!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Explore our fresh kitchen menu & bespoke celebration cakes. Online orders unlock on launch day! Join the waitlist for <strong className="text-[#EAA823]">15% OFF</strong> your first order.
            </p>
          </div>

          {/* Live Countdown Clocks */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 sm:p-3.5 text-center min-w-[62px] sm:min-w-[76px] shadow-lg">
              <span className="block text-2xl sm:text-3xl font-black text-[#EAA823] font-mono leading-none">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold text-gray-300 tracking-wider">Days</span>
            </div>

            <span className="text-xl sm:text-2xl font-black text-[#EAA823]">:</span>

            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 sm:p-3.5 text-center min-w-[62px] sm:min-w-[76px] shadow-lg">
              <span className="block text-2xl sm:text-3xl font-black text-[#EAA823] font-mono leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold text-gray-300 tracking-wider">Hours</span>
            </div>

            <span className="text-xl sm:text-2xl font-black text-[#EAA823]">:</span>

            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 sm:p-3.5 text-center min-w-[62px] sm:min-w-[76px] shadow-lg">
              <span className="block text-2xl sm:text-3xl font-black text-[#EAA823] font-mono leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold text-gray-300 tracking-wider">Mins</span>
            </div>

            <span className="text-xl sm:text-2xl font-black text-[#EAA823]">:</span>

            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 sm:p-3.5 text-center min-w-[62px] sm:min-w-[76px] shadow-lg">
              <span className="block text-2xl sm:text-3xl font-black text-[#EAA823] font-mono leading-none">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold text-gray-300 tracking-wider">Secs</span>
            </div>
          </div>

          {/* Action Trigger */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-black text-xs sm:text-sm px-7 py-6 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            <span>Join VIP Waitlist</span>
          </Button>

        </div>
      </section>

      {/* Join Waitlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 text-[#0A2E1D] relative">
            
            <button
              onClick={() => {
                setIsModalOpen(false)
                setSubmitted(false)
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <PartyPopper className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#0A2E1D]">You&apos;re on the VIP List!</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  We have secured your priority spot and sent your <strong>15% OFF Launch Voucher</strong> to your email. We will notify you the moment ordering opens!
                </p>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold text-xs rounded-full px-8 py-5 mt-2 cursor-pointer transition"
                >
                  Explore Storefront Menu
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mb-1">
                    <Sparkles className="w-3 h-3 text-[#EAA823]" />
                    <span>Exclusive 15% Launch Discount</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#0A2E1D]">Join Priority Waitlist</h3>
                  <p className="text-xs text-gray-500">
                    Be the first in line to enjoy our freshly cooked meals & bespoke celebration cakes when we launch in 10 days.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Joy Williams"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                    <Input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number (WhatsApp) *</label>
                    <Input
                      type="tel"
                      required
                      placeholder="e.g. +234 703 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Meal / Cake you are most excited for</label>
                    <Input
                      type="text"
                      placeholder="e.g. Jumbo Shawarma, 7-inch Red Velvet Cake, Seafood Pasta"
                      value={formData.favoriteDish}
                      onChange={(e) => setFormData({ ...formData, favoriteDish: e.target.value })}
                      className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black py-6 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Securing Your Spot...</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 text-[#EAA823]" />
                        <span>Claim 15% VIP Launch Pass</span>
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}