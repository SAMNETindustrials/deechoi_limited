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
  Sparkles,
  Package,
  MessageSquare
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { createClient } from '@/lib/supabase/client'

export function StorefrontHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasOrders, setHasOrders] = useState(false)
  const [activeOrderCount, setActiveOrderCount] = useState(0)
  const [hasMessages, setHasMessages] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  const { itemCount } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const checkCustomerData = async () => {
    try {
      if (typeof window === 'undefined') return

      const storedOrders = JSON.parse(localStorage.getItem('deechoi_customer_orders') || '[]')
      const storedInquiries = JSON.parse(localStorage.getItem('deechoi_customer_inquiries') || '[]')
      const storedSession = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
      const userEmail = storedSession.email?.trim().toLowerCase()
      const userPhone = storedSession.phone?.trim()

      // 1. Check Orders
      if (storedOrders.length > 0 || userPhone || userEmail) {
        setHasOrders(true)
        let query = supabase
          .from('store_orders')
          .select('id, status')
          .neq('status', 'completed')
          .neq('status', 'cancelled')
          .neq('payment_method', 'contact_form_message')

        if (storedOrders.length > 0) {
          query = query.in('id', storedOrders)
        } else if (userPhone) {
          query = query.eq('customer_phone', userPhone)
        }

        const { data } = await query
        setActiveOrderCount(data?.length || 0)
      } else {
        setHasOrders(false)
        setActiveOrderCount(0)
      }

      // 2. Check Messages & Inquiries
      if (storedInquiries.length > 0 || userEmail) {
        setHasMessages(true)
        let inqQuery = supabase
          .from('customer_inquiries')
          .select('id, reply_status, status')

        if (userEmail) {
          inqQuery = inqQuery.ilike('email', userEmail)
        } else if (storedInquiries.length > 0) {
          inqQuery = inqQuery.in('id', storedInquiries)
        }

        const { data: inqData } = await inqQuery
        if (inqData && inqData.length > 0) {
          setHasMessages(true)
          const replied = inqData.filter(i => i.reply_status === 'replied' || i.status === 'resolved').length
          setUnreadMessageCount(replied)
        }
      } else {
        setHasMessages(false)
        setUnreadMessageCount(0)
      }
    } catch (e) {
      console.warn('Header session check:', e)
    }
  }

  useEffect(() => {
    checkCustomerData()

    const handleSync = () => checkCustomerData()
    window.addEventListener('deechoi_order_placed', handleSync)
    window.addEventListener('deechoi_message_sent', handleSync)
    window.addEventListener('storage', handleSync)

    return () => {
      window.removeEventListener('deechoi_order_placed', handleSync)
      window.removeEventListener('deechoi_message_sent', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const baseNavLinks = [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4 text-[#072d1d]" /> },
    { label: 'Cakes', href: '/cakes', icon: <Cake className="w-4 h-4 text-amber-600" />, isSpecial: true },
    { label: 'Meals & Menu', href: '/#our-menu-section', icon: <Utensils className="w-4 h-4 text-[#072d1d]" /> },
    { label: 'About Us', href: '/about', icon: <Info className="w-4 h-4 text-[#072d1d]" /> },
    { label: 'Book Us', href: '/services', icon: <Calendar className="w-4 h-4 text-[#072d1d]" /> },
    { label: 'Contact', href: '/contact', icon: <PhoneCall className="w-4 h-4 text-[#072d1d]" /> },
  ]

  const dynamicLinks: any[] = [...baseNavLinks]

  if (hasOrders) {
    dynamicLinks.splice(2, 0, {
      label: 'My Orders',
      href: '/my-orders',
      icon: <Package className="w-4 h-4 text-amber-600" />,
      badge: activeOrderCount > 0 ? activeOrderCount : undefined,
      isPill: true,
    })
  }

  if (hasMessages) {
    const insertPos = hasOrders ? 3 : 2
    dynamicLinks.splice(insertPos, 0, {
      label: 'My Messages',
      href: '/my-messages',
      icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      isMessagePill: true,
    })
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#072d1d] text-white shadow-md border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 lg:gap-4">
            
            {/* Left: Mobile Hamburger Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open Navigation Menu"
                className="text-white p-2 rounded-full hover:bg-white/10 transition active:scale-95 relative"
              >
                <Menu className="w-6 h-6" />
                {(activeOrderCount > 0 || unreadMessageCount > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </button>
            </div>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <div className="relative w-32 sm:w-40 lg:w-44 h-9 sm:h-11">
                <Image
                  src="/logo.png"
                  alt="De-echoi Limited Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation Links - Single line, non-wrapping */}
            <nav className="hidden md:flex gap-2 lg:gap-3.5 xl:gap-5 items-center flex-shrink-0">
              {dynamicLinks.map((item: any) => {
                const isActive = pathname === item.href

                if (item.isPill) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-full text-xs lg:text-[13px] font-extrabold transition-all border whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-[#072d1d] border-amber-500 shadow-md'
                          : 'bg-emerald-800/60 text-amber-300 border-amber-400/40 hover:bg-amber-400 hover:text-[#072d1d]'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="bg-amber-500 text-[#072d1d] text-[10px] font-black px-1.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                }

                if (item.isMessagePill) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-full text-xs lg:text-[13px] font-extrabold transition-all border whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                          : 'bg-emerald-900/80 text-emerald-200 border-emerald-600/40 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="bg-amber-400 text-[#072d1d] text-[10px] font-black px-1.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                }

                if (item.isSpecial) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs lg:text-[13px] font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-[#072d1d] shadow-sm'
                          : 'bg-[#12422C] text-amber-400 border border-amber-400/30 hover:bg-amber-500 hover:text-[#072d1d]'
                      }`}
                    >
                      <Cake className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  )
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`transition-colors text-xs lg:text-[13px] xl:text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
                      isActive ? 'text-amber-400 font-bold' : 'text-gray-200 hover:text-amber-400'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right Action Group: Search & Cart shifted closer together */}
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0 ml-auto lg:ml-2">
              {/* Desktop Search Bar */}
              <form 
                onSubmit={handleSearch} 
                className="hidden md:flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 w-40 lg:w-48 xl:w-56 shadow-inner"
              >
                <input
                  type="text"
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400 w-full min-w-0"
                />
                <button type="submit" className="text-amber-600 hover:text-amber-700 flex-shrink-0" aria-label="Search">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Cart Button */}
              <Link 
                href="/cart" 
                aria-label="Shopping Cart"
                className="relative bg-white text-[#072d1d] p-2 lg:p-2.5 rounded-full shadow-md hover:bg-amber-400 transition active:scale-95 flex-shrink-0"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#072d1d]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-[#072d1d] text-[10px] font-black rounded-full w-4.5 h-4.5 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-[#072d1d]">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm md:hidden">
          <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)} />

          <aside className="relative w-[82%] max-w-[320px] bg-slate-50 h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="bg-[#072d1d] p-6 text-white relative rounded-b-3xl shadow-md">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 bg-white/10 p-1.5 rounded-full text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full border-2 border-amber-500 bg-emerald-900 overflow-hidden flex-shrink-0">
                  <Image src="/logo.png" alt="De-echoi Logo" fill className="object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">De-echoi Limited</h3>
                  <p className="text-[10px] text-emerald-200/80">Authentic Flavors & Catering</p>
                </div>
              </div>
            </div>

            {/* Mobile Search inside Drawer */}
            <div className="px-5 pt-4">
              <form 
                onSubmit={handleSearch} 
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-sm"
              >
                <input
                  type="text"
                  placeholder="Search meals, cakes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400 flex-1"
                />
                <button type="submit" className="text-amber-600" aria-label="Search">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            <nav className="p-5 space-y-4 flex-1 text-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Navigation</p>
              <div className="space-y-1.5">
                {dynamicLinks.map((item: any) => {
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition ${
                        item.isMessagePill
                          ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                          : item.isPill
                            ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                            : isActive
                              ? 'bg-[#072d1d] text-white font-bold'
                              : 'text-slate-800 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="bg-[#072d1d] text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full">
                          {item.badge} Active
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="p-4 border-t border-slate-200 bg-white text-center text-[10px] text-slate-400">
              De-echoi Limited &copy; 2026
            </div>
          </aside>
        </div>
      )}
    </>
  )
}