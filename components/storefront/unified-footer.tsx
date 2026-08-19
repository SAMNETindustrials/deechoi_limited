'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home,
  Search, 
  Plus, 
  MessageCircle, 
  ShoppingBag, 
  Mail, 
  Phone, 
  Facebook, 
  Instagram, 
  Youtube, 
  Send, 
  Sparkles,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UnifiedFooter() {
  const pathname = usePathname()
  const router = useRouter()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)

  // Scroll listener strictly requiring actual scroll down to the bottom
  useEffect(() => {
    // Reset to hidden on any route change or initial render
    setIsScrolledToBottom(false)

    const handleScroll = () => {
      if (typeof window === 'undefined') return

      const scrollY = window.scrollY || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      // Must have scrolled significantly from top (at least 150px) AND reached within 50px of bottom
      const isAtVeryBottom = scrollY > 150 && windowHeight + scrollY >= docHeight - 50

      if (isAtVeryBottom) {
        setIsScrolledToBottom(true)
      } else {
        setIsScrolledToBottom(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  // Do not display on admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const isHomeActive = pathname === '/'
  const isMenuActive = pathname.startsWith('/menu') || pathname.includes('search')
  const isAcademyActive = pathname.startsWith('/training') || pathname.startsWith('/services')
  const isInboxActive = pathname.startsWith('/my-messages')
  const isCartActive = pathname.startsWith('/cart')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setSubscribed(true)
    setNewsletterEmail('')
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP ONLY FOOTER (Active links + Coming Soon Academy Banner)        */}
      {/* ========================================================================= */}
      <footer className="hidden md:block bg-[#051a11] text-white pt-14 pb-10 border-t border-[#EAA823]/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Desktop Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Tagline & Statement */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-xl bg-white p-1 shadow-md">
                  <Image src="/logo.png" alt="De-echoi Logo" fill className="object-contain p-0.5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white leading-tight">DE-ECHOI LIMITED</h3>
                  <span className="text-[10px] font-extrabold text-[#EAA823] tracking-widest uppercase">
                    Fresh Kitchen &bull; Cakes &bull; Culinary Academy
                  </span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                Sip, Savor & Celebrate — <br />
                <span className="text-[#EAA823]">One Delicious Taste</span> At A Time.
              </h2>
              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                Authentic Nigerian meals, spiced shawarma rolls, bespoke celebration cakes, and culinary training delivered fast across Port Harcourt.
              </p>

              {/* Academy "Coming Soon" Banner Preview */}
              <Link 
                href="/training"
                className="group mt-2 p-3.5 bg-gradient-to-r from-[#072d1d] to-[#0a3a26] border border-[#EAA823]/40 rounded-2xl flex items-center justify-between transition hover:border-[#EAA823] hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EAA823] text-[#072d1d] rounded-xl font-bold shadow-md">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#EAA823] transition-colors">
                        De-echoi Culinary Academy
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-[#EAA823] text-[#072d1d] animate-pulse">
                        COMING SOON
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-300">
                      Professional baking, cake artistry &amp; chef diplomas.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#EAA823] group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            </div>

            {/* Newsletter Subscription Box */}
            <div className="lg:col-span-7 bg-[#072d1d] p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-white">Get In Touch &amp; VIP Updates</h4>
                  <p className="text-xs text-gray-300">Subscribe for early launch notifications &amp; secret discount codes.</p>
                </div>
                <span className="p-2 bg-amber-500/20 text-[#EAA823] rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
              </div>

              {subscribed ? (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center">
                  🎉 Thank you for subscribing! Your 15% VIP launch code is on its way.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 bg-[#041a11] border border-white/15 focus:border-[#EAA823] text-white text-xs px-4 py-3.5 rounded-2xl outline-none transition"
                  />
                  <Button
                    type="submit"
                    className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-black text-xs px-7 py-3.5 rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[10px] text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#EAA823]" />
                  <span>Fast Woji Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#EAA823]" />
                  <span>Fresh Daily Prep</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#EAA823]" />
                  <span>100% Hygienic</span>
                </div>
              </div>
            </div>

          </div>

          {/* Links & Information Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/10 text-xs text-gray-300">
            
            {/* Contact Details */}
            <div className="space-y-3">
              <h5 className="font-black text-white text-xs uppercase tracking-wider text-[#EAA823]">Contact Info</h5>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#EAA823] flex-shrink-0" />
                  <a href="mailto:deechoion@gmail.com" className="hover:text-white transition">deechoion@gmail.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#EAA823] flex-shrink-0" />
                  <a href="tel:+2347046145982" className="hover:text-white transition">+234 704 614 5982</a>
                </li>
                <li className="text-gray-400 pt-1 leading-relaxed">
                  Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State.
                </li>
              </ul>
            </div>

            {/* Quick Links (Active) */}
            <div className="space-y-3">
              <h5 className="font-black text-white text-xs uppercase tracking-wider text-[#EAA823]">Explore Menu</h5>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/?search=shawarma" className="hover:text-white transition">Jumbo Shawarma</Link></li>
                <li><Link href="/?search=pepper%20soup" className="hover:text-white transition">Catfish Pepper Soup</Link></li>
                <li><Link href="/cakes" className="hover:text-white transition">Celebration Cakes</Link></li>
                <li><Link href="/?search=parfait" className="hover:text-white transition">Parfait &amp; Cakeloaf</Link></li>
                <li>
                  <Link href="/training" className="hover:text-white transition inline-flex items-center gap-1.5 group">
                    <span className="group-hover:text-[#EAA823] transition-colors">Culinary Academy</span>
                    <span className="bg-[#EAA823] text-[#072d1d] text-[8px] font-black px-1.5 py-0.2 rounded-full">
                      SOON
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Care (Active) */}
            <div className="space-y-3">
              <h5 className="font-black text-white text-xs uppercase tracking-wider text-[#EAA823]">Customer Care</h5>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/my-orders" className="hover:text-white transition">Track Your Order</Link></li>
                <li><Link href="/my-messages" className="hover:text-white transition">Live Support Chat</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact &amp; Enquiries</Link></li>
                <li><Link href="/services" className="hover:text-white transition">Event Catering Booking</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Terms &amp; Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Social Channels */}
            <div className="space-y-3">
              <h5 className="font-black text-white text-xs uppercase tracking-wider text-[#EAA823]">Follow Our Kitchen</h5>
              <p className="text-[11px] text-gray-400">Join our community on social media for daily recipe updates &amp; giveaways.</p>
              <div className="flex items-center gap-3 pt-1">
                <a 
                  href="https://facebook.com/deechoiltd" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-white/10 rounded-xl hover:bg-[#EAA823] hover:text-[#0A2E1D] transition cursor-pointer" 
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://instagram.com/deechoi01" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-white/10 rounded-xl hover:bg-[#EAA823] hover:text-[#0A2E1D] transition cursor-pointer" 
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-white/10 rounded-xl hover:bg-[#EAA823] hover:text-[#0A2E1D] transition cursor-pointer" 
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & SAMNET Attribution */}
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p>&copy; 2026 De-echoi Limited&reg;. All Rights Reserved.</p>

            <div className="flex items-center gap-2 bg-[#041a11] px-3.5 py-1.5 rounded-xl border border-white/10 shadow-inner">
              <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                <Image
                  src="/samnetLogo.png"
                  alt="SAMNET Industrials Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-[11px] text-gray-300 font-medium">
                Developed &amp; managed by{' '}
                <strong className="text-[#EAA823] font-bold">
                  SAMNET Industrials Ltd
                </strong>
              </span>
            </div>

            <div className="flex gap-4 text-[11px]">
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms &amp; Conditions</Link>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 2. MOBILE FLUSH FOOTER DOCK (Reveals at End of Page)                      */}
      {/* ========================================================================= */}
      <div 
        className={`block md:hidden fixed bottom-0 inset-x-0 z-50 transition-all duration-300 ease-out ${
          isScrolledToBottom 
            ? 'translate-y-0 opacity-100 pointer-events-auto' 
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <nav 
          aria-label="Mobile Bottom Navigation"
          className="w-full bg-gradient-to-b from-[#072d1d] via-[#051a11] to-[#03110b] border-t border-[#EAA823]/30 shadow-[0_-10px_35px_rgba(0,0,0,0.9)] px-3 pt-2.5 relative"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Top Row Container */}
          <div className="relative max-w-md mx-auto flex items-center justify-between h-[54px]">
            
            {/* Non-overlapping Contour Yellow Stroke */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-0" 
              viewBox="0 0 360 54" 
              fill="none" 
              preserveAspectRatio="none"
            >
              <path 
                d="M 44 48 C 54 48, 56 4, 82 4 C 104 4, 110 48, 126 48 L 356 48" 
                stroke="#EAA823" 
                strokeWidth="1.75" 
                strokeLinecap="round"
                className="opacity-95 drop-shadow-[0_0_6px_rgba(234,168,35,0.8)]"
              />
            </svg>

            {/* Leftmost Elevated Brand Circle */}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="relative z-10 w-[42px] h-[42px] rounded-full bg-gradient-to-b from-[#0a3a26] to-[#041a11] shadow-[0_4px_10px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#EAA823]/40 flex items-center justify-center cursor-pointer transition active:scale-90 flex-shrink-0"
              aria-label="De-echoi Brand Icon"
            >
              <div className="relative w-5 h-5 rounded-full overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="De-echoi"
                  fill
                  className="object-contain"
                />
              </div>
            </button>

            {/* Navigation Icons Group */}
            <div className="relative z-10 flex-1 flex items-center justify-around pl-1">
              
              {/* Item 1: Home */}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex flex-col items-center justify-center group cursor-pointer focus:outline-none transition active:scale-90 w-11 pt-1"
                aria-label="Home"
              >
                <Home 
                  className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isHomeActive ? 'text-[#EAA823] drop-shadow-[0_0_8px_rgba(234,168,35,0.6)]' : 'text-emerald-100/60 group-hover:text-white'
                  }`} 
                  strokeWidth={2.2}
                />
                <span 
                  className={`w-1 h-1 rounded-full mt-0.5 transition-all ${
                    isHomeActive ? 'bg-[#EAA823] shadow-[0_0_6px_#EAA823]' : 'opacity-0'
                  }`} 
                />
                <span className={`text-[8px] font-bold tracking-tight ${isHomeActive ? 'text-[#EAA823]' : 'text-emerald-100/60'}`}>
                  Home
                </span>
              </button>

              {/* Item 2: Search */}
              <button
                type="button"
                onClick={() => router.push('/#our-menu-section')}
                className="flex flex-col items-center justify-center group cursor-pointer focus:outline-none transition active:scale-90 w-11"
                aria-label="Search"
              >
                <Search 
                  className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isMenuActive ? 'text-[#EAA823] drop-shadow-[0_0_8px_rgba(234,168,35,0.6)]' : 'text-emerald-100/60 group-hover:text-white'
                  }`} 
                  strokeWidth={2.2}
                />
                <span 
                  className={`w-1 h-1 rounded-full mt-0.5 transition-all ${
                    isMenuActive ? 'bg-[#EAA823] shadow-[0_0_6px_#EAA823]' : 'opacity-0'
                  }`} 
                />
                <span className={`text-[8px] font-bold tracking-tight ${isMenuActive ? 'text-[#EAA823]' : 'text-emerald-100/60'}`}>
                  Search
                </span>
              </button>

              {/* Item 3: Create (Academy & Services) */}
              <button
                type="button"
                onClick={() => router.push('/training')}
                className="flex flex-col items-center justify-center group cursor-pointer focus:outline-none transition active:scale-90 w-11"
                aria-label="Culinary Academy"
              >
                <Plus 
                  className={`w-[19px] h-[19px] transition-colors duration-200 ${
                    isAcademyActive ? 'text-[#EAA823] drop-shadow-[0_0_8px_rgba(234,168,35,0.6)]' : 'text-emerald-100/60 group-hover:text-white'
                  }`} 
                  strokeWidth={2.2}
                />
                <span 
                  className={`w-1 h-1 rounded-full mt-0.5 transition-all ${
                    isAcademyActive ? 'bg-[#EAA823] shadow-[0_0_6px_#EAA823]' : 'opacity-0'
                  }`} 
                />
                <span className={`text-[8px] font-bold tracking-tight ${isAcademyActive ? 'text-[#EAA823]' : 'text-emerald-100/60'}`}>
                  Create
                </span>
              </button>

              {/* Item 4: Inbox */}
              <button
                type="button"
                onClick={() => router.push('/my-messages')}
                className="flex flex-col items-center justify-center group cursor-pointer focus:outline-none transition active:scale-90 w-11"
                aria-label="Inbox"
              >
                <div className="relative">
                  <MessageCircle 
                    className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      isInboxActive ? 'text-[#EAA823] drop-shadow-[0_0_8px_rgba(234,168,35,0.6)]' : 'text-emerald-100/60 group-hover:text-white'
                    }`} 
                    strokeWidth={2.2}
                  />
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-[#E53935] rounded-full ring-1 ring-[#072d1d]" />
                </div>
                <span 
                  className={`w-1 h-1 rounded-full mt-0.5 transition-all ${
                    isInboxActive ? 'bg-[#EAA823] shadow-[0_0_6px_#EAA823]' : 'opacity-0'
                  }`} 
                />
                <span className={`text-[8px] font-bold tracking-tight ${isInboxActive ? 'text-[#EAA823]' : 'text-emerald-100/60'}`}>
                  Inbox
                </span>
              </button>

              {/* Item 5: Saved */}
              <button
                type="button"
                onClick={() => router.push('/cart')}
                className="flex flex-col items-center justify-center group cursor-pointer focus:outline-none transition active:scale-90 w-11"
                aria-label="Saved Items"
              >
                <ShoppingBag 
                  className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isCartActive ? 'text-[#EAA823] drop-shadow-[0_0_8px_rgba(234,168,35,0.6)]' : 'text-emerald-100/60 group-hover:text-white'
                  }`} 
                  strokeWidth={2.2}
                />
                <span 
                  className={`w-1 h-1 rounded-full mt-0.5 transition-all ${
                    isCartActive ? 'bg-[#EAA823] shadow-[0_0_6px_#EAA823]' : 'opacity-0'
                  }`} 
                />
                <span className={`text-[8px] font-bold tracking-tight ${isCartActive ? 'text-[#EAA823]' : 'text-emerald-100/60'}`}>
                  Saved
                </span>
              </button>

            </div>
          </div>

          {/* Single-Line Copyright & SAMNET Attribution */}
          <div className="pt-1.5 pb-0.5 flex items-center justify-center gap-1.5 text-[8.5px] text-emerald-100/70 whitespace-nowrap overflow-hidden max-w-md mx-auto">
            <span>&copy; 2026 De-echoi Limited&reg;</span>
            <span className="text-[#EAA823]/60">|</span>
            <span>Developed &amp; managed by <strong className="text-[#EAA823] font-bold">SAMNET Industrials Ltd</strong></span>
            <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0 bg-white/10 ml-0.5">
              <Image
                src="/samnetLogo.png"
                alt="SAMNET Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>

        </nav>
      </div>
    </>
  )
}