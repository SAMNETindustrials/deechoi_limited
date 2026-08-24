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
  ChevronDown
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

  // Inline transaction-code creation & recovery
  const [isCreatingTxCode, setIsCreatingTxCode] = useState(false)
  const [isRecoveringCode, setIsRecoveringCode] = useState(false)
  const [attemptedCode, setAttemptedCode] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [recoverEmail, setRecoverEmail] = useState('')
  const [newTransactionCode, setNewTransactionCode] = useState('')
  const [creatingLoading, setCreatingLoading] = useState(false)
  const [recoveringLoading, setRecoveringLoading] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const desktopInlineFormRef = useRef<HTMLDivElement>(null)
  const { itemCount } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Check whether the current browser has customer data/session and synchronized database counts.
   */
  const checkCustomerData = async () => {
    try {
      if (typeof window === 'undefined') return

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const storedOrders = JSON.parse(
        localStorage.getItem('deechoi_customer_orders') || '[]'
      )

      const storedInquiries = JSON.parse(
        localStorage.getItem('deechoi_customer_inquiries') || '[]'
      )

      const storedSession = JSON.parse(
        localStorage.getItem('deechoi_customer_session') || '{}'
      )

      const storedEmail =
        localStorage.getItem('deechoi_customer_email') ||
        storedSession.email ||
        ''

      const userEmail = (
        session?.user?.email ||
        storedEmail ||
        ''
      )
        .trim()
        .toLowerCase()

      const userIsAuthed =
        !!session?.user ||
        !!storedEmail ||
        storedOrders.length > 0

      setIsLoggedIn(userIsAuthed)

      // 1. CHECK ORDERS
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

      // 2. CHECK MESSAGES
      if (storedInquiries.length > 0 || userEmail) {
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
          const replied = inqData.filter(
            (i) => i.reply_status === 'replied' || i.status === 'resolved'
          ).length
          setUnreadMessageCount(replied)
        } else {
          setHasMessages(false)
          setUnreadMessageCount(0)
        }
      } else {
        setHasMessages(false)
        setUnreadMessageCount(0)
      }

      // 3. CHECK VOUCHERS
      let totalVoucherCount = 0
      if (userEmail) {
        const { data: voucherData } = await supabase
          .from('store_event_claims')
          .select('id, status, customer_email')
          .ilike('customer_email', userEmail)

        if (voucherData && voucherData.length > 0) {
          totalVoucherCount = voucherData.length
        }
      }

      if (totalVoucherCount > 0) {
        setHasVouchers(true)
        setActiveVoucherCount(totalVoucherCount)
      } else {
        setHasVouchers(false)
        setActiveVoucherCount(0)
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
    window.addEventListener('deechoi_voucher_claimed', handleSync)
    window.addEventListener('storage', handleSync)

    return () => {
      window.removeEventListener('deechoi_order_placed', handleSync)
      window.removeEventListener('deechoi_message_sent', handleSync)
      window.removeEventListener('deechoi_voucher_claimed', handleSync)
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
        localStorage.removeItem('deechoi_customer_inquiries')
        localStorage.removeItem('active_checkout_voucher')
        localStorage.removeItem('active_discount_percent')
      }

      setIsLoggedIn(false)
      setIsUserDropdownOpen(false)
      setHasOrders(false)
      setHasMessages(false)
      setHasVouchers(false)
      setActiveOrderCount(0)
      setUnreadMessageCount(0)
      setActiveVoucherCount(0)
      setIsMenuOpen(false)
      setIsCreatingTxCode(false)
      setIsRecoveringCode(false)

      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // -----------------------------------------------------------
  // HELPER: DISPATCH API EMAIL
  // -----------------------------------------------------------
  const sendEmailNotification = async (email: string, subject: string, message: string) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      })
    } catch (err) {
      console.warn('Email dispatch warning:', err)
    }
  }

  // -----------------------------------------------------------
  // RECOVER FORGOTTEN TRANSACTION CODE
  // -----------------------------------------------------------
  const handleRecoverCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = recoverEmail.trim().toLowerCase()
    if (!email) {
      alert('Please enter your email address.')
      return
    }

    setRecoveringLoading(true)
    try {
      const { data: account, error } = await supabase
        .from('customer_accounts')
        .select('transaction_code')
        .ilike('customer_email', email)
        .maybeSingle()

      if (error || !account) {
        alert('No transaction code found associated with this email address.')
        setRecoveringLoading(false)
        return
      }

      await sendEmailNotification(
        email,
        'Your De-echoi Transaction Code Recovery',
        `Hello,\n\nYou requested to recover your 5-digit transaction code for De-echoi Limited.\n\nYour Transaction Code is: ${account.transaction_code}\n\nKeep this code secure and use it to log in and checkout on our store.\n\nThank you!`
      )

      alert(`Success! Your transaction code has been sent to ${email}.`)
      setIsRecoveringCode(false)
      setRecoverEmail('')
    } catch (err) {
      console.error('Recovery error:', err)
      alert('An unexpected error occurred while recovering your code.')
    } finally {
      setRecoveringLoading(false)
    }
  }

  // -----------------------------------------------------------
  // UNIFIED SEARCH / TRANSACTION CODE ROUTER
  // -----------------------------------------------------------
  const handleSearchOrTrack = async (e: React.FormEvent) => {
    e.preventDefault()

    const query = searchQuery.trim()
    if (!query) return

    const clean = query.toUpperCase()

    const isFiveDigitCode = /^\d{5}$/.test(query)
    const isTransactionCode =
      isFiveDigitCode ||
      clean.startsWith('ORD-') ||
      clean.startsWith('TX-') ||
      clean.startsWith('REF-') ||
      /^[0-9A-F]{8}-[0-9A-F]{4}/i.test(query)

    if (isTransactionCode) {
      try {
        let orderData = null

        if (!isFiveDigitCode && (clean.startsWith('ORD-') || clean.startsWith('TX-') || clean.startsWith('REF-') || query.length > 8)) {
          const { data, error } = await supabase
            .from('store_orders')
            .select('id, customer_email, transaction_code')
            .eq('id', query)
            .maybeSingle()

          if (!error) orderData = data
        }

        if (!orderData) {
          const { data, error } = await supabase
            .from('store_orders')
            .select('id, customer_email, transaction_code')
            .eq('transaction_code', query)
            .maybeSingle()

          if (!error) orderData = data
        }

        const { data: accountData, error: accountError } =
          await supabase
            .from('customer_accounts')
            .select('id, customer_email, transaction_code')
            .eq('transaction_code', query)
            .maybeSingle()

        if (accountError) {
          console.error('Customer account lookup error message:', accountError.message)
        }

        if (orderData || accountData) {
          if (typeof window !== 'undefined') {
            const stored = JSON.parse(
              localStorage.getItem('deechoi_customer_orders') || '[]'
            )

            const identifier = orderData?.id || query
            if (!stored.includes(identifier)) {
              stored.push(identifier)
              localStorage.setItem('deechoi_customer_orders', JSON.stringify(stored))
            }

            const emailVal =
              orderData?.customer_email ||
              accountData?.customer_email

            if (emailVal) {
              localStorage.setItem('deechoi_customer_email', emailVal)
              localStorage.setItem(
                'deechoi_customer_session',
                JSON.stringify({ email: emailVal })
              )
            }
          }

          setIsLoggedIn(true)
          setHasOrders(true)
          setIsCreatingTxCode(false)
          setIsRecoveringCode(false)
          await checkCustomerData()

          router.push(`/my-orders?code=${encodeURIComponent(query)}`)
          setSearchQuery('')
          setIsMenuOpen(false)
          return
        }

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

        setAttemptedCode(query)
        setNewTransactionCode(isFiveDigitCode ? query : '')
        setNewEmail('')
        setIsCreatingTxCode(true)
        setIsRecoveringCode(false)

        if (isMobile) {
          setIsMenuOpen(true)
        }
        return

      } catch (err) {
        console.error('Transaction search error:', err)
        alert('Unable to verify the transaction code. Please try again.')
        return
      }
    }

    const encodedSearch = encodeURIComponent(query)
    router.push(`/?search=${encodedSearch}#our-menu-section`)
    setSearchQuery('')
    setIsMenuOpen(false)
    setIsCreatingTxCode(false)
    setIsRecoveringCode(false)
  }

  // -----------------------------------------------------------
  // CREATE TRANSACTION CODE INLINE & DISPATCH EMAIL CONFIRMATION
  // -----------------------------------------------------------
  const handleCreateTxCode = async (e: React.FormEvent) => {
    e.preventDefault()

    const email = newEmail.trim().toLowerCase()
    const transactionCode = newTransactionCode.trim()

    if (!email || !transactionCode) {
      alert('Please provide both your email address and transaction code.')
      return
    }

    if (!/^\d{5}$/.test(transactionCode)) {
      alert('Transaction code must be exactly 5 digits (numbers only, no alphabets).')
      return
    }

    setCreatingLoading(true)

    try {
      const { data: existingEmailAccount } =
        await supabase
          .from('customer_accounts')
          .select('id, customer_email, transaction_code')
          .ilike('customer_email', email)
          .maybeSingle()

      if (existingEmailAccount) {
        alert('This email address already has a transaction account. Please use your existing transaction code.')
        setCreatingLoading(false)
        return
      }

      const { data: existingCodeAccount } =
        await supabase
          .from('customer_accounts')
          .select('id, customer_email, transaction_code')
          .eq('transaction_code', transactionCode)
          .maybeSingle()

      if (existingCodeAccount) {
        alert('This transaction code is already registered. Please choose another 5-digit code.')
        setCreatingLoading(false)
        return
      }

      const { error } = await supabase
        .from('customer_accounts')
        .insert([
          {
            customer_email: email,
            transaction_code: transactionCode,
          },
        ])

      if (error) {
        console.error('Transaction account creation error message:', error.message)
        alert('Could not create the transaction account. Please try again.')
        return
      }

      // Send Email Confirmation
      await sendEmailNotification(
        email,
        'Your De-echoi 5-Digit Transaction Code Created Successfully',
        `Hello,\n\nYour De-echoi transaction account has been successfully created and linked to this email.\n\nYour 5-Digit Transaction Code is: ${transactionCode}\n\nYou can use this code for secure checkouts and logging into your customer dashboard.\n\nThank you for choosing De-echoi Limited!`
      )

      if (typeof window !== 'undefined') {
        localStorage.setItem('deechoi_customer_email', email)
        localStorage.setItem(
          'deechoi_customer_session',
          JSON.stringify({ email })
        )

        const stored = JSON.parse(
          localStorage.getItem('deechoi_customer_orders') || '[]'
        )

        if (attemptedCode && !stored.includes(attemptedCode)) {
          stored.push(attemptedCode)
          localStorage.setItem('deechoi_customer_orders', JSON.stringify(stored))
        }
      }

      setIsLoggedIn(true)
      setHasOrders(true)
      setIsCreatingTxCode(false)
      setSearchQuery('')
      await checkCustomerData()

      alert(`Success! Your 5-digit transaction code has been created and confirmation mail has been sent to ${email}.`)

      router.push(`/my-orders?code=${encodeURIComponent(attemptedCode || transactionCode)}`)
      setIsMenuOpen(false)
    } catch (err) {
      console.error('Error creating transaction account:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setCreatingLoading(false)
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

  const mobileDynamicLinks: any[] = [...baseNavLinks]

  if (hasOrders) {
    mobileDynamicLinks.splice(2, 0, {
      label: 'My Orders',
      href: '/my-orders',
      icon: <Package className="w-4 h-4 text-amber-700" />,
      badge: activeOrderCount > 0 ? activeOrderCount : undefined,
      isPill: true,
    })
  }

  if (hasMessages) {
    const insertPos = hasOrders ? 3 : 2
    mobileDynamicLinks.splice(insertPos, 0, {
      label: 'My Messages',
      href: '/my-messages',
      icon: <MessageSquare className="w-4 h-4 text-emerald-700" />,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      isMessagePill: true,
    })
  }

  if (hasVouchers || isLoggedIn) {
    const insertPos = (hasOrders ? 1 : 0) + (hasMessages ? 1 : 0) + 2
    mobileDynamicLinks.splice(insertPos, 0, {
      label: 'My Vouchers',
      href: '/account/vouchers',
      icon: <Tag className="w-4 h-4 text-amber-600" />,
      badge: activeVoucherCount > 0 ? activeVoucherCount : undefined,
      isVoucherPill: true,
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
                onClick={() => {
                  setIsMenuOpen(true)
                  setIsCreatingTxCode(false)
                  setIsRecoveringCode(false)
                }}
                aria-label="Open Navigation Menu"
                className="text-[#072d1d] p-2 rounded-full hover:bg-black/5 transition active:scale-95 relative cursor-pointer"
              >
                <Menu className="w-6 h-6" />
                {(activeOrderCount > 0 || unreadMessageCount > 0 || activeVoucherCount > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                )}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 md:flex-initial flex items-center justify-center md:justify-start">
              <Link href="/" className="flex items-center justify-center relative group">
                <div className="relative w-36 sm:w-44 md:w-48 lg:w-56 h-60 md:h-25 flex items-center justify-center">
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
                    className={`transition-colors text-xs lg:text-[13px] font-semibold whitespace-nowrap flex-shrink-0 ${
                      isActive ? 'text-[#072d1d] font-black border-b-2 border-[#072d1d] pb-0.5' : 'text-stone-700 hover:text-[#072d1d]'
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
                    aria-label="User Account Menu"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden xl:inline">Account</span>
                    <ChevronDown className="w-3 h-3" />
                    {(activeOrderCount > 0 || unreadMessageCount > 0 || activeVoucherCount > 0) && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                    )}
                  </button>

                  {isUserDropdownOpen && (
                    <div 
                      onMouseLeave={() => setIsUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-700"
                    >
                      <div className="px-4 py-2 border-b border-stone-100 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Mode</p>
                        <p className="text-xs font-bold text-[#072d1d] truncate">Active Session</p>
                      </div>

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

                      <Link
                        href="/my-messages"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-medium hover:bg-emerald-50 transition"
                      >
                        <span className="flex items-center gap-2 text-emerald-800">
                          <MessageSquare className="w-3.5 h-3.5" /> My Messages
                        </span>
                        {unreadMessageCount > 0 && (
                          <span className="bg-amber-500 text-[#072d1d] text-[10px] font-black px-1.5 rounded-full">
                            {unreadMessageCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/account/vouchers"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-medium hover:bg-amber-50 transition"
                      >
                        <span className="flex items-center gap-2 text-amber-700">
                          <Tag className="w-3.5 h-3.5" /> My Vouchers & History
                        </span>
                        {activeVoucherCount > 0 && (
                          <span className="bg-[#072d1d] text-amber-300 text-[10px] font-black px-1.5 rounded-full">
                            {activeVoucherCount}
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
                  placeholder="Search meals or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400 w-full min-w-0"
                />
                <button type="submit" className="text-amber-600 hover:text-amber-700 flex-shrink-0 cursor-pointer" aria-label="Search">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

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

              {/* =====================================================
                  DESKTOP INLINE CREATION OR RECOVERY DROPDOWN
              ====================================================== */}
              {isCreatingTxCode && (
                <div 
                  ref={desktopInlineFormRef}
                  className="hidden md:block absolute right-0 top-14 w-80 bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 z-50 animate-in fade-in zoom-in-95 duration-200 text-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-700">
                      Create 5-Digit Code
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTxCode(false)}
                      className="text-xs text-stone-400 hover:text-stone-700 underline cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 leading-relaxed mb-3">
                    <div className="font-bold mb-0.5">Code not found</div>
                    <div>
                      <span className="font-mono font-bold text-amber-950">{attemptedCode}</span> is not registered. Provide your email below to receive confirmation and activate your 5-digit transaction code.
                    </div>
                  </div>

                  <form onSubmit={handleCreateTxCode} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2 bg-stone-50 border border-slate-200 rounded-xl px-3 py-2">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          type="email"
                          placeholder="e.g. user@example.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                          className="bg-transparent outline-none text-xs text-slate-800 w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Transaction Code (5 Digits)
                      </label>
                      <div className="flex items-center gap-2 bg-stone-50 border border-slate-200 rounded-xl px-3 py-2">
                        <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          value={newTransactionCode}
                          onChange={(e) => {
                            const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 5)
                            setNewTransactionCode(numericOnly)
                          }}
                          placeholder="e.g. 12345"
                          required
                          className="bg-transparent outline-none text-xs font-mono font-bold text-slate-800 w-full tracking-widest"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 px-1">
                        Must be exactly 5 numbers (no letters).
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingLoading}
                      className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                    >
                      {creatingLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <span>Create & Activate</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-3 pt-2 border-t border-stone-100 text-center">
                    <button
                      type="button"
                      onClick={() => { setIsCreatingTxCode(false); setIsRecoveringCode(true); }}
                      className="text-[11px] text-amber-700 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot your transaction code? Retrieve it here
                    </button>
                  </div>
                </div>
              )}

              {/* DESKTOP RECOVER CODE DROPDOWN */}
              {isRecoveringCode && (
                <div 
                  className="hidden md:block absolute right-0 top-14 w-80 bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 z-50 animate-in fade-in zoom-in-95 duration-200 text-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-700">
                      Recover Transaction Code
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsRecoveringCode(false)}
                      className="text-xs text-stone-400 hover:text-stone-700 underline cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 leading-relaxed mb-3">
                    Forgot your code? Enter your registered email address below, and we will send your 5-digit code directly to your mail.
                  </div>

                  <form onSubmit={handleRecoverCode} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Registered Email Address
                      </label>
                      <div className="flex items-center gap-2 bg-stone-50 border border-slate-200 rounded-xl px-3 py-2">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          type="email"
                          placeholder="e.g. user@example.com"
                          value={recoverEmail}
                          onChange={(e) => setRecoverEmail(e.target.value)}
                          required
                          className="bg-transparent outline-none text-xs text-slate-800 w-full"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={recoveringLoading}
                      className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                    >
                      {recoveringLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <span>Send Code to Email</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm md:hidden">
          <div className="absolute inset-0" onClick={() => { setIsMenuOpen(false); setIsCreatingTxCode(false); setIsRecoveringCode(false); }} />

          <aside className="relative w-[82%] max-w-[320px] bg-slate-50 h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="bg-[#072d1d] p-6 text-white relative rounded-b-3xl shadow-md">
              <button
                onClick={() => { setIsMenuOpen(false); setIsCreatingTxCode(false); setIsRecoveringCode(false); }}
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

            <div className="px-5 pt-4">
              <form 
                onSubmit={handleSearchOrTrack} 
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-sm focus-within:border-[#EAA823]"
              >
                <input
                  type="text"
                  placeholder="Search meal or paste TX Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400 flex-1"
                />
                <button type="submit" className="text-amber-600 hover:text-amber-700 cursor-pointer p-0.5" aria-label="Search">
                  {searchQuery.toUpperCase().startsWith('ORD-') || searchQuery.toUpperCase().startsWith('TX-') ? (
                    <Hash className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </form>
              <div className="flex items-center justify-between mt-1 px-2">
                <p className="text-[9px] text-gray-400">Type 5-digit code to log in.</p>
                <button
                  type="button"
                  onClick={() => { setIsCreatingTxCode(false); setIsRecoveringCode(true); }}
                  className="text-[9px] text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  Forgot Code?
                </button>
              </div>
            </div>

            {/* MOBILE: CREATE CODE FORM */}
            {isCreatingTxCode ? (
              <div className="p-5 space-y-4 flex-1 text-slate-700 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Create 5-Digit Code
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingTxCode(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Back to Menu
                  </button>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <div className="font-bold mb-1">Code not found</div>
                  <div>
                    <span className="font-mono font-bold text-amber-950">{attemptedCode}</span> is not registered yet.
                  </div>
                  <div className="mt-1">
                    Provide your email below to receive confirmation and activate your 5-digit code.
                  </div>
                </div>

                <form onSubmit={handleCreateTxCode} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email Address</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="email"
                        placeholder="e.g. user@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        className="bg-transparent outline-none text-xs text-slate-800 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Transaction Code (5 Digits)</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                      <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="e.g. 12345"
                        value={newTransactionCode}
                        onChange={(e) => {
                          const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 5)
                          setNewTransactionCode(numericOnly)
                        }}
                        required
                        className="bg-transparent outline-none text-xs font-mono font-bold text-slate-800 w-full tracking-widest"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 px-1">Must be exactly 5 numbers (no letters).</p>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingLoading}
                    className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                  >
                    {creatingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create & Activate</span> <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </form>
              </div>
            ) : isRecoveringCode ? (
              /* MOBILE: RECOVER CODE FORM */
              <div className="p-5 space-y-4 flex-1 text-slate-700 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Recover Code
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsRecoveringCode(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Back to Menu
                  </button>
                </div>
                
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 leading-relaxed">
                  Enter your registered email address below, and we will send your 5-digit transaction code to your mail.
                </div>

                <form onSubmit={handleRecoverCode} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email Address</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="email"
                        placeholder="e.g. user@example.com"
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        required
                        className="bg-transparent outline-none text-xs text-slate-800 w-full"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={recoveringLoading}
                    className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                  >
                    {recoveringLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send Code to Email</span> <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </form>
              </div>
            ) : (
              <nav className="p-5 space-y-4 flex-1 text-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Navigation</p>
                <div className="space-y-1.5">
                  {mobileDynamicLinks.map((item: any) => {
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
                              : item.isVoucherPill
                                ? 'bg-[#EAA823]/20 text-[#072d1d] font-bold border border-[#EAA823]/40'
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
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>

                {isLoggedIn && (
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </nav>
            )}

            <div className="p-4 border-t border-slate-200 bg-white text-center text-[10px] text-slate-400">
              De-echoi Limited &copy; 2026
            </div>
          </aside>
        </div>
      )}
    </>
  )
}