'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  X, Sparkles, Gift, Flame, Copy, Check, ChevronRight, Clock, ShieldCheck,
  Info, CheckCircle2, ArrowUpRight, Lock, Loader2, AlertCircle, ExternalLink, Utensils, ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'

export interface EventActivity {
  id: string
  title: string
  description?: string
  platform: 'instagram' | 'tiktok' | 'whatsapp' | 'facebook' | 'youtube' | 'website' | 'other'
  action_url: string
  verification_seconds: number
}

export interface EventAddon {
  id: string
  name: string
  price: number
  image_url: string
}

export interface EventAddonGroup {
  id: string
  title: string
  max_selections: number
  addons: EventAddon[]
}

export interface EventSpecialItem {
  id: string
  name: string
  price: number
  discount_percentage: number
  description: string
  image_url: string
  addon_groups: EventAddonGroup[]
}

interface StoreEvent {
  id: string
  title: string
  subtitle: string
  event_type: 'promotion' | 'announcement' | 'giveaway' | 'flash_sale'
  discount_code?: string
  discount_percentage?: string
  banner_image_url?: string
  cta_text: string
  cta_url: string
  celebration_effect: 'flower_drop' | 'confetti' | 'gold_sparkles' | 'none'
  is_active: boolean
  auto_close_seconds: number
  trigger_mode: 'first_visit' | 'every_refresh'
  required_activities?: EventActivity[]
  special_items?: EventSpecialItem[]
}

function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl) return 'https://tiktok.com/@deechoi01'
  let clean = rawUrl.trim()
  if (clean.startsWith('@')) {
    return `https://tiktok.com/${clean}`
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`
  }
  return clean
}

export function EventPromoModal() {
  const [event, setEvent] = useState<StoreEvent | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Verification states
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({})
  const [userHandles, setUserHandles] = useState<Record<string, string>>({})
  const [activeVerifyingAct, setActiveVerifyingAct] = useState<EventActivity | null>(null)
  const [outsideSeconds, setOutsideSeconds] = useState(0)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [verifyingLoader, setVerifyingLoader] = useState(false)

  // Add-on selection state: { [itemId]: { [groupId]: [addonId1, addonId2] } }
  const [addonSelections, setAddonSelections] = useState<Record<string, Record<string, string[]>>>({})

  const activeActRef = useRef<EventActivity | null>(null)
  const outsideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const { addItem } = useCart()

  useEffect(() => {
    fetchActiveEvent()
  }, [])

  // Window Focus & Blur Tracking
  useEffect(() => {
    activeActRef.current = activeVerifyingAct

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (activeActRef.current) {
          outsideTimerRef.current = setInterval(() => {
            setOutsideSeconds(prev => prev + 1)
          }, 1000)
        }
      } else {
        if (outsideTimerRef.current) {
          clearInterval(outsideTimerRef.current)
          outsideTimerRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (outsideTimerRef.current) clearInterval(outsideTimerRef.current)
    }
  }, [activeVerifyingAct])

  // Canvas Animation Engine for Celebration Effects
  useEffect(() => {
    if (!isOpen || !event || !event.celebration_effect || event.celebration_effect === 'none') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    interface Particle {
      x: number
      y: number
      size: number
      speedY: number
      speedX: number
      angle: number
      spin: number
      color: string
      opacity: number
      petalCount?: number
    }

    const particles: Particle[] = []
    const particleCount = event.celebration_effect === 'gold_sparkles' ? 80 : 50

    const colors = event.celebration_effect === 'flower_drop'
      ? ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#FF9AA2', '#E15554', '#EAA823']
      : event.celebration_effect === 'gold_sparkles'
      ? ['#EAA823', '#FFD700', '#FFF8DC', '#DAA520', '#FFFFFF']
      : ['#FF5733', '#33FF57', '#3357FF', '#F33FF5', '#33FFF5', '#EAA823']

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: Math.random() * 8 + 6,
        speedY: Math.random() * 2 + 1,
        speedX: Math.random() * 1.5 - 0.75,
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.7 + 0.3,
        petalCount: Math.floor(Math.random() * 2) + 5
      })
    }

    const drawFlower = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity

      const petals = p.petalCount || 5
      const petalLength = p.size
      const petalWidth = p.size / 2

      for (let i = 0; i < petals; i++) {
        ctx.beginPath()
        ctx.rotate((Math.PI * 2) / petals)
        ctx.ellipse(0, petalLength / 2, petalWidth / 2, petalLength / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
      ctx.fillStyle = '#FFF8DC'
      ctx.fill()
      ctx.restore()
    }

    const drawSparkle = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      
      ctx.beginPath()
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = p.color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-p.size, 0)
      ctx.lineTo(p.size, 0)
      ctx.moveTo(0, -p.size)
      ctx.lineTo(0, p.size)
      ctx.stroke()
      ctx.restore()
    }

    const drawConfetti = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach(p => {
        p.y += p.speedY
        p.x += Math.sin(p.y * 0.01) + p.speedX
        p.angle += p.spin

        if (p.y > height + 20) {
          p.y = -20
          p.x = Math.random() * width
        }

        if (event.celebration_effect === 'flower_drop') {
          drawFlower(p)
        } else if (event.celebration_effect === 'gold_sparkles') {
          drawSparkle(p)
        } else {
          drawConfetti(p)
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, event])

  const fetchActiveEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('store_events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) return

      if (typeof window !== 'undefined') {
        if (data.trigger_mode === 'first_visit') {
          const hasSeen = sessionStorage.getItem(`seen_event_${data.id}`)
          if (hasSeen) return
          sessionStorage.setItem(`seen_event_${data.id}`, 'true')
        }
      }

      const storedTasksKey = `tasks_completed_${data.id}`
      const savedTasks = typeof window !== 'undefined' ? localStorage.getItem(storedTasksKey) : null
      if (savedTasks) {
        try {
          setCompletedActivities(JSON.parse(savedTasks))
        } catch {}
      }

      setEvent(data)
      setIsOpen(true)
    } catch (err) {
      console.warn('Promo modal fetch note:', err)
    }
  }

  const handleLaunchActivity = (act: EventActivity) => {
    setWarningMessage(null)
    setOutsideSeconds(0)
    setActiveVerifyingAct(act)

    const validUrl = sanitizeUrl(act.action_url)
    if (typeof window !== 'undefined') {
      window.open(validUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleVerifyFollow = (act: EventActivity) => {
    setWarningMessage(null)
    const requiredSecs = act.verification_seconds || 4
    const handleInput = (userHandles[act.id] || '').trim()

    if (outsideSeconds < requiredSecs) {
      setWarningMessage(
        `Please open our ${act.platform.toUpperCase()} page, tap "Follow", and return here to complete verification (${requiredSecs - outsideSeconds}s remaining).`
      )
      return
    }

    if (!handleInput) {
      setWarningMessage(`Please enter your ${act.platform.toUpperCase()} username/handle so we can verify your account.`)
      return
    }

    setVerifyingLoader(true)

    setTimeout(() => {
      setVerifyingLoader(false)
      setActiveVerifyingAct(null)
      setOutsideSeconds(0)

      const updated = { ...completedActivities, [act.id]: true }
      setCompletedActivities(updated)

      if (event && typeof window !== 'undefined') {
        localStorage.setItem(`tasks_completed_${event.id}`, JSON.stringify(updated))
        localStorage.setItem(`user_handle_${act.platform}`, handleInput)
      }
    }, 1200)
  }

  const allActivitiesCompleted = () => {
    if (!event?.required_activities || event.required_activities.length === 0) return true
    return event.required_activities.every(a => !!completedActivities[a.id])
  }

  const isUnlocked = allActivitiesCompleted()

  // Handle Addon Selection toggle with max_selections enforcement
  const handleAddonToggle = (itemId: string, groupId: string, addonId: string, maxSelections: number) => {
    setAddonSelections(prev => {
      const itemSels = prev[itemId] || {}
      const groupSels = itemSels[groupId] || []

      if (groupSels.includes(addonId)) {
        // Deselect
        return {
          ...prev,
          [itemId]: { ...itemSels, [groupId]: groupSels.filter(id => id !== addonId) }
        }
      } else {
        // Select
        if (maxSelections === 1) {
          // Radio behavior (replace selection)
          return {
            ...prev,
            [itemId]: { ...itemSels, [groupId]: [addonId] }
          }
        } else {
          // Checkbox behavior (enforce max_selections limit)
          if (groupSels.length >= maxSelections) {
            setWarningMessage(`You can only select up to ${maxSelections} option(s) for this group.`)
            setTimeout(() => setWarningMessage(null), 3000)
            return prev
          }
          return {
            ...prev,
            [itemId]: { ...itemSels, [groupId]: [...groupSels, addonId] }
          }
        }
      }
    })
  }

  // Direct Shoppable Item & Add-ons Add To Cart Handler
  const handleAddToCart = (item: EventSpecialItem) => {
    if (!isUnlocked) {
      setWarningMessage('Please complete the required tasks above to unlock this exclusive package.')
      return
    }

    // 1. Calculate Discounted Price
    const discountPct = item.discount_percentage || 0
    const finalBasePrice = discountPct > 0 ? item.price * (1 - (discountPct / 100)) : item.price

    // 2. Add Main Package Item
    addItem({
      product_id: item.id,
      name: item.name,
      price: finalBasePrice,
      quantity: 1,
      imageUrl: item.image_url || '/placeholder.png',
      selected_options: [],
      prep_time: undefined,
      cooking_time: undefined,
      fulfillment_time: undefined,
      id: undefined,
      product_name: '',
      unit_price: 0,
      final_price: 0
    })

    // 3. Add Selected Add-ons as independent cart items with [Add-on] prefix
    const itemSels = addonSelections[item.id] || {}
    Object.entries(itemSels).forEach(([groupId, addonIds]) => {
      const group = item.addon_groups?.find(g => g.id === groupId)
      if (group) {
        addonIds.forEach(aId => {
          const addon = group.addons.find(a => a.id === aId)
          if (addon) {
            addItem({
              product_id: addon.id,
              name: `[Add-on] ${addon.name}`,
              price: addon.price,
              quantity: 1,
              imageUrl: addon.image_url || '/placeholder.png',
              selected_options: [{
                groupName: 'Included With', optionName: item.name,
                priceModifier: 0
              }],
              prep_time: undefined,
              cooking_time: undefined,
              fulfillment_time: undefined,
              id: undefined,
              product_name: '',
              unit_price: 0,
              final_price: 0
            })
          }
        })
      }
    })

    setIsOpen(false)
    router.push('/cart')
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Dynamic Celebration Effects Layer */}
      {event.celebration_effect && event.celebration_effect !== 'none' && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-10 w-full h-full"
        />
      )}

      {/* Main Card */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#072d1d] to-[#041a11] text-white rounded-3xl overflow-hidden shadow-[0_10px_50px_rgba(234,168,35,0.35)] border-2 border-[#EAA823] z-20 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3.5 right-3.5 z-30 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition cursor-pointer shadow-md"
          aria-label="Close promotion"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto p-5 sm:p-7 space-y-4 no-scrollbar">
          
          {/* Header Icon */}
          <div className="text-center space-y-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#EAA823] to-[#ffd768] text-[#072d1d] flex items-center justify-center shadow-lg animate-bounce-slow">
                {event.event_type === 'giveaway' ? <Gift className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
              </div>
              {event.discount_percentage && (
                <span className="absolute -bottom-1 -right-2 bg-red-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full border border-white shadow-md uppercase tracking-wider">
                  {event.discount_percentage}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-tight">
              {event.title}
            </h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              {event.subtitle}
            </p>
          </div>

          {/* CAMPAIGN BANNER IMAGE */}
          {event.banner_image_url && (
            <div className="relative w-full overflow-hidden rounded-2xl border border-[#EAA823]/40 bg-black/30 shadow-lg">
              <img
                src={event.banner_image_url}
                alt={event.title || 'Campaign image'}
                className="w-full h-auto max-h-[320px] object-cover rounded-2xl"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Validation Warning Alert */}
          {warningMessage && (
            <div className="p-3 bg-amber-950/80 border border-amber-400/60 rounded-xl text-amber-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* INTERACTIVE SOCIAL TASK VERIFICATION CHECKLIST */}
          {Array.isArray(event.required_activities) && event.required_activities.length > 0 && (
            <div className="bg-[#041a11] p-4 rounded-2xl border border-emerald-600/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#EAA823]" />
                  Follow To Unlock ({Object.values(completedActivities).filter(Boolean).length} / {event.required_activities.length} Complete):
                </span>
              </div>

              <div className="space-y-3">
                {event.required_activities.map((act) => {
                  const isDone = !!completedActivities[act.id]
                  const isCurrentlyTarget = activeVerifyingAct?.id === act.id

                  return (
                    <div
                      key={act.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isDone ? 'bg-emerald-950/40 border-emerald-500/50' : isCurrentlyTarget ? 'bg-[#0a3a26] border-[#EAA823]/70 shadow-md' : 'bg-[#072d1d] border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block">{act.title}</span>
                          {act.description && <p className="text-[10px] text-gray-400 line-clamp-1">{act.description}</p>}
                        </div>

                        {isDone ? (
                          <span className="bg-emerald-500 text-[#072d1d] font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /><span>Verified</span>
                          </span>
                        ) : !isCurrentlyTarget ? (
                          <button
                            type="button"
                            onClick={() => handleLaunchActivity(act)}
                            className="bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition active:scale-95 cursor-pointer flex-shrink-0"
                          >
                            <span>Follow</span><ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>

                      {isCurrentlyTarget && !isDone && (
                        <div className="pt-2 border-t border-white/10 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-[10px] text-emerald-200">
                            <span>Time on {act.platform.toUpperCase()}: <b>{outsideSeconds}s / {act.verification_seconds || 4}s</b></span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">@</span>
                              <input
                                type="text"
                                placeholder={`Your ${act.platform} username...`}
                                value={userHandles[act.id] || ''}
                                onChange={(e) => setUserHandles({ ...userHandles, [act.id]: e.target.value.replace(/^@/, '') })}
                                className="w-full bg-black/40 border border-white/20 text-white text-xs pl-6 pr-2 py-2 rounded-lg outline-none focus:border-[#EAA823]"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleVerifyFollow(act)}
                              disabled={verifyingLoader}
                              className="bg-emerald-500 hover:bg-emerald-400 text-[#072d1d] font-black text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                            >
                              {verifyingLoader ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />} Confirm Follow
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SHOPPABLE EVENT ITEMS & ADD-ONS */}
          {Array.isArray(event.special_items) && event.special_items.length > 0 && (
            <div className="space-y-4 mt-4">
              <h3 className="text-sm font-black text-[#EAA823] flex items-center gap-1.5 border-b border-white/10 pb-2">
                <Utensils className="w-4 h-4" /> Exclusive Packages &amp; Add-ons
              </h3>

              <div className="space-y-4">
                {event.special_items.map((item) => {
                  const hasDiscount = item.discount_percentage && item.discount_percentage > 0
                  const finalPrice = hasDiscount ? item.price * (1 - (item.discount_percentage / 100)) : item.price

                  return (
                    <div 
                      key={item.id} 
                      className={`bg-[#0a3a26] border rounded-2xl p-4 flex flex-col gap-3.5 transition ${
                        isUnlocked ? 'border-[#EAA823]/60 shadow-md' : 'border-white/10 opacity-75 grayscale-25'
                      }`}
                    >
                      {/* Main Package Card */}
                      <div className="flex gap-3.5">
                        <div className="relative w-20 h-20 bg-black/40 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">DE-ECHOI</div>}
                          {hasDiscount && <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl">-{item.discount_percentage}%</span>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-white truncate">{item.name}</h4>
                          <p className="text-[10px] text-emerald-100/70 line-clamp-1">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-black text-amber-300 text-sm">₦{finalPrice.toLocaleString()}</span>
                            {hasDiscount && <span className="text-[10px] text-gray-400 line-through">₦{item.price.toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Add-on Groups Selection UI */}
                      {Array.isArray(item.addon_groups) && item.addon_groups.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-emerald-900/50">
                          {item.addon_groups.map((group) => {
                            const groupSelections = addonSelections[item.id]?.[group.id] || []

                            return (
                              <div key={group.id} className="space-y-1.5">
                                <div className="flex justify-between items-baseline text-[11px]">
                                  <span className="font-bold text-emerald-200">{group.title}</span>
                                  <span className="text-[9px] bg-black/40 text-amber-300 px-2 py-0.5 rounded-md">
                                    Choose up to {group.max_selections}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  {group.addons.map((addon) => {
                                    const isSelected = groupSelections.includes(addon.id)

                                    return (
                                      <div
                                        key={addon.id}
                                        onClick={() => handleAddonToggle(item.id, group.id, addon.id, group.max_selections)}
                                        className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer border transition ${
                                          isSelected ? 'bg-emerald-500/20 border-emerald-400 shadow-sm' : 'bg-black/30 border-white/5 hover:border-emerald-500/30'
                                        }`}
                                      >
                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black/50">
                                          {addon.image_url ? <img src={addon.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">IMG</div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-[10px] font-bold text-white truncate">{addon.name}</div>
                                          <div className={`text-[9px] font-black ${addon.price === 0 ? 'text-amber-400' : 'text-gray-300'}`}>
                                            {addon.price === 0 ? 'FREE' : `+₦${addon.price}`}
                                          </div>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Add to Cart CTA */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-md ${
                          isUnlocked ? 'bg-gradient-to-r from-[#EAA823] to-[#f5d547] hover:from-white hover:to-white text-[#072d1d]' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isUnlocked ? (
                          <><ShoppingCart className="w-4 h-4" /><span>Add Package &amp; Add-ons to Cart</span></>
                        ) : (
                          <><Lock className="w-4 h-4" /><span>Complete Tasks Above to Unlock</span></>
                        )}
                      </button>

                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bottom Action CTA */}
          <div className="pt-1">
            <Link href={event.cta_url || '/#our-menu-section'} onClick={() => setIsOpen(false)} className="w-full block">
              <button type="button" className="w-full bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#072d1d] font-black text-sm py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer">
                <span>{event.cta_text || 'Browse Food Menu'}</span><ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default EventPromoModal