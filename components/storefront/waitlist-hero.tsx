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
  Flame,
  Check,
  Plus,
  Minus,
  GraduationCap,
  Tag,
  Utensils
} from 'lucide-react'

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

  // Coupon State
  const [couponCode, setCouponCode] = useState('DEECHOI15')
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

  // Calculate parfait exact price from menu chart
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
      return 4000 // Chocolate
    }
    return 5500
  }

  // Compile full human-readable dishes description
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

  // Exact internal calculated pricing model
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
    if (couponCode.trim().toUpperCase() === 'DEECHOI15') {
      setCouponApplied(true)
    } else {
      setCouponError('Invalid voucher code. Enter DEECHOI15 for 15% discount.')
      setCouponApplied(false)
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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        favoriteDish: compileFavoriteDishes(),
        selectedItems,
        wantsTraining,
      }

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const rawTotal = calculateEstimatedTotal()
  const discountAmount = Math.round(rawTotal * 0.15)
  const finalDiscountedTotal = rawTotal - discountAmount

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
              Explore our fresh kitchen menu & bespoke celebration cakes. Online orders unlock on launch day! Join the waitlist for <strong className="text-[#EAA823]">15% OFF</strong> your selected dishes.
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 text-[#0A2E1D] relative max-h-[90vh] overflow-y-auto">
            
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
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <PartyPopper className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#0A2E1D]">You&apos;re on the VIP List!</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  We have secured your priority spot for <strong>{formData.name}</strong>. Your launch discount code has been locked in:
                </p>

                {/* Voucher Code Card */}
                <div className="bg-[#072d1d] text-[#EAA823] p-4 rounded-2xl border border-amber-400/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-300 block">Your Exclusive Launch Voucher</span>
                  <p className="font-mono font-black text-2xl tracking-widest text-[#EAA823]">DEECHOI15</p>
                  <p className="text-[11px] text-emerald-200/90 font-semibold">15% OFF your selected order on launch day</p>
                </div>

                {/* Selected Dishes Summary with Discounted Projection */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-200 text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-extrabold text-[#0A2E1D]">Your Selected Menu Preview:</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {selectedItems.length} Category{selectedItems.length > 1 ? 'ies' : ''} Saved
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed text-[11px]">
                    {compileFavoriteDishes()}
                  </p>

                  {rawTotal > 0 && (
                    <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Standard Menu Value:</span>
                        <span>₦{rawTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>VIP Launch Discount (15%):</span>
                        <span>-₦{discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#0A2E1D] font-black text-sm pt-1 border-t border-gray-100">
                        <span>Estimated Launch Price:</span>
                        <span className="text-emerald-700">₦{finalDiscountedTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setIsModalOpen(false)
                    setSubmitted(false)
                  }}
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
                    Select the dishes you want to unlock with your 15% VIP voucher when online orders launch in 10 days.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
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
                      <span className="text-[10px] text-gray-400 font-bold">
                        {selectedItems.length} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {MENU_CATALOG.map((item) => {
                        const isSelected = selectedItems.includes(item.id)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleItem(item.id)}
                            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 relative ${
                              isSelected
                                ? 'bg-[#072d1d] text-[#EAA823] border-[#072d1d] shadow-sm ring-2 ring-[#EAA823]/40'
                                : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:bg-amber-50/50'
                            }`}
                          >
                            <span className="text-lg leading-none">{item.icon}</span>
                            <span className="text-[11px] font-extrabold leading-tight text-center">
                              {item.label}
                            </span>
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
                    
                    {/* 1. Shawarma Size Selection */}
                    {selectedItems.includes('shawarma') && (
                      <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-gray-200 space-y-2 animate-in fade-in duration-150">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">🫔 Shawarma Size:</span>
                          <span className="text-[10px] text-amber-700 font-bold">Jumbo: ₦12,000 | Medium: ₦5,000</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { size: 'Medium size', price: '₦5,000', desc: 'Classic single sausage roll' },
                            { size: 'Jumbo size', price: '₦12,000', desc: 'Double sausage + extra meat' },
                          ].map((opt) => (
                            <button
                              key={opt.size}
                              type="button"
                              onClick={() => setShawarmaSize(opt.size as any)}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                shawarmaSize === opt.size
                                  ? 'bg-[#072d1d] text-white border-[#072d1d] shadow-xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-black">{opt.size}</p>
                                <span className="text-[10px] font-black text-[#EAA823]">{opt.price}</span>
                              </div>
                              <p className="text-[10px] opacity-75 leading-tight mt-0.5">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Stir-Fried Noodles Protein & Quantity */}
                    {selectedItems.includes('noodles') && (
                      <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-gray-200 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">🍜 Noodles (Base ₦3,000):</span>
                          <span className="text-[10px] text-emerald-800 font-bold">Turkey ₦6k | Cubes ₦2k/ea</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { protein: 'Full Turkey', price: '+₦6,000', desc: 'Crispy fried large turkey cut' },
                            { protein: 'Turkey Cubes', price: '₦2,000/cube', desc: 'Tender diced turkey chunks' },
                          ].map((prot) => (
                            <button
                              key={prot.protein}
                              type="button"
                              onClick={() => setNoodleProtein(prot.protein as any)}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                noodleProtein === prot.protein
                                  ? 'bg-[#072d1d] text-white border-[#072d1d] shadow-xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-black">{prot.protein}</p>
                                <span className="text-[10px] font-black text-[#EAA823]">{prot.price}</span>
                              </div>
                              <p className="text-[10px] opacity-75 leading-tight mt-0.5">{prot.desc}</p>
                            </button>
                          ))}
                        </div>

                        {/* Turkey Cubes Count Selection */}
                        {noodleProtein === 'Turkey Cubes' && (
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200">
                            <div>
                              <span className="text-xs font-bold text-gray-700">Turkey Cubes Count</span>
                              <span className="text-[10px] text-gray-400 block">₦2,000 per cube</span>
                            </div>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setNoodleTurkeyCubesCount(Math.max(1, noodleTurkeyCubesCount - 1))}
                                className="p-1 hover:bg-gray-100 rounded text-gray-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-xs w-4 text-center">{noodleTurkeyCubesCount}</span>
                              <button
                                type="button"
                                onClick={() => setNoodleTurkeyCubesCount(noodleTurkeyCubesCount + 1)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                          <span className="text-xs font-bold text-[#0A2E1D]">Portion Count:</span>
                          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl p-1 shadow-xs">
                            <button
                              type="button"
                              onClick={() => setNoodleQuantity(Math.max(1, noodleQuantity - 1))}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-xs text-[#0A2E1D] w-5 text-center">
                              {noodleQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setNoodleQuantity(noodleQuantity + 1)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Catfish Pepper Soup */}
                    {selectedItems.includes('pepper_soup') && (
                      <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-gray-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
                        <div>
                          <p className="font-extrabold text-[#0A2E1D]">Catfish Pepper Soup</p>
                          <p className="text-[10px] text-gray-500">Prepared fresh with aromatic native herbs</p>
                        </div>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                          Full Catfish (1 Liter) &bull; ₦16,000
                        </span>
                      </div>
                    )}

                    {/* 4. Fried & Jollof Rice */}
                    {selectedItems.includes('rice') && (
                      <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-gray-200 space-y-2 animate-in fade-in duration-150">
                        <span className="text-[11px] font-bold text-gray-700 uppercase">🍚 Rice Preparation:</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { name: 'Signature Fried Rice', price: '₦3,000' },
                            { name: 'Smokey Jollof Rice', price: '₦3,000' },
                            { name: 'Mixed Fried & Jollof Rice', price: '₦3,500' },
                          ].map((style) => (
                            <button
                              key={style.name}
                              type="button"
                              onClick={() => setRiceStyle(style.name as any)}
                              className={`p-2 rounded-xl border text-center transition cursor-pointer text-[10px] font-bold leading-snug ${
                                riceStyle === style.name
                                  ? 'bg-[#072d1d] text-[#EAA823] border-[#072d1d] shadow-xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="block">{style.name}</span>
                              <span className="text-[9px] opacity-80 text-[#EAA823] font-bold">{style.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. Parfaits & Cake Loaf Menu */}
                    {selectedItems.includes('parfait') && (
                      <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-gray-200 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">🍓 Parfait & Cake Menu:</span>
                          <span className="text-[10px] font-black text-amber-700">Price: ₦{getParfaitPrice().toLocaleString()}</span>
                        </div>

                        {/* Parfait category tabs */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                          {[
                            'Classic Parfait',
                            'Tropical',
                            'Nutty Essence',
                            'Cake Parfait',
                            'Mini Cakeloaf',
                          ].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setParfaitCategory(cat as any)}
                              className={`p-1.5 rounded-lg border text-center transition cursor-pointer text-[9px] font-bold ${
                                parfaitCategory === cat
                                  ? 'bg-[#072d1d] text-[#EAA823] border-[#072d1d]'
                                  : 'bg-white text-gray-700 border-gray-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Category specific sub-controls */}
                        {parfaitCategory !== 'Mini Cakeloaf' ? (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-gray-500 block">
                              {parfaitCategory === 'Classic Parfait' && 'Yogurt layered with apples, grapes, granola, coconut flakes & cashew.'}
                              {parfaitCategory === 'Tropical' && 'Yogurt with apple, grape slices, coconut flakes, cashew & almond.'}
                              {parfaitCategory === 'Nutty Essence' && 'Granola, coconut flakes, cashew, almonds with little/no fruit.'}
                              {parfaitCategory === 'Cake Parfait' && 'Vanilla, chocolate & red velvet layers with whipped cream & caramel.'}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { 
                                  size: '350ml', 
                                  price: parfaitCategory === 'Classic Parfait' ? '₦5,500' : parfaitCategory === 'Cake Parfait' ? '₦6,000' : '₦6,500'
                                },
                                { 
                                  size: '1 liter', 
                                  price: parfaitCategory === 'Classic Parfait' ? '₦13,000' : '₦14,000'
                                },
                              ].map((sz) => (
                                <button
                                  key={sz.size}
                                  type="button"
                                  onClick={() => setParfaitSize(sz.size as any)}
                                  className={`p-2 rounded-xl border flex justify-between items-center text-xs font-bold ${
                                    parfaitSize === sz.size
                                      ? 'bg-[#072d1d] text-white border-[#072d1d]'
                                      : 'bg-white text-gray-700 border-gray-200'
                                  }`}
                                >
                                  <span>{sz.size}</span>
                                  <span className="text-[#EAA823] text-[11px]">{sz.price}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-gray-500 block">Comes with whipped cream and luxury toppings:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {[
                                { flavor: 'Chocolate', price: '₦4,000' },
                                { flavor: 'Red Velvet', price: '₦4,500' },
                                { flavor: 'Vanilla', price: '₦4,300' },
                                { flavor: '2 Mixed Flavours', price: '₦4,600' },
                              ].map((loaf) => (
                                <button
                                  key={loaf.flavor}
                                  type="button"
                                  onClick={() => setCakeloafFlavor(loaf.flavor as any)}
                                  className={`p-2 rounded-xl border text-center text-[10px] font-bold ${
                                    cakeloafFlavor === loaf.flavor
                                      ? 'bg-[#072d1d] text-white border-[#072d1d]'
                                      : 'bg-white text-gray-700 border-gray-200'
                                  }`}
                                >
                                  <span className="block">{loaf.flavor}</span>
                                  <span className="text-[#EAA823] text-[9px] font-black">{loaf.price}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 6. Zobo Beverage */}
                    {selectedItems.includes('zobo') && (
                      <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-gray-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
                        <div>
                          <p className="font-extrabold text-[#0A2E1D]">Signature Spiced Zobo Drink</p>
                          <p className="text-[10px] text-gray-500">Slow-brewed with fresh ginger, pineapple & cloves</p>
                        </div>
                        <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                          ₦2,500
                        </span>
                      </div>
                    )}

                  </div>

                  {/* SPECIAL BUTTON FOR DE-ECHOI TRAINING */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setWantsTraining(!wantsTraining)}
                      className={`w-full p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                        wantsTraining
                          ? 'bg-gradient-to-r from-[#072d1d] to-[#12422C] text-white border-[#EAA823] shadow-md'
                          : 'bg-[#FDFBF7] text-[#0A2E1D] border-dashed border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <div className={`p-2 rounded-xl ${wantsTraining ? 'bg-[#EAA823] text-[#072d1d]' : 'bg-gray-100 text-gray-600'}`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black">
                            {wantsTraining ? '✓ Registered for De-echoi Academy' : 'Enroll in De-echoi Training Academy'}
                          </p>
                          <p className={`text-[10px] ${wantsTraining ? 'text-emerald-200' : 'text-gray-500'}`}>
                            Learn professional baking, catering & food production in Port Harcourt.
                          </p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        wantsTraining ? 'bg-[#EAA823] border-[#EAA823] text-[#072d1d]' : 'border-gray-300 bg-white'
                      }`}>
                        {wantsTraining && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  </div>

                  {/* INTERACTIVE COUPON CODE & LIVE DISCOUNT CALCULATOR */}
                  <div className="bg-[#072d1d] rounded-2xl p-3.5 text-white space-y-3 border border-amber-400/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#EAA823]">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Launch Voucher Simulator</span>
                      </div>
                      <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        15% Discount
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="e.g. DEECHOI15"
                        className="bg-[#041a11] border-emerald-700/50 text-white font-mono font-bold text-xs uppercase py-2"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-extrabold text-xs px-4 py-2 rounded-xl flex-shrink-0 cursor-pointer"
                      >
                        Apply Code
                      </Button>
                    </div>

                    {couponError && (
                      <p className="text-[10px] text-red-300 bg-red-950/60 p-2 rounded-lg">{couponError}</p>
                    )}

                    {couponApplied && rawTotal > 0 && (
                      <div className="bg-[#041a11] p-2.5 rounded-xl border border-emerald-500/30 text-xs space-y-1 text-emerald-100">
                        <div className="flex justify-between text-[11px] text-gray-300">
                          <span>Selected Dishes Value:</span>
                          <span>₦{rawTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#EAA823] font-bold text-[11px]">
                          <span>15% Launch Savings:</span>
                          <span>-₦{discountAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white font-black text-xs pt-1 border-t border-emerald-800">
                          <span>Your Launch Price:</span>
                          <span className="text-[#EAA823]">₦{finalDiscountedTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
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