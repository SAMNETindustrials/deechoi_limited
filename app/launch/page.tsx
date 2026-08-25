'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Sparkles, 
  Gift, 
  PartyPopper, 
  Check, 
  Copy, 
  CheckCheck, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Heart,
  Flower2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LaunchCelebrationPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [claimedVoucher, setClaimedVoucher] = useState<{ code: string; percent: number } | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Floating flower petals effect generator
  useEffect(() => {
    const createPetal = () => {
      const container = document.getElementById('petal-container')
      if (!container) return

      const petal = document.createElement('div')
      petal.className = 'absolute pointer-events-none animate-fall'
      
      const size = Math.floor(Math.random() * 14) + 10
      petal.style.width = `${size}px`
      petal.style.height = `${size}px`
      petal.style.left = `${Math.random() * 100}vw`
      petal.style.top = `-20px`
      petal.style.backgroundColor = Math.random() > 0.5 ? '#EAA823' : '#FF6B6B'
      petal.style.borderRadius = '100% 0 100% 0'
      petal.style.opacity = String(Math.random() * 0.7 + 0.3)
      petal.style.transform = `rotate(${Math.random() * 360}deg)`
      petal.style.animationDuration = `${Math.random() * 4 + 3}s`
      petal.style.animationTimingFunction = 'ease-in-out'

      container.appendChild(petal)
      setTimeout(() => {
        petal.remove()
      }, 7000)
    }

    const interval = setInterval(createPetal, 300)
    return () => clearInterval(interval)
  }, [])

  const handleClaimVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = formData.name.trim()
    const email = formData.email.trim().toLowerCase()
    const phone = formData.phone.trim()

    if (!name || !email || !phone) {
      setErrorMsg('Please enter your name, email, and phone number to claim your launch voucher.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg(null)

      const existingClaim = localStorage.getItem(`claimed_launch_email_${email}`)
      if (existingClaim) {
        throw new Error('This email has already claimed a launch voucher. One code per user!')
      }

      const generatedCode = `LAUNCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          email,
          phone,
          favoriteDish: 'Launch Celebration Access',
          promoCode: generatedCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate voucher')

      const activeCode = data.promoCode || generatedCode

      localStorage.setItem(`claimed_launch_email_${email}`, 'true')
      localStorage.setItem('deechoi_customer_session', JSON.stringify({ name, email, phone }))
      localStorage.setItem('deechoi_customer_email', email)
      localStorage.setItem('active_checkout_voucher', activeCode)
      localStorage.setItem('active_discount_percent', '20')

      setClaimedVoucher({ code: activeCode, percent: 20 })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error claiming voucher'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    if (!claimedVoucher?.code) return
    navigator.clipboard.writeText(claimedVoucher.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  const handleVisitStore = () => {
    if (claimedVoucher) {
      localStorage.setItem('active_checkout_voucher', claimedVoucher.code)
    }
    router.push('/#our-menu-section')
  }

  return (
    <div className="min-h-screen bg-[#072d1d] text-white font-sans relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Falling Petals Confetti Layer */}
      <div id="petal-container" className="absolute inset-0 overflow-hidden pointer-events-none z-10" />

      <div className="absolute inset-0 bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

      <div className="max-w-xl w-full relative z-20 space-y-6 my-auto text-center">
        
        {/* Celebration Badge */}
        <div className="inline-flex items-center gap-2 bg-[#EAA823]/20 border border-[#EAA823]/50 text-[#EAA823] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg animate-bounce">
          <Flower2 className="w-4 h-4 text-[#EAA823]" />
          <span>Official Launch Celebration &bull; De-echoi Limited</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
            We Are Officially <span className="text-[#EAA823]">Live!</span>
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/80 max-w-md mx-auto leading-relaxed">
            Welcome to the De-echoi grand launch. Claim your exclusive launch reward to unlock automatic discounts across all kitchen meals and celebration cakes.
          </p>
        </div>

        {claimedVoucher ? (
          <div className="bg-[#041a11] rounded-3xl p-6 sm:p-8 border-2 border-amber-400/60 shadow-2xl space-y-5 animate-in zoom-in-95 duration-300 text-left">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <PartyPopper className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-white">Voucher Claimed Successfully!</h3>
              <p className="text-xs text-emerald-200">
                Your <strong>{claimedVoucher.percent}% OFF</strong> launch voucher has been bound to your session and cart.
              </p>
            </div>

            <div className="bg-[#072d1d] p-4 rounded-2xl border border-amber-400/40 space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Your Single-Use Launch Code</span>
              <div className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-xl border border-emerald-500/30">
                <span className="font-mono font-black text-xl text-[#EAA823] tracking-widest">{claimedVoucher.code}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-[#EAA823] text-[#072d1d] font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-white transition"
                >
                  {copiedCode ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-emerald-300 italic">
                ℹ️ This code is single-use and will automatically apply to whatever items you add to your cart.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleVisitStore}
                className="w-full bg-[#EAA823] hover:bg-white text-[#072d1d] font-black py-6 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Visit Store &amp; Apply Voucher Automatically</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleClaimVoucher} className="bg-white text-[#0A2E1D] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-4 text-left">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#0A2E1D]">Claim Your Launch Voucher</h3>
              <p className="text-xs text-gray-500">Enter your details to instantly unlock your 20% discount pass.</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Samuel David"
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
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp / Phone *</label>
                <Input
                  type="tel"
                  required
                  placeholder="+234 700 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#EAA823] hover:bg-[#072d1d] text-[#072d1d] hover:text-white font-black py-6 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Unlocking Launch Voucher...</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 text-[#072d1d]" />
                  <span>Claim Launch Voucher Now</span>
                </>
              )}
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-emerald-200/60 pt-4">
          &copy; 2026 De-echoi Limited. All rights reserved. Single-use security enforced.
        </div>

      </div>

      {/* Falling Flower Petals CSS Animation */}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  )
}