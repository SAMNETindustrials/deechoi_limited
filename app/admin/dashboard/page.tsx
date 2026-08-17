'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, BarChart3, LogOut, ShoppingCart, TrendingUp, Bell, Settings, Menu, X,
  ArrowUpRight, ArrowDownRight, ChevronRight, Search, Clock, CheckCircle2, Truck,
  MessageSquare, Layers
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { MrTellChat } from '@/components/mr-tell-chat'
import { MrTellButton } from '@/components/mr-tell-button'

interface Order {
  id: string
  customer_name: string
  customer_phone?: string
  delivery_address?: string
  total_amount: number
  status: string
  created_at: string
}

interface NotificationItem {
  id: string
  type: 'order' | 'inquiry'
  reference_id: string
  title: string
  subtitle: string
  badge: string
  created_at: string
  read: boolean
  target_url: string
}

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  completedOrders: number
  pendingOrders: number
  orderTrend: { date: string; count: number }[]
  revenueTrend: { date: string; amount: number }[]
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    orderTrend: [],
    revenueTrend: [],
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [mrTellOpen, setMrTellOpen] = useState(false)
  
  const notifDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/admin/login')
      } else {
        setUser(user)
        loadDashboardData()
      }
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Real-time subscriptions for both Orders and Inquiries
  useEffect(() => {
    const ordersChannel = supabase
      .channel('realtime:dashboard_orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'store_orders' },
        (payload) => {
          const newOrder = payload.new as Order
          setNotifications((prev) => [
            {
              id: `order-${newOrder.id}`,
              type: 'order',
              reference_id: newOrder.id,
              title: `New Order: ${newOrder.customer_name}`,
              subtitle: `₦${Number(newOrder.total_amount || 0).toLocaleString()}`,
              badge: newOrder.status || 'pending',
              created_at: newOrder.created_at || new Date().toISOString(),
              read: false,
              target_url: `/admin/orders/${newOrder.id}`,
            },
            ...prev,
          ])
          loadDashboardData()
        }
      )
      .subscribe()

    const inquiriesChannel = supabase
      .channel('realtime:dashboard_inquiries')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_inquiries' },
        (payload) => {
          const newInquiry = payload.new as any
          setNotifications((prev) => [
            {
              id: `inquiry-${newInquiry.id}`,
              type: 'inquiry',
              reference_id: newInquiry.id,
              title: `Message from ${newInquiry.name}`,
              subtitle: newInquiry.category || 'Customer Inquiry',
              badge: 'Message',
              created_at: newInquiry.created_at || new Date().toISOString(),
              read: false,
              target_url: '/admin/messages',
            },
            ...prev,
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(inquiriesChannel)
    }
  }, [supabase])

  const loadDashboardData = async () => {
    try {
      // 1. Fetch live orders (excluding any accidental contact items)
      const { data: orders, error } = await supabase
        .from('store_orders')
        .select('*')
        .neq('payment_method', 'contact_form_message')
        .order('created_at', { ascending: false })

      if (error) throw error

      const orderData: Order[] = orders || []

      // Calculate stats
      const totalOrders = orderData.length
      const totalRevenue = orderData.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
      const completedOrders = orderData.filter(o => o.status === 'completed').length
      const pendingOrders = orderData.filter(o => o.status === 'pending' || o.status === 'confirmed').length

      setRecentOrders(orderData.slice(0, 4))
      setFilteredOrders(orderData.slice(0, 4))

      // 2. Fetch recent inquiries
      const { data: inquiries } = await supabase
        .from('customer_inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      // Combine notifications
      const orderNotifs: NotificationItem[] = orderData.slice(0, 5).map((o) => ({
        id: `order-${o.id}`,
        type: 'order',
        reference_id: o.id,
        title: `Order: ${o.customer_name}`,
        subtitle: `₦${Number(o.total_amount || 0).toLocaleString()}`,
        badge: o.status,
        created_at: o.created_at,
        read: o.status === 'completed',
        target_url: `/admin/orders/${o.id}`,
      }))

      const inquiryNotifs: NotificationItem[] = (inquiries || []).map((inq) => ({
        id: `inquiry-${inq.id}`,
        type: 'inquiry',
        reference_id: inq.id,
        title: `Message: ${inq.name}`,
        subtitle: inq.category || 'General',
        badge: inq.reply_status === 'replied' ? 'Replied' : 'Pending Reply',
        created_at: inq.created_at,
        read: inq.reply_status === 'replied',
        target_url: '/admin/messages',
      }))

      const combined = [...orderNotifs, ...inquiryNotifs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setNotifications(combined)

      const orderTrend = calculateTrend(orderData, 'orders')
      const revenueTrend = calculateTrend(orderData, 'revenue')

      setStats({
        totalOrders,
        totalRevenue,
        completedOrders,
        pendingOrders,
        orderTrend,
        revenueTrend,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const calculateTrend = (orders: any[], type: 'orders' | 'revenue') => {
    const today = new Date()
    const trend = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate.toLocaleDateString() === date.toLocaleDateString()
      })

      if (type === 'orders') {
        trend.push({ date: dateStr, count: dayOrders.length })
      } else {
        const amount = dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
        trend.push({ date: dateStr, amount })
      }
    }

    return trend
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredOrders(recentOrders)
    } else {
      const q = query.toLowerCase()
      const filtered = recentOrders.filter(order =>
        order.customer_name.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q)
      )
      setFilteredOrders(filtered)
    }
  }

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    )
    setShowNotifications(false)
    router.push(notif.target_url)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return `${diffDays}d ago`
    } catch {
      return ''
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2E1D] to-[#072215]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#EAA823]/30 border-t-[#EAA823] rounded-full animate-spin"></div>
          <p className="text-[#EAA823] font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: MessageSquare, label: 'Messages & AI', path: '/admin/messages' },
    { icon: Layers, label: 'Products', path: '/admin/products' },
    { icon: Package, label: 'Stock & Inventory', path: '/admin/inventory' },
    { icon: Settings, label: 'Settings & Alerts', path: '/admin/settings' }
  ]

  return (
    <div className="min-h-screen bg-[#0F1419] text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-[#1a1f2e] to-[#131821] border-r border-[#EAA823]/20 transition-all duration-300 sticky top-0 h-screen flex flex-col hidden md:flex shadow-2xl z-30`}>
        <div className="h-20 border-b border-[#EAA823]/20 flex items-center justify-center px-4 py-4">
          <Link href="/admin/dashboard">
            <div className="relative w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="DEECHOI" fill className="object-contain" priority />
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                item.active
                  ? 'bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] shadow-lg shadow-[#EAA823]/50 font-bold'
                  : 'text-gray-400 hover:bg-[#EAA823]/10 hover:text-[#EAA823]'
              }`}>
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform ${item.active ? '' : 'group-hover:scale-110'}`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#EAA823]/20 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-[#EAA823]/20 bg-gradient-to-r from-[#1a1f2e] to-[#131821] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#EAA823]/20 rounded-lg transition-colors hidden md:block"
            >
              <Menu className="h-5 w-5 text-[#EAA823]" />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-[#EAA823]/20 rounded-lg transition-colors md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-[#EAA823]" /> : <Menu className="h-5 w-5 text-[#EAA823]" />}
            </button>

            <h2 className="text-xl font-bold text-white hidden md:block">Admin Dashboard</h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Bar with Mr. Tell */}
            <div className="hidden lg:flex items-center gap-2 bg-[#EAA823]/10 rounded-full px-3.5 py-2 flex-1 max-w-xs border border-[#EAA823]/20">
              <Search className="h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setMrTellOpen(true)}
                className="shrink-0 rounded-full focus-visible:outline-none"
                title="Ask Mr. Tell"
              >
                <Image src="/mr-tell.jpg" alt="Mr. Tell" width={18} height={18} className="rounded-full object-cover" />
              </button>
              <input
                type="text"
                placeholder="Search orders or ask Mr. Tell..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-gray-400 outline-none w-full"
              />
            </div>

            {/* Notification Bell Component */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 hover:bg-[#EAA823]/20 rounded-xl transition-all border border-[#EAA823]/20"
                aria-label="View Notifications"
              >
                <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-[#EAA823]' : 'text-gray-400'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-[#131821] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#1a1f2e] border border-[#EAA823]/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
                  <div className="p-4 bg-[#131821] border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#EAA823]" />
                      <h3 className="font-bold text-sm text-white">Live Activity</h3>
                      {unreadCount > 0 && (
                        <span className="bg-[#EAA823] text-[#0A2E1D] text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[11px] text-[#EAA823] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-xs">No notifications yet</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-[#EAA823]/10 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            !notif.read ? 'bg-[#EAA823]/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                              notif.type === 'inquiry'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-[#EAA823]/20 text-[#EAA823]'
                            }`}>
                              {notif.type === 'inquiry' ? (
                                <MessageSquare className="w-4 h-4" />
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                              <p className="text-[11px] text-gray-300">{notif.subtitle}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeTime(notif.created_at)}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              notif.type === 'inquiry'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {notif.badge}
                            </span>
                            <span className="text-[10px] text-[#EAA823] flex items-center gap-0.5 pt-1">
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-[#EAA823]/20">
              <div className="text-right">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-gray-400">{user?.email?.split('@')[0] || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EAA823] to-[#f5d547] flex items-center justify-center font-bold text-[#0A2E1D] shadow-lg">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-[#0F1419]">
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'Admin'}!
            </h1>
            <p className="text-gray-400 text-sm">
              Live orders, revenue tracking, and menu management.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Link href="/admin/orders">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 hover:border-[#EAA823]/50 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Orders</p>
                    <p className="text-3xl font-black text-white">{stats.totalOrders}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <ShoppingCart className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Real-time Orders</span>
                </div>
              </div>
            </Link>

            <Link href="/admin/orders">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 hover:border-[#EAA823]/50 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Revenue</p>
                    <p className="text-3xl font-black text-white">
                      ₦{(stats.totalRevenue / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k
                    </p>
                  </div>
                  <div className="p-3 bg-[#EAA823]/20 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-[#EAA823]" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Gross Sales</span>
                </div>
              </div>
            </Link>

            <Link href="/admin/orders">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 hover:border-[#EAA823]/50 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Completed Deliveries</p>
                    <p className="text-3xl font-black text-white">{stats.completedOrders}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Package className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Delivered</span>
                </div>
              </div>
            </Link>

            <Link href="/admin/orders">
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 hover:border-[#EAA823]/50 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Pending Orders</p>
                    <p className="text-3xl font-black text-white">{stats.pendingOrders}</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <ArrowDownRight className="h-4 w-4" />
                  <span>Awaiting Dispatch</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 shadow-xl">
              <h3 className="text-base font-bold text-white mb-6">Orders Volume (Last 7 Days)</h3>
              <div className="h-60 flex items-end justify-between gap-2">
                {stats.orderTrend.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-[#EAA823] to-[#f5d547] rounded-t-lg transition-all" 
                      style={{ height: `${Math.max(item.count * 28, 12)}px` }}
                    />
                    <span className="text-[10px] text-gray-400">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 shadow-xl">
              <h3 className="text-base font-bold text-white mb-6">Revenue Inflow (Last 7 Days)</h3>
              <div className="h-60 flex items-end justify-between gap-2">
                {stats.revenueTrend.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all" 
                      style={{ height: `${Math.max(item.amount / 4000, 12)}px` }}
                    />
                    <span className="text-[10px] text-gray-400">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Recent Orders Stream</h3>
                <p className="text-xs text-gray-400">Manage order confirmations and dispatches</p>
              </div>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="text-[#EAA823] hover:bg-[#EAA823]/20 text-xs font-bold">
                  View All Orders <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">No orders recorded yet.</div>
              ) : (
                filteredOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-4 bg-[#EAA823]/5 rounded-xl hover:bg-[#EAA823]/10 transition-all border border-[#EAA823]/10 cursor-pointer group">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EAA823] to-[#f5d547] flex items-center justify-center font-black text-[#0A2E1D] text-sm">
                          {order.customer_name?.charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white group-hover:text-[#EAA823] transition-colors truncate">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-black text-white text-sm">
                            ₦{Number(order.total_amount || 0).toLocaleString()}
                          </p>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full capitalize ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'dispatched' ? 'bg-amber-500/20 text-[#EAA823]' :
                            order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#EAA823]" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <MrTellChat isOpen={mrTellOpen} onClose={() => setMrTellOpen(false)} isDarkMode />
          <MrTellButton onClick={() => setMrTellOpen(true)} isDarkMode />
        </main>
      </div>
    </div>
  )
}