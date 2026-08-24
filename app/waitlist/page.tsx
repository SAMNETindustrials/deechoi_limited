'use client'

import { useState, useEffect } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Sparkles, 
  Gift, 
  X, 
  Loader2, 
  PartyPopper,
  Flame,
  Check,
  Plus,
  Minus,
  GraduationCap,
  Tag,
  Utensils,
  Copy,
  CheckCheck,
  ArrowRight,
  ShieldCheck,
  Star,
  Eye,
  ShoppingBag,
  ChevronLeft
} from 'lucide-react'
import Link from 'next/link'

// 10-day launch countdown target: August 27, 2026 at 00:00:00 GMT+1
const LAUNCH_TARGET_DATE = new Date('2026-08-27T00:00:00+01:00').getTime()

interface MenuItemConfig {
  id: string
  label: string
  icon: string
  defaultPrice: number
}

const MENU_CATALOG: MenuItemConfig[] = [
  { id: 'shawarma', label: 'Shawarma', icon: '🫔', defaultPrice: 12000 },
  { id: 'noodles', label: 'Stir-Fried Noodles', icon: '🍜', defaultPrice: 9000 },
  { id: 'pepper_soup', label: 'Catfish Pepper Soup', icon: '🥘', defaultPrice: 16000 },
  { id: 'rice', label: 'Fried / Jollof Rice', icon: '🍚', defaultPrice: 3500 },
  { id: 'parfait', label: 'Parfaits & Cakedelights', icon: '🍓', defaultPrice: 5500 },
  { id: 'zobo', label: 'Spiced Zobo Drink', icon: '🍹', defaultPrice: 2500 },
]

export default function WaitlistPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 10,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Multi-Selection State
  const [selectedItems, setSelectedItems] = useState<string[]>(['shawarma', 'noodles'])
  
  // Dynamic Item Configurations & Pricing Models
  const [shawarmaSize, setShawarmaSize] = useState<'Medium size' | 'Jumbo size'>('Jumbo size')
  const [noodleProtein, setNoodleProtein] = useState<'Full Turkey' | 'Turkey Cubes'>('Full Turkey')
  const [noodleQuantity, setNoodleQuantity] = useState(1)
  const [noodleTurkeyCubesCount, setNoodleTurkeyCubesCount] = useState(2)
  const [riceStyle, setRiceStyle] = useState<'Signature Fried Rice' | 'Smokey Jollof Rice' | 'Mixed Fried & Jollof Rice'>('Mixed Fried & Jollof Rice')
  
  // Parfait Menu Configurations from Price List
  const [parfaitCategory, setParfaitCategory] = useState<'Classic Parfait' | 'Tropical' | 'Nutty Essence' | 'Cake Parfait' | 'Mini Cakeloaf'>('Classic Parfait')
  const [parfaitSize, setParfaitSize] = useState<'350ml' | '1 liter'>('350ml')
  const [cakeloafFlavor, setCakeloafFlavor] = useState<'Chocolate' | 'Red Velvet' | 'Vanilla' | '2 Mixed Flavours'>('Chocolate')
  
  const [wantsTraining, setWantsTraining] = useState(false)

  // Unique Dynamic Promo Code State
  const [generatedPromoCode, setGeneratedPromoCode] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState(false)

  // Already-Registered & Preview Control State
  const [isAlreadyVip, setIsAlreadyVip] = useState(false)
  const [showCodePreview, setShowCodePreview] = useState(false)
  const [showAppliedPrompt, setShowAppliedPrompt] = useState(false)

  // Live Simulator Coupon State
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

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

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => 
      prev.includes(itemId) 
        ? prev.filter((id) => id !== itemId) 
        : [...prev, itemId]
    )
  }

  const getParfaitPrice = () => {
    if (parfaitCategory === 'Classic Parfait') {
      return parfaitSize === '1 liter' ? 13000 : 5500
    }
    if (parfaitCategory === 'Tropical') {
      return parfaitSize === '1 liter' ? 14000 : 6500
    }
    if (parfaitCategory === 'Nutty Essence') {
      return parfaitSize === '1 liter' ? 14000 : 6500
    }
    if (parfaitCategory === 'Cake Parfait') {
      return parfaitSize === '1 liter' ? 14000 : 6000
    }
    if (parfaitCategory === 'Mini Cakeloaf') {
      if (cakeloafFlavor === 'Red Velvet') return 4500
      if (cakeloafFlavor === 'Vanilla') return 4300
      if (cakeloafFlavor === '2 Mixed Flavours') return 4600
      return 4000
    }
    return 5500
  }

  const compileFavoriteDishes = () => {
    const parts: string[] = []

    if (selectedItems.includes('shawarma')) {
      parts.push(`Shawarma (${shawarmaSize} - ₦${(shawarmaSize === 'Jumbo size' ? 12000 : 5000).toLocaleString()})`)
    }
    if (selectedItems.includes('noodles')) {
      const proteinDesc = noodleProtein === 'Full Turkey' 
        ? `Full Turkey (+₦6,000)` 
        : `${noodleTurkeyCubesCount}x Turkey Cubes (+₦${(noodleTurkeyCubesCount * 2000).toLocaleString()})`
      parts.push(`Stir-Fried Noodles (${noodleQuantity} Portion${noodleQuantity > 1 ? 's' : ''} with ${proteinDesc})`)
    }
    if (selectedItems.includes('pepper_soup')) {
      parts.push('Catfish Pepper Soup (Full Catfish 1 Liter - ₦16,000)')
    }
    if (selectedItems.includes('rice')) {
      const ricePrice = riceStyle === 'Mixed Fried & Jollof Rice' ? 3500 : 3000
      parts.push(`${riceStyle} (₦${ricePrice.toLocaleString()})`)
    }
    if (selectedItems.includes('parfait')) {
      if (parfaitCategory === 'Mini Cakeloaf') {
        parts.push(`Mini Cakeloaf (${cakeloafFlavor} - ₦${getParfaitPrice().toLocaleString()})`)
      } else {
        parts.push(`${parfaitCategory} (${parfaitSize} - ₦${getParfaitPrice().toLocaleString()})`)
      }
    }
    if (selectedItems.includes('zobo')) {
      parts.push('Zobo Drink (Natural Hibiscus & Spices - ₦2,500)')
    }
    if (wantsTraining) {
      parts.push('Interested in De-echoi Catering & Baking Training Academy')
    }

    return parts.length > 0 ? parts.join(' • ') : 'General Kitchen Menu & Cakes'
  }

  const calculateEstimatedTotal = () => {
    let sum = 0
    if (selectedItems.includes('shawarma')) {
      sum += shawarmaSize === 'Jumbo size' ? 12000 : 5000
    }
    if (selectedItems.includes('noodles')) {
      const baseNoodle = 3000
      const proteinCost = noodleProtein === 'Full Turkey' ? 6000 : (noodleTurkeyCubesCount * 2000)
      sum += (baseNoodle + proteinCost) * noodleQuantity
    }
    if (selectedItems.includes('pepper_soup')) {
      sum += 16000
    }
    if (selectedItems.includes('rice')) {
      sum += riceStyle === 'Mixed Fried & Jollof Rice' ? 3500 : 3000
    }
    if (selectedItems.includes('parfait')) {
      sum += getParfaitPrice()
    }
    if (selectedItems.includes('zobo')) {
      sum += 2500
    }
    return sum
  }

  const handleApplyCoupon = () => {
    setCouponError(null)
    const code = couponCode.trim().toUpperCase()
    if (code.length >= 5) {
      setCouponApplied(true)
    } else {
      setCouponError('Enter a valid VIP code.')
      setCouponApplied(false)
    }
  }

  const handleCopyCode = async () => {
    if (!generatedPromoCode) return

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedPromoCode)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = generatedPromoCode
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      setCopiedCode(true)
      setShowAppliedPrompt(true)
      setTimeout(() => setCopiedCode(false), 2500)
    } catch (err) {
      console.warn('Clipboard copy failed:', err)
      setCopiedCode(true)
      setShowAppliedPrompt(true)
      setTimeout(() => setCopiedCode(false), 2500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Please complete your name, email address, and phone number.')
      return
    }

    if (selectedItems.length === 0 && !wantsTraining) {
      alert('Please select at least one menu item or toggle training.')
      return
    }

    try {
      setSubmitting(true)
      const personalPromo = `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const payload = {
        customerName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        favoriteDish: compileFavoriteDishes(),
        promoCode: personalPromo,
      }

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist')

      const activeCode = data.promoCode || personalPromo
      setGeneratedPromoCode(activeCode)
      setCouponCode(activeCode)

      localStorage.setItem('deechoi_customer_session', JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone }))
      localStorage.setItem('deechoi_customer_email', formData.email.trim().toLowerCase())
      localStorage.setItem('active_checkout_voucher', activeCode)

      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error joining waitlist'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const rawTotal = calculateEstimatedTotal()
  const discountAmount = Math.round(rawTotal * 0.15)
  const finalDiscountedTotal = rawTotal - discountAmount

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-24">
      <StorefrontHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0A2E1D] mb-2">
              <ChevronLeft className="w-4 h-4" /> Back to Storefront
            </Link>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-[#EAA823]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2E1D]">VIP Launch Waitlist &amp; Rewards</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lock in your priority spot and unlock your exclusive 15% discount voucher.
            </p>
          </div>

          <Link href="/account/vouchers">
            <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold text-xs rounded-xl gap-2 cursor-pointer shadow-md">
              <Gift className="w-4 h-4 text-[#EAA823]" />
              View My Voucher Wallet
            </Button>
          </Link>
        </div>

        {/* 10-Day Countdown Hero Banner */}
        <div className="bg-gradient-to-r from-[#051B10] via-[#072d1d] to-[#051B10] text-white py-6 sm:py-8 px-6 rounded-3xl border-2 border-[#EAA823]/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:12px_12px] opacity-10 pointer-events-none" />

          <div className="text-center lg:text-left space-y-1.5 max-w-lg relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-[#EAA823]/20 border border-[#EAA823]/40 text-[#EAA823] text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
              <Flame className="w-3.5 h-3.5 text-[#EAA823] animate-pulse" />
              <span>Official 10-Day Launch Preview</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              We Are Launching in 10 Days!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Explore our fresh kitchen menu & celebration cakes. Join the waitlist below to receive your <strong className="text-[#EAA823]">Unique 15% OFF VIP Code</strong>.
            </p>
          </div>

          {/* Live Countdown Clocks */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 text-center min-w-[58px] shadow-lg">
              <span className="block text-2xl font-black text-[#EAA823] font-mono leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase font-extrabold text-gray-300">Days</span>
            </div>
            <span className="text-xl font-black text-[#EAA823]">:</span>
            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 text-center min-w-[58px] shadow-lg">
              <span className="block text-2xl font-black text-[#EAA823] font-mono leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase font-extrabold text-gray-300">Hours</span>
            </div>
            <span className="text-xl font-black text-[#EAA823]">:</span>
            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 text-center min-w-[58px] shadow-lg">
              <span className="block text-2xl font-black text-[#EAA823] font-mono leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase font-extrabold text-gray-300">Mins</span>
            </div>
            <span className="text-xl font-black text-[#EAA823]">:</span>
            <div className="bg-[#12422C] border border-[#EAA823]/40 rounded-2xl p-2.5 text-center min-w-[58px] shadow-lg">
              <span className="block text-2xl font-black text-[#EAA823] font-mono leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase font-extrabold text-gray-300">Secs</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xl space-y-6">
          
          {submitted ? (
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
              
              {showAppliedPrompt ? (
                <div className="bg-gradient-to-br from-[#072d1d] via-[#0a3a26] to-[#041a11] text-white p-6 rounded-3xl border-2 border-amber-400/60 shadow-2xl space-y-4 text-left">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h4 className="text-xs font-black uppercase tracking-wider">VIP Code Applied Successfully!</h4>
                  </div>

                  <div className="bg-[#041a11] p-3 rounded-2xl border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Active Code:</span>
                      <strong className="font-mono text-base text-[#EAA823] tracking-widest">{generatedPromoCode}</strong>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-full">
                      15% APPLIED
                    </span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-300 border-b border-white/10 pb-1.5">
                      <span>Configured Items ({selectedItems.length}):</span>
                      <span>₦{rawTotal.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-emerald-200/80 italic">{compileFavoriteDishes()}</p>
                    <div className="flex items-center justify-between text-amber-300 font-bold pt-1">
                      <span>VIP 15% Launch Savings:</span>
                      <span>-₦{discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-white font-black text-sm pt-2 border-t border-white/10">
                      <span>Discounted Launch Total:</span>
                      <span className="text-[#EAA823] text-base">₦{finalDiscountedTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link href="/account/vouchers" className="flex-1">
                      <Button className="w-full bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-black text-xs py-3.5 rounded-xl cursor-pointer">
                        View in Voucher Wallet
                      </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full text-xs py-3.5 rounded-xl border-white/20 text-white hover:bg-white/10 cursor-pointer">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <PartyPopper className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0A2E1D]">You&apos;re on the VIP List!</h3>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                    Priority spot secured for <strong>{formData.name}</strong>. Your 15% discount voucher has been saved to your account wallet!
                  </p>

                  <div className="bg-[#072d1d] text-[#EAA823] p-5 rounded-3xl border-2 border-amber-400/50 shadow-xl space-y-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-200/80 tracking-wider block">
                      Your Personalized 15% VIP Voucher
                    </span>
                    
                    <div className="flex items-center justify-center gap-2 bg-[#041a11] py-3 px-4 rounded-2xl border border-emerald-700/50">
                      <p className="font-mono font-black text-2xl tracking-widest text-[#EAA823]">
                        {generatedPromoCode}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-90 cursor-pointer ml-2 flex items-center justify-center"
                        title="Copy Unique Code"
                      >
                        {copiedCode ? <CheckCheck className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-amber-300" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href="/account/vouchers" className="flex-1">
                      <Button className="w-full bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold text-xs py-4 rounded-2xl cursor-pointer shadow-md">
                        View in Voucher Wallet
                      </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full font-bold text-xs py-4 rounded-2xl border-gray-300 cursor-pointer">
                        Explore Storefront Menu
                      </Button>
                    </Link>
                  </div>
                </>
              )}

            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mb-1">
                  <Sparkles className="w-3 h-3 text-[#EAA823]" />
                  <span>Instant 15% Launch Reward</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#0A2E1D]">Secure Your Priority Spot</h3>
                <p className="text-xs text-gray-500">
                  Select your favorite dishes and unlock your unique discount pass immediately.
                </p>
              </div>

              {/* Contact Fields */}
              <div className="space-y-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                    <Input
                      type="email"
                      required
                      placeholder="e.g. joy@example.com"
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
                </div>
              </div>

              {/* MULTI-SELECT MENU CATEGORIES */}
              <div className="pt-2 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase text-[#0A2E1D] flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    Select Dishes You Want (Pick Multiple)
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold">{selectedItems.length} selected</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MENU_CATALOG.map((item) => {
                    const isSelected = selectedItems.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 relative ${
                          isSelected
                            ? 'bg-[#072d1d] text-[#EAA823] border-[#072d1d] shadow-sm ring-2 ring-[#EAA823]/40'
                            : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <span className="text-xl leading-none">{item.icon}</span>
                        <span className="text-xs font-extrabold leading-tight text-center">{item.label}</span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[#EAA823] text-[#072d1d] rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DYNAMIC CONFIGURATION FOR SELECTED ITEMS */}
              <div className="space-y-3 pt-1">
                {selectedItems.includes('shawarma') && (
                  <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-700 uppercase">🫔 Shawarma Size:</span>
                      <span className="text-[10px] text-amber-700 font-bold">Jumbo: ₦12,000 | Medium: ₦5,000</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { size: 'Medium size', price: '₦5,000', desc: 'Classic single sausage' },
                        { size: 'Jumbo size', price: '₦12,000', desc: 'Double sausage + extra meat' },
                      ].map((opt) => (
                        <button
                          key={opt.size}
                          type="button"
                          onClick={() => setShawarmaSize(opt.size as any)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            shawarmaSize === opt.size ? 'bg-[#072d1d] text-white border-[#072d1d]' : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-black">{opt.size}</p>
                            <span className="text-[10px] font-black text-[#EAA823]">{opt.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItems.includes('noodles') && (
                  <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-700 uppercase">🍜 Noodles (Base ₦3,000):</span>
                      <span className="text-[10px] text-emerald-800 font-bold">Turkey ₦6k | Cubes ₦2k/ea</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { protein: 'Full Turkey', price: '+₦6,000' },
                        { protein: 'Turkey Cubes', price: '₦2,000/cube' },
                      ].map((prot) => (
                        <button
                          key={prot.protein}
                          type="button"
                          onClick={() => setNoodleProtein(prot.protein as any)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            noodleProtein === prot.protein ? 'bg-[#072d1d] text-white border-[#072d1d]' : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-black">{prot.protein}</p>
                            <span className="text-[10px] font-black text-[#EAA823]">{prot.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {noodleProtein === 'Turkey Cubes' && (
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200">
                        <span className="text-xs font-bold text-gray-700">Turkey Cubes Count</span>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                          <button type="button" onClick={() => setNoodleTurkeyCubesCount(Math.max(1, noodleTurkeyCubesCount - 1))} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Minus className="w-3 h-3" /></button>
                          <span className="font-bold text-xs w-4 text-center">{noodleTurkeyCubesCount}</span>
                          <button type="button" onClick={() => setNoodleTurkeyCubesCount(noodleTurkeyCubesCount + 1)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SPECIAL TRAINING ACADEMY TOGGLE */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setWantsTraining(!wantsTraining)}
                  className={`w-full p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                    wantsTraining ? 'bg-[#072d1d] text-white border-[#EAA823]' : 'bg-[#FDFBF7] text-[#0A2E1D] border-dashed border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className={`p-2 rounded-xl ${wantsTraining ? 'bg-[#EAA823] text-[#072d1d]' : 'bg-gray-100 text-gray-600'}`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black">{wantsTraining ? '✓ Registered for Training Academy' : 'Enroll in De-echoi Training Academy'}</p>
                      <p className={`text-[10px] ${wantsTraining ? 'text-emerald-200' : 'text-gray-500'}`}>Professional baking &amp; catering training in PH.</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${wantsTraining ? 'bg-[#EAA823] border-[#EAA823] text-[#072d1d]' : 'border-gray-300 bg-white'}`}>
                    {wantsTraining && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black py-6 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating VIP Pass...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-[#EAA823]" />
                    <span>Claim 15% VIP Launch Pass</span>
                  </>
                )}
              </Button>
            </form>
          )}

        </div>

      </main>
    </div>
  )
}