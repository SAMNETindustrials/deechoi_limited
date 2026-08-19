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
      icon: <Package className="w-4 h-4 text-amber-700" />,
      badge: activeOrderCount > 0 ? activeOrderCount : undefined,
      isPill: true,
    })
  }

  if (hasMessages) {
    const insertPos = hasOrders ? 3 : 2
    dynamicLinks.splice(insertPos, 0, {
      label: 'My Messages',
      href: '/my-messages',
      icon: <MessageSquare className="w-4 h-4 text-emerald-700" />,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      isMessagePill: true,
    })
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F9F6F0] text-slate-900 shadow-sm border-b border-stone-200/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 lg:gap-4">
            
            {/* Left: Mobile Hamburger Toggle */}
            <div className="flex items-center gap-2 md:hidden w-10">
              <button
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open Navigation Menu"
                className="text-[#072d1d] p-2 rounded-full hover:bg-black/5 transition active:scale-95 relative cursor-pointer"
              >
                <Menu className="w-6 h-6" />
                {(activeOrderCount > 0 || unreadMessageCount > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                )}
              </button>
            </div>

            {/* Brand Logo - Centered on Mobile, Left-aligned on Desktop */}
            <div className="flex-1 md:flex-initial flex items-center justify-center md:justify-start">
              <Link href="/" className="flex items-center justify-center relative group">
                <div className="relative w-36 sm:w-44 md:w-48 lg:w-56 h-60 sm:h-60 md:h-14 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center md:justify-start scale-110 sm:scale-120 md:scale-125 lg:scale-135 origin-center md:origin-left transition-transform duration-200">
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

            {/* Desktop Navigation Links */}
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
                          ? 'bg-amber-500 text-[#072d1d] border-amber-500 shadow-sm'
                          : 'bg-amber-100/80 text-amber-950 border-amber-300/70 hover:bg-amber-500 hover:text-[#072d1d]'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="bg-[#072d1d] text-amber-400 text-[10px] font-black px-1.5 rounded-full">
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
                          ? 'bg-[#072d1d] text-white border-[#072d1d] shadow-sm'
                          : 'bg-emerald-100/80 text-emerald-950 border-emerald-300/70 hover:bg-[#072d1d] hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="bg-amber-500 text-[#072d1d] text-[10px] font-black px-1.5 rounded-full">
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
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs lg:text-[13px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                        isActive
                          ? 'bg-amber-500 text-[#072d1d] border-amber-500 shadow-sm'
                          : 'bg-amber-50 text-amber-900 border-amber-300/80 hover:bg-amber-500 hover:text-[#072d1d]'
                      }`}
                    >
                      <Cake className="w-3.5 h-3.5 flex-shrink-0 text-amber-700" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  )
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`transition-colors text-xs lg:text-[13px] xl:text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
                      isActive ? 'text-[#072d1d] font-black border-b-2 border-[#072d1d] pb-0.5' : 'text-stone-700 hover:text-[#072d1d]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right Action Group: Search & Cart */}
            <div className="flex items-center justify-end gap-2 lg:gap-3 flex-shrink-0 w-10 md:w-auto ml-0 md:ml-auto lg:ml-2">
              {/* Desktop Search Bar */}
              <form 
                onSubmit={handleSearch} 
                className="hidden md:flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 w-40 lg:w-48 xl:w-56 shadow-xs border border-stone-200 focus-within:border-amber-500"
              >
                <input
                  type="text"
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400 w-full min-w-0"
                />
                <button type="submit" className="text-amber-600 hover:text-amber-700 flex-shrink-0 cursor-pointer" aria-label="Search">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Cart Button */}
              <Link 
                href="/cart" 
                aria-label="Shopping Cart"
                className="relative bg-[#072d1d] text-white p-2 lg:p-2.5 rounded-full shadow-sm hover:bg-amber-500 hover:text-[#072d1d] transition active:scale-95 flex-shrink-0"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-[#072d1d] text-[10px] font-black rounded-full w-4.5 h-4.5 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-[#F9F6F0]">
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
                className="absolute top-4 right-4 bg-white/10 p-1.5 rounded-full text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl border-2 border-amber-500 bg-[#F9F6F0] overflow-hidden flex-shrink-0 shadow-md">
                  <Image src="/logo.png" alt="De-echoi Logo" fill className="object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">De-echoi Limited</h3>
                  <p className="text-[10px] text-emerald-200/80">Quality made just for You</p>
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
                <button type="submit" className="text-amber-600 cursor-pointer" aria-label="Search">
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