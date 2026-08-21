'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  X, Sparkles, Gift, Flame, Copy, Check, ChevronRight, Clock, ShieldCheck,
  Info, CheckCircle2, ArrowUpRight, Lock, Loader2, AlertCircle, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export interface EventActivity {
  id: string
  title: string
  description?: string
  platform: 'instagram' | 'tiktok' | 'whatsapp' | 'facebook' | 'youtube' | 'website' | 'other'
  action_url: string
  verification_seconds: number
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

function generateUniqueVoucherCode(baseCode?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let randomSuffix = ''
  for (let i = 0; i < 5; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const prefix = (baseCode || 'DEECHOI').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return `${prefix}-${randomSuffix}`
}

export function EventPromoModal() {
  const [event, setEvent] = useState<StoreEvent | null>(null)
  const [uniqueCode, setUniqueCode] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasAccount, setHasAccount] = useState(false)
  
  // Verification states
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({})
  const [userHandles, setUserHandles] = useState<Record<string, string>>({})
  const [activeVerifyingAct, setActiveVerifyingAct] = useState<EventActivity | null>(null)
  const [outsideSeconds, setOutsideSeconds] = useState(0)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [verifyingLoader, setVerifyingLoader] = useState(false)

  const activeActRef = useRef<EventActivity | null>(null)
  const outsideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchActiveEvent()
    checkCustomerAccountStatus()
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

  const checkCustomerAccountStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setHasAccount(true)
        return
      }

      const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('deechoi_customer_email') : null
      if (storedEmail) {
        const { data } = await supabase
          .from('store_orders')
          .select('id')
          .eq('customer_email', storedEmail)
          .limit(1)
          .maybeSingle()

        if (data) setHasAccount(true)
      }
    } catch (e) {
      console.warn('Account check note:', e)
    }
  }

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

      // CHECK 1: If user already claimed this voucher, NEVER SHOW IT AGAIN
      if (typeof window !== 'undefined') {
        const isClaimed = localStorage.getItem(`voucher_claimed_${data.id}`)
        if (isClaimed === 'true') {
          return // Suppress modal completely
        }

        if (data.trigger_mode === 'first_visit') {
          const hasSeen = sessionStorage.getItem(`seen_event_${data.id}`)
          if (hasSeen) return
        }
      }

      const storageKey = `unique_promo_${data.id}`
      let userCode = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null

      if (!userCode) {
        userCode = generateUniqueVoucherCode(data.discount_code || 'VIP15')
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, userCode)
        }

        const numericDiscount = parseFloat(data.discount_percentage?.replace(/[^0-9.]/g, '') || '15') || 15
        const customerEmail = typeof window !== 'undefined' ? localStorage.getItem('deechoi_customer_email') : null

        supabase
          .from('store_event_claims')
          .insert([
            {
              event_id: data.id,
              customer_email: customerEmail,
              promo_code: userCode,
              discount_percentage: numericDiscount,
              status: 'active'
            }
          ])
          .then(({ error: claimErr }) => {
            if (claimErr) console.warn('[Claim Log Notice]:', claimErr.message)
          })
      }

      const storedTasksKey = `tasks_completed_${data.id}`
      const savedTasks = typeof window !== 'undefined' ? localStorage.getItem(storedTasksKey) : null
      if (savedTasks) {
        try {
          setCompletedActivities(JSON.parse(savedTasks))
        } catch {}
      }

      setUniqueCode(userCode)
      setEvent(data)
      setIsOpen(true)

      if (data.trigger_mode === 'first_visit' && typeof window !== 'undefined') {
        sessionStorage.setItem(`seen_event_${data.id}`, 'true')
      }
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

  // Mark voucher permanently as claimed so it does not pop up on subsequent refreshes
  const markVoucherClaimedPermanently = () => {
    if (!event) return
    if (typeof window !== 'undefined') {
      localStorage.setItem(`voucher_claimed_${event.id}`, 'true')
      sessionStorage.setItem(`seen_event_${event.id}`, 'true')
      window.dispatchEvent(new Event('deechoi_voucher_claimed'))
    }
  }

  // Celebratory particles
  useEffect(() => {
    if (!isOpen || !event || !isUnlocked || event.celebration_effect === 'none') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      size: number
      speedY: number
      speedX: number
      rotation: number
      rotationSpeed: number
      color: string
      shape: 'petal' | 'confetti'
    }> = []

    const colors = event.celebration_effect === 'flower_drop' 
      ? ['#FFB7B2', '#FF9AA2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#FF69B4', '#FFA07A']
      : event.celebration_effect === 'gold_sparkles'
      ? ['#EAA823', '#F5D547', '#FFF3B0', '#D4AF37', '#FFFFFF']
      : ['#EAA823', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B']

    for (let i = 0; i < 65; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: Math.random() * 8 + 6,
        speedY: Math.random() * 2.5 + 1.2,
        speedX: Math.random() * 1.5 - 0.75,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: event.celebration_effect === 'flower_drop' ? 'petal' : 'confetti',
      })
    }

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.y += p.speedY
        p.x += p.speedX
        p.rotation += p.rotationSpeed
        if (p.y > canvas.height) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'petal') {
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size, p.size / 2, Math.PI / 4, 0, 2 * Math.PI)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2)
        }
        ctx.restore()
      })
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, event, isUnlocked])

  const copyCode = async (code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(code)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = code
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
        } catch {}
        document.body.removeChild(textArea)
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('active_checkout_voucher', code)
      }
      setCopied(true)
      markVoucherClaimedPermanently()
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      {event.celebration_effect !== 'none' && isUnlocked && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        />
      )}

      {/* Main Card */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#072d1d] to-[#041a11] text-white rounded-3xl overflow-hidden shadow-[0_10px_50px_rgba(234,168,35,0.35)] border-2 border-[#EAA823] z-20 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={() => {
            if (isUnlocked) markVoucherClaimedPermanently()
            setIsOpen(false)
          }}
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
                {event.event_type === 'giveaway' ? (
                  <Gift className="w-7 h-7" />
                ) : (
                  <Sparkles className="w-7 h-7" />
                )}
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
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/50'
                          : isCurrentlyTarget
                          ? 'bg-[#0a3a26] border-[#EAA823]/70 shadow-md'
                          : 'bg-[#072d1d] border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block">
                            {act.title}
                          </span>
                          {act.description && (
                            <p className="text-[10px] text-gray-400 line-clamp-1">
                              {act.description}
                            </p>
                          )}
                        </div>

                        {isDone ? (
                          <span className="bg-emerald-500 text-[#072d1d] font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Verified</span>
                          </span>
                        ) : !isCurrentlyTarget ? (
                          <button
                            type="button"
                            onClick={() => handleLaunchActivity(act)}
                            className="bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition active:scale-95 cursor-pointer flex-shrink-0"
                          >
                            <span>Follow</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>

                      {/* Active Verification Confirmation Box */}
                      {isCurrentlyTarget && !isDone && (
                        <div className="pt-2 border-t border-white/10 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-[10px] text-emerald-200">
                            <span>Time on {act.platform.toUpperCase()}: <b>{outsideSeconds}s / {act.verification_seconds || 4}s</b></span>
                            <button
                              type="button"
                              onClick={() => handleLaunchActivity(act)}
                              className="text-[#EAA823] hover:underline flex items-center gap-0.5"
                            >
                              <span>Reopen App</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
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
                              {verifyingLoader ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Checking...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Confirm Follow</span>
                                </>
                              )}
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

          {/* VOUCHER UNLOCK CARD */}
          {uniqueCode && (
            <div className="bg-[#0A3A26] border-2 border-dashed border-[#EAA823] rounded-2xl p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#EAA823]" />
                  Your Unique Discount Voucher
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isUnlocked ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {isUnlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}
                </span>
              </div>

              {isUnlocked ? (
                <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2 border border-white/10 animate-in zoom-in-95">
                  <span className="font-mono font-black text-base sm:text-lg text-[#EAA823] tracking-wider truncate mr-2">
                    {uniqueCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(uniqueCode)}
                    className="flex items-center gap-1 bg-[#EAA823] hover:bg-white text-[#072d1d] text-xs font-black px-3.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer shadow-sm flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-black/30 rounded-xl border border-white/10 text-center space-y-1">
                  <Lock className="w-4 h-4 text-amber-400 mx-auto" />
                  <p className="text-[11px] text-amber-200 font-semibold">
                    Follow on social media above to unlock your unique discount voucher!
                  </p>
                </div>
              )}

              <div className="pt-1 text-left bg-black/20 rounded-xl p-2.5 border border-white/5 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-100/90 leading-tight">
                  {hasAccount ? (
                    <>Your code is stored in your device &amp; account. Apply it directly at checkout or manage it in your <Link href="/account/vouchers" className="underline font-bold">Voucher Wallet</Link>.</>
                  ) : (
                    <>Apply this code at checkout. Your customer account will be generated automatically once your first order is placed.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-1">
            <Link 
              href={event.cta_url || '/#our-menu-section'} 
              onClick={() => {
                if (isUnlocked && uniqueCode && typeof window !== 'undefined') {
                  localStorage.setItem('active_checkout_voucher', uniqueCode)
                  markVoucherClaimedPermanently()
                }
                setIsOpen(false)
              }}
              className="w-full block"
            >
              <button
                type="button"
                className="w-full bg-gradient-to-r from-[#EAA823] to-[#f5d547] hover:from-white hover:to-white text-[#072d1d] font-black text-sm py-3.5 rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isUnlocked ? (event.cta_text || 'Claim Offer & Shop Menu') : 'Browse Food Menu'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default EventPromoModal