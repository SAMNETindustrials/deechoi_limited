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
  Check,
  Plus,
  Minus,
  GraduationCap,
  Utensils,
  Copy,
  CheckCheck,
  ArrowRight,
  ShieldCheck,
  Star,
  Eye,
  MapPin,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState({
    days: 10,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isLive, setIsLive] = useState(false)
  
  // Real-time Clock & Operating Schedule State
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [currentDayName, setCurrentDayName] = useState('')
  const [currentTimeString, setCurrentTimeString] = useState('')
  const [kitchenStatus, setKitchenStatus] = useState<'breakfast' | 'regular' | 'closed' | 'sunday' | 'saturday_closed'>('closed')
  const [statusMessage, setStatusMessage] = useState('')

  // Inline Schedule Callout Toggle State
  const [showScheduleCallout, setShowScheduleCallout] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [selectedItems, setSelectedItems] = useState<string[]>(['shawarma', 'noodles'])
  const [shawarmaSize, setShawarmaSize] = useState<'Medium size' | 'Jumbo size'>('Jumbo size')
  const [noodleProtein, setNoodleProtein] = useState<'Full Turkey' | 'Turkey Cubes'>('Full Turkey')
  const [noodleQuantity, setNoodleQuantity] = useState(1)
  const [noodleTurkeyCubesCount, setNoodleTurkeyCubesCount] = useState(2)
  const [riceStyle, setRiceStyle] = useState<'Signature Fried Rice' | 'Smokey Jollof Rice' | 'Mixed Fried & Jollof Rice'>('Mixed Fried & Jollof Rice')
  
  const [parfaitCategory, setParfaitCategory] = useState<'Classic Parfait' | 'Tropical' | 'Nutty Essence' | 'Cake Parfait' | 'Mini Cakeloaf'>('Classic Parfait')
  const [parfaitSize, setParfaitSize] = useState<'350ml' | '1 liter'>('350ml')
  const [cakeloafFlavor, setCakeloafFlavor] = useState<'Chocolate' | 'Red Velvet' | 'Vanilla' | '2 Mixed Flavours'>('Chocolate')
  
  const [wantsTraining, setWantsTraining] = useState(false)

  const [generatedPromoCode, setGeneratedPromoCode] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState(false)

  const [isAlreadyVip, setIsAlreadyVip] = useState(false)
  const [showCodePreview, setShowCodePreview] = useState(false)
  const [showAppliedPrompt, setShowAppliedPrompt] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Real-world Time, World Clock & Operating Schedule Effect
  useEffect(() => {
    const updateOperatingHours = () => {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0: Sun, 1: Mon, ..., 6: Sat
      const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      setCurrentDayIndex(dayOfWeek)
      setCurrentDayName(daysList[dayOfWeek])
      setCurrentTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))

      const hours = now.getHours()
      const minutes = now.getMinutes()
      const totalMinutes = hours * 60 + minutes

      const breakfastStart = 7 * 60 + 30 // 7:30 AM
      const breakfastEnd = 9 * 60 + 30   // 9:30 AM
      const regularStart = 10 * 60       // 10:00 AM
      let regularEnd = 17 * 60           // 5:00 PM default

      if (dayOfWeek === 5) {
        // Friday: close by 3:30 PM
        regularEnd = 15 * 60 + 30
      } else if (dayOfWeek === 0) {
        // Sunday: 12:00 PM to 6:00 PM
        const sunStart = 12 * 60
        const sunEnd = 18 * 60
        if (totalMinutes >= sunStart && totalMinutes < sunEnd) {
          setKitchenStatus('sunday')
          setStatusMessage('Sunday Special Hours Active (12:00 PM - 6:00 PM)')
        } else {
          setKitchenStatus('closed')
          setStatusMessage('Sunday Hours: 12:00 PM - 6:00 PM')
        }
        return
      } else if (dayOfWeek === 6) {
        // Saturday: Closed (Pre-order against Sunday)
        setKitchenStatus('saturday_closed')
        setStatusMessage('Saturdays: Closed (Pre-orders open for Sunday)')
        return
      }

      if (totalMinutes >= breakfastStart && totalMinutes < breakfastEnd) {
        setKitchenStatus('breakfast')
        setStatusMessage('Breakfast Menu is Active (7:30 AM - 9:30 AM)')
      } else if (totalMinutes >= breakfastEnd && totalMinutes < regularStart) {
        setKitchenStatus('closed')
        setStatusMessage('Breakfast closed. Regular menu opens at 10:00 AM')
      } else if (totalMinutes >= regularStart && totalMinutes < regularEnd) {
        setKitchenStatus('regular')
        setStatusMessage('Store Open for Regular Menu Orders (10:00 AM - 5:00 PM)')
      } else {
        setKitchenStatus('closed')
        setStatusMessage('Kitchen is currently closed for the day.')
      }
    }

    updateOperatingHours()
    const timer = setInterval(updateOperatingHours, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const difference = Math.max(0, LAUNCH_TARGET_DATE - now)

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      if (difference <= 0) setIsLive(true)
    }

    updateCountdown()
    const countdownTimer = setInterval(updateCountdown, 1000)
    return () => clearInterval(countdownTimer)
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
    if (parfaitCategory === 'Tropical' || parfaitCategory === 'Nutty Essence') {
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

  const handleCopyCode = async () => {
    if (!generatedPromoCode) return
    try {
      await navigator.clipboard.writeText(generatedPromoCode)
      setCopiedCode(true)
      setShowAppliedPrompt(true)
      setTimeout(() => setCopiedCode(false), 2500)
    } catch {
      setCopiedCode(true)
      setShowAppliedPrompt(true)
      setTimeout(() => setCopiedCode(false), 2500)
    }
  }

  const handleCancelPrompt = () => {
    setShowAppliedPrompt(false)
    setIsModalOpen(false)
    setSubmitted(false)
    setIsAlreadyVip(false)
    setShowCodePreview(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const customerName = formData.name.trim()
    const email = formData.email.trim().toLowerCase()
    const phone = formData.phone.trim()

    if (!customerName || !email || !phone) {
      alert('Please complete your name, email address, and phone number.')
      return
    }

    try {
      setSubmitting(true)
      const personalPromo = isLive 
        ? `LAUNCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}` 
        : `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const payload = {
        customerName,
        email,
        phone,
        favoriteDish: compileFavoriteDishes(),
        selectedItems,
        wantsTraining,
        promoCode: personalPromo,
      }

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process request')

      const activeCode = data.promoCode || personalPromo
      setGeneratedPromoCode(activeCode)

      localStorage.setItem('deechoi_customer_session', JSON.stringify({ name: customerName, email, phone }))
      localStorage.setItem('deechoi_customer_email', email)
      localStorage.setItem('active_checkout_voucher', activeCode)

      if (data.alreadyRegistered) {
        setIsAlreadyVip(true)
        setShowCodePreview(false)
      } else {
        setIsAlreadyVip(false)
        setShowCodePreview(true)
      }
      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error processing request'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const weeklySchedule = [
    { day: 'Monday', hours: 'Breakfast: 7:30 - 9:30 AM | Regular: 10:00 AM - 5:00 PM', idx: 1 },
    { day: 'Tuesday', hours: 'Breakfast: 7:30 - 9:30 AM | Regular: 10:00 AM - 5:00 PM', idx: 2 },
    { day: 'Wednesday', hours: 'Breakfast: 7:30 - 9:30 AM | Regular: 10:00 AM - 5:00 PM', idx: 3 },
    { day: 'Thursday', hours: 'Breakfast: 7:30 - 9:30 AM | Regular: 10:00 AM - 5:00 PM', idx: 4 },
    { day: 'Friday', hours: 'Breakfast: 7:30 - 9:30 AM | Close Early: 3:30 PM', idx: 5 },
    { day: 'Saturday', hours: 'Closed (Pre-orders against Sunday)', idx: 6 },
    { day: 'Sunday', hours: 'Special Hours: 12:00 PM - 6:00 PM', idx: 0 },
  ]

  return (
    <>
      {/* Dynamic Operational Schedule & World Clock Section */}
      <section className="py-6 px-4 bg-gradient-to-r from-[#051B10] via-[#072d1d] to-[#051B10] border-b-2 border-[#EAA823]/40 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-4 relative z-10">
          
          {/* Top Info Header: 3D Calendar Badge with full weekday name, Location, and Single-Line Time & Status */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
            
            <div className="flex items-center gap-4 text-center md:text-left">
              {/* 3D Calendar-style Badge displaying full weekday */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 text-[#041a11] flex flex-col items-center justify-center font-black shadow-[0_8px_20px_rgba(234,168,35,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-3px_6px_rgba(0,0,0,0.3)] flex-shrink-0 border border-amber-200/50 transform hover:scale-105 transition-transform overflow-hidden">
                <div className="w-full bg-[#041a11]/20 py-0.5 text-[8px] uppercase tracking-wider font-extrabold text-[#041a11] text-center border-b border-amber-600/30">
                  Today
                </div>
                <div className="flex-1 flex items-center justify-center px-1">
                  <span className="text-xs font-black tracking-tighter text-center uppercase leading-tight">
                    {currentDayName || 'Tuesday'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 justify-center md:justify-start">
                  <MapPin className="w-4 h-4 text-[#EAA823]" />
                  <span>Woji, Port Harcourt, Rivers State</span>
                </h3>
                
                {/* Single line: Rotating clock icon + Time + Dim bright kitchen status */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                  <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-md border border-amber-400/20">
                    <Clock className="w-3.5 h-3.5 text-[#EAA823] animate-[spin_10s_linear_infinite]" />
                    <span className="font-mono text-xs font-bold text-[#EAA823]">
                      {currentTimeString || '00:00:00 AM'}
                    </span>
                  </div>

                  {kitchenStatus === 'breakfast' ? (
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wide animate-pulse drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]">
                      ⚡ BREAKFAST ACTIVE! (7:30am - 9:30am)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-300/80 tracking-wide drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]">
                      {statusMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action: Long Clickable Button for Schedule */}
            <div className="w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowScheduleCallout(!showScheduleCallout)}
                className="w-full md:w-auto bg-gradient-to-r from-emerald-800 to-[#072d1d] hover:from-amber-500 hover:to-amber-600 hover:text-[#041a11] text-amber-300 border border-amber-400/40 px-5 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>{showScheduleCallout ? 'Hide Operating Schedule' : 'View Full Operating Schedule'}</span>
                {showScheduleCallout ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* Closable Inline Schedule Callout */}
          {showScheduleCallout && (
            <div className="bg-[#041a11]/95 border-2 border-amber-400/50 p-4 sm:p-5 rounded-3xl shadow-2xl relative animate-in fade-in slide-in-from-top-2 duration-300">
              
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#EAA823]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Woji Kitchen Weekly Timings & Schedule
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScheduleCallout(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-amber-500 hover:text-[#041a11] text-amber-300 transition cursor-pointer"
                  title="Close Schedule Callout"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {weeklySchedule.map((sch) => {
                  const isToday = sch.idx === currentDayIndex
                  return (
                    <div
                      key={sch.day}
                      className={`p-3 rounded-2xl border transition-all ${
                        isToday
                          ? 'bg-amber-400 text-[#041a11] border-amber-300 shadow-md font-bold'
                          : 'bg-[#0a3a26]/60 text-gray-200 border-emerald-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-black uppercase ${isToday ? 'text-[#041a11]' : 'text-amber-400'}`}>
                          {sch.day}
                        </span>
                        {isToday && (
                          <span className="bg-[#041a11] text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                            Today
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-snug ${isToday ? 'text-[#041a11]' : 'text-gray-300'}`}>
                        {sch.hours}
                      </p>
                    </div>
                  )
                })}
              </div>

            </div>
          )}

        </div>
      </section>

      {/* Waitlist Modal */}
      {isModalOpen && !isLive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 text-[#0A2E1D] relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={handleCancelPrompt}
              className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-4 space-y-4">
                {showAppliedPrompt ? (
                  <div className="bg-[#072d1d] text-white p-5 rounded-3xl border-2 border-amber-400/60 shadow-xl space-y-3 text-left">
                    <h4 className="text-xs font-black uppercase text-amber-400">VIP Code Applied Successfully!</h4>
                    <p className="font-mono text-xl text-[#EAA823] font-bold">{generatedPromoCode}</p>
                    <Button onClick={handleCancelPrompt} className="w-full bg-[#EAA823] text-[#0A2E1D] font-bold">Return to Store</Button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <PartyPopper className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-[#0A2E1D]">You&apos;re on the VIP List!</h3>
                    <div className="bg-[#072d1d] text-[#EAA823] p-4 rounded-3xl space-y-2">
                      <p className="font-mono font-black text-2xl tracking-widest">{generatedPromoCode}</p>
                      <button onClick={handleCopyCode} className="flex items-center justify-center gap-1 mx-auto bg-white/10 px-3 py-1.5 rounded-xl text-xs text-white">
                        {copiedCode ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>Copy Code</span>
                      </button>
                    </div>
                    <Button onClick={handleCancelPrompt} className="bg-[#0A2E1D] text-white rounded-full px-8 py-4">Close</Button>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-black">Join Priority Waitlist (Woji, Port Harcourt)</h3>
                <Input
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  type="tel"
                  required
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <div className="grid grid-cols-3 gap-2">
                  {MENU_CATALOG.map((item) => {
                    const isSelected = selectedItems.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-2 rounded-xl border text-center text-xs font-bold ${
                          isSelected ? 'bg-[#072d1d] text-[#EAA823]' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {item.icon} {item.label}
                      </button>
                    )
                  })}
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-[#0A2E1D] text-white py-4 rounded-xl">
                  {submitting ? <Loader2 className="animate-spin" /> : 'Claim 15% VIP Pass'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}