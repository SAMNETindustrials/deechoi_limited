'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingCart,
  Menu,
  X,
  Cake,
  Home,
  Info,
  PhoneCall,
  Calendar,
  Utensils,
  Search,
  Package,
  MessageSquare,
  Tag,
  LogOut,
  Hash,
  Mail,
  Loader2,
  ArrowRight,
  ShieldCheck,
  User,
  ChevronDown,
  Store
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { createClient } from '@/lib/supabase/client'

export function StorefrontHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  const [hasOrders, setHasOrders] = useState(false)
  const [activeOrderCount, setActiveOrderCount] = useState(0)

  const [hasMessages, setHasMessages] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  const [hasVouchers, setHasVouchers] = useState(false)
  const [activeVoucherCount, setActiveVoucherCount] = useState(0)

  const [isCreatingTxCode, setIsCreatingTxCode] = useState(false)
  const [isRecoveringCode, setIsRecoveringCode] = useState(false)
  const [attemptedCode, setAttemptedCode] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [recoverEmail, setRecoverEmail] = useState('')
  const [newTransactionCode, setNewTransactionCode] = useState('')
  const [creatingLoading, setCreatingLoading] = useState(false)
  const [recoveringLoading, setRecoveringLoading] = useState(false)

  const [showDesktopCartEmail, setShowDesktopCartEmail] = useState(false)
  const [showMobileCartEmail, setShowMobileCartEmail] = useState(false)
  const [cartLoginEmail, setCartLoginEmail] = useState('')
  const [cartLoginLoading, setCartLoginLoading] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const desktopCartHoverRef = useRef<HTMLDivElement>(null)
  const mobileCartContainerRef = useRef<HTMLDivElement>(null)

  const { itemCount } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
      if (desktopCartHoverRef.current && !desktopCartHoverRef.current.contains(event.target as Node)) {
        setShowDesktopCartEmail(false)
      }
      if (mobileCartContainerRef.current && !mobileCartContainerRef.current.contains(event.target as Node)) {
        setShowMobileCartEmail(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkCustomerData = async () => {
    try {
      if (typeof window === 'undefined') return

      const { data: { session } } = await supabase.auth.getSession()
      const storedOrders = JSON.parse(localStorage.getItem('deechoi_customer_orders') || '[]')
      const storedInquiries = JSON.parse(localStorage.getItem('deechoi_customer_inquiries') || '[]')
      const storedSession = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
      const storedEmail = localStorage.getItem('deechoi_customer_email') || storedSession.email || ''

      const userEmail = (session?.user?.email || storedEmail || '').trim().toLowerCase()
      const userIsAuthed = !!session?.user || !!storedEmail || storedOrders.length > 0

      setIsLoggedIn(userIsAuthed)

      if (storedOrders.length > 0 || userEmail) {
        setHasOrders(true)

        let query = supabase
          .from('store_orders')
          .select('id, status')
          .neq('status', 'completed')
          .neq('status', 'cancelled')
          .neq('payment_method', 'contact_form_message')

        if (storedOrders.length > 0) {
          query = query.in('id', storedOrders)
        } else if (userEmail) {
          query = query.ilike('customer_email', userEmail)
        }

        const { data } = await query
        setActiveOrderCount(data?.length || 0)
      } else {
        setHasOrders(false)
        setActiveOrderCount(0)
      }
    } catch (e) {
      console.warn('Header session check:', e)
    }
  }

  useEffect(() => {
    checkCustomerData()
    const handleSync = () => checkCustomerData()

    window.addEventListener('deechoi_order_placed', handleSync)
    window.addEventListener('storage', handleSync)

    return () => {
      window.removeEventListener('deechoi_order_placed', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()

      if (typeof window !== 'undefined') {
        localStorage.removeItem('deechoi_customer_email')
        localStorage.removeItem('deechoi_customer_session')
        localStorage.removeItem('deechoi_customer_orders')
      }

      setIsLoggedIn(false)
      setIsUserDropdownOpen(false)
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const sendEmailNotification = async (email: string, subject: string, message: string) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message })
      })
    } catch (err) {
      console.warn('Email dispatch warning:', err)
    }
  }

  const handleCartEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = cartLoginEmail.trim().toLowerCase()
    if (!email) return

    setCartLoginLoading(true)

    try {
      const { data: accountData } = await supabase
        .from('customer_accounts')
        .select('id, customer_email, transaction_code')
        .ilike('customer_email', email)
        .maybeSingle()

      if (typeof window !== 'undefined') {
        localStorage.setItem('deechoi_customer_email', email)
        localStorage.setItem('deechoi_customer_session', JSON.stringify({ email }))

        if (accountData?.transaction_code) {
          const stored = JSON.parse(localStorage.getItem('deechoi_customer_orders') || '[]')
          if (!stored.includes(accountData.transaction_code)) {
            stored.push(accountData.transaction_code)
            localStorage.setItem('deechoi_customer_orders', JSON.stringify(stored))
          }
        }
      }

      setIsLoggedIn(true)
      await checkCustomerData()

      setShowDesktopCartEmail(false)
      setShowMobileCartEmail(false)
      setCartLoginEmail('')

      router.push('/my-orders')
    } catch (err) {
      console.error('Cart email login error:', err)
      alert('Could not access dashboard. Please try again.')
    } finally {
      setCartLoginLoading(false)
    }
  }

  const handleSearchOrTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return

    const isEmailInput = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)

    if (isEmailInput) {
      const email = query.toLowerCase()
      try {
        const { data: accountData } = await supabase
          .from('customer_accounts')
          .select('id, customer_email, transaction_code')
          .ilike('customer_email', email)
          .maybeSingle()

        if (typeof window !== 'undefined') {
          localStorage.setItem('deechoi_customer_email', email)
          localStorage.setItem('deechoi_customer_session', JSON.stringify({ email }))
        }

        setIsLoggedIn(true)
        await checkCustomerData()

        setSearchQuery('')
        setIsMenuOpen(false)
        router.push('/my-orders')
        return
      } catch (err) {
        console.error('Email search login error:', err)
      }
    }

    const encodedSearch = encodeURIComponent(query)
    router.push(`/?search=${encodedSearch}#our-menu-section`)
    setSearchQuery('')
    setIsMenuOpen(false)
  }

  // -----------------------------------------------------------
  // NAVIGATION LINKS (Includes Become a Partner)
  // -----------------------------------------------------------
  const baseNavLinks = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="w-4 h-4 text-[#072d1d]" />
    },
    {
      label: 'Cakes',
      href: '/cakes',
      icon: <Cake className="w-4 h-4 text-amber-600" />,
      isSpecial: true
    },
    {
      label: 'Meals & Menu',
      href: '/#our-menu-section',
      icon: <Utensils className="w-4 h-4 text-[#072d1d]" />
    },
    {
      label: 'Become a Partner',
      href: '/partner/register',
      icon: <Store className="w-4 h-4 text-emerald-700" />,
      isPartner: true
    },
    {
      label: 'About Us',
      href: '/about',
      icon: <Info className="w-4 h-4 text-[#072d1d]" />
    },
    {
      label: 'Book Us',
      href: '/services',
      icon: <Calendar className="w-4 h-4 text-[#072d1d]" />
    },
    {
      label: 'Contact',
      href: '/contact',
      icon: <PhoneCall className="w-4 h-4 text-[#072d1d]" />
    }
  ]

  const mobileDynamicLinks: any[] = [...baseNavLinks]

  if (hasOrders) {
    mobileDynamicLinks.splice(3, 0, {
      label: 'My Orders',
      href: '/my-orders',
      icon: <Package className="w-4 h-4 text-amber-700" />,
      badge: activeOrderCount > 0 ? activeOrderCount : undefined,
      isPill: true
    })
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F9F6F0] text-slate-900 shadow-sm border-b border-stone-200/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 lg:gap-4 relative">

            {/* Mobile Hamburger */}
            <div className="flex items-center gap-2 md:hidden w-10">
              <button
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open Navigation Menu"
                className="text-[#072d1d] p-2 rounded-full hover:bg-black/5 transition active:scale-95 relative cursor-pointer"
              >
                <Menu className="w-6 h-6" />
                {activeOrderCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                )}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 md:flex-initial flex items-center justify-center md:justify-start">
              <Link href="/" className="flex items-center justify-center relative group">
                <div className="relative w-36 sm:w-44 md:w-48 lg:w-56 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center md:justify-start scale-105 sm:scale-110 md:scale-120 origin-center md:origin-left transition-transform duration-200">
                    <div className="relative w-full h-full">
                      <Image
                        src="/logo.png"
                        alt="De-echoi Limited Logo"
                        fill
                        className="object-contain object-center md:object-left drop-shadow-xs"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-2 lg:gap-4 items-center flex-shrink-0">
              {baseNavLinks.map((item: any) => {
                const isActive = pathname === item.href

                if (item.isSpecial) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs lg:text-[13px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                        isActive
                          ? 'bg-amber-500 text-[#072d1d] border-amber-500 shadow-sm'
                          : 'bg-amber-50 text-amber-900 border-amber-300/80 hover:bg-amber-500 hover:text-[#072d1d]'
                      }`}
                    >
                      <Cake className="w-3.5 h-3.5 flex-shrink-0 text-amber-700" />
                      <span>{item.label}</span>
                    </Link>
                  )
                }

                if (item.isPartner) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs lg:text-[13px] font-extrabold transition-all whitespace-nowrap flex-shrink-0 border ${
                        isActive
                          ? 'bg-[#072d1d] text-emerald-300 border-emerald-500 shadow-sm'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300/80 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5 flex-shrink-0 text-emerald-700" />
                      <span>{item.label}</span>
                    </Link>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors text-xs lg:text-[13px] font-semibold whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? 'text-[#072d1d] font-black border-b-2 border-[#072d1d] pb-0.5'
                        : 'text-stone-700 hover:text-[#072d1d]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {/* Desktop User Account Dropdown */}
              {isLoggedIn && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    onMouseEnter={() => setIsUserDropdownOpen(true)}
                    className="flex items-center gap-1 bg-[#072d1d] text-amber-300 hover:bg-amber-500 hover:text-[#072d1d] px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden xl:inline">Account</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isUserDropdownOpen && (
                    <div
                      onMouseLeave={() => setIsUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-slate-700"
                    >
                      <Link
                        href="/my-orders"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-medium hover:bg-amber-50 transition"
                      >
                        <span className="flex items-center gap-2 text-amber-800">
                          <Package className="w-3.5 h-3.5" /> My Orders
                        </span>
                        {activeOrderCount > 0 && (
                          <span className="bg-[#072d1d] text-amber-300 text-[10px] font-black px-1.5 rounded-full">
                            {activeOrderCount}
                          </span>
                        )}
                      </Link>

                      <div className="border-t border-stone-100 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center justify-end gap-2 flex-shrink-0 w-10 md:w-auto ml-0 md:ml-auto relative">
              <form
                onSubmit={handleSearchOrTrack}
                className="hidden md:flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 w-32 lg:w-40 xl:w-48 shadow-xs border border-stone-200 focus-within:border-amber-500"
              >
                <input
                  type="text"
                  placeholder="Search meals or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400 w-full min-w-0"
                />
                <button type="submit" className="text-amber-600 hover:text-amber-700 flex-shrink-0 cursor-pointer" aria-label="Search">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Desktop Cart */}
              <div
                className="relative hidden md:block"
                ref={desktopCartHoverRef}
                onMouseEnter={() => setShowDesktopCartEmail(true)}
                onMouseLeave={() => setShowDesktopCartEmail(false)}
              >
                <Link
                  href="/cart"
                  aria-label="Shopping Cart"
                  className="relative bg-[#072d1d] text-white p-2 lg:p-2.5 rounded-full shadow-sm hover:bg-amber-500 hover:text-[#072d1d] transition flex items-center justify-center"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-[#072d1d] text-[10px] font-black rounded-full w-4.5 h-4.5 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-[#F9F6F0]">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {showDesktopCartEmail && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-stone-200 p-4 z-50 text-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <Mail className="w-4 h-4 text-amber-600" /> Quick Email Login
                    </div>
                    <form onSubmit={handleCartEmailLogin} className="space-y-2">
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={cartLoginEmail}
                        onChange={(e) => setCartLoginEmail(e.target.value)}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 outline-none text-xs w-full text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={cartLoginLoading}
                        className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-amber-300 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {cartLoginLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Access Dashboard'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-full max-w-xs bg-[#F9F6F0] h-full shadow-2xl flex flex-col z-10">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
              <h3 className="text-sm font-black text-[#072d1d] uppercase">De-Echoi Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="text-stone-500 p-2 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <nav className="space-y-1">
                {mobileDynamicLinks.map((item: any) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-[#072d1d] text-amber-300'
                          : item.isPartner
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'text-slate-700 hover:bg-stone-200/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.icon}
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}