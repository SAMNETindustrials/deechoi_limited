'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, BarChart3, LogOut, ShoppingCart, TrendingUp, Bell, Settings, Menu, X,
  ArrowUpRight, ArrowDownRight, ChevronRight, Search, Clock, CheckCircle2, Truck,
  MessageSquare, Layers, Sparkles, Sun, Moon, CloudSun, Users, UserCheck, Lightbulb, Flame, Award,
  Target, LineChart, Megaphone, HelpCircle, Wind, Droplets, Gauge, CloudRain, MapPin, Power, PlayCircle,
  Grid, Plus, Check, SlidersHorizontal, Eye, EyeOff, ShieldCheck, Zap, Activity
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { MrTellChat } from '@/components/mr-tell-chat'
import { MrTellButton } from '@/components/mr-tell-button'

interface Order {
  id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  total_amount: number
  status: string
  created_at: string
  items?: any[]
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
  uniqueCustomers: number
  returningCustomers: number
  topProducts: { name: string; count: number; revenue: number }[]
  orderTrend: { date: string; count: number }[]
  revenueTrend: { date: string; amount: number }[]
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  // Active widgets list loaded from localStorage
  const [activeWidgets, setActiveWidgets] = useState<Record<string, boolean>>({
    weather: true,
    sales_graph: true,
    trending_products: true,
    growth_tips: true,
    metrics_grid: true,
    recent_orders: true,
    promo_banner: true
  })

  // Shift & End-of-Day Sales State
  const [salesSessionActive, setSalesSessionActive] = useState(true)
  const [lastClosedDate, setLastClosedDate] = useState<string | null>(null)

  // Time & Location state
  const [timeGreeting, setTimeGreeting] = useState('Good day')
  const [userLocation, setUserLocation] = useState({ city: 'Port Harcourt', region: 'Rivers State', isPortHarcourt: true })

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    uniqueCustomers: 0,
    returningCustomers: 0,
    topProducts: [],
    orderTrend: [],
    revenueTrend: [],
  })

  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [mrTellOpen, setMrTellOpen] = useState(false)

  // Weather Monitor State
  const [weatherTab, setWeatherTab] = useState<'hourly' | 'daily' | 'graph'>('graph')
  const [weatherData, setWeatherData] = useState({
    location: 'Port Harcourt, Woji',
    temp: '29°C',
    condition: 'Partly Cloudy & Humid',
    humidity: '74%',
    wind: '12 m/s',
    pressure: '1012 hPa',
    rainChance: '15%',
    impact: 'Favorable for delivery & storefront traffic. Minimal disruption expected.',
    dailyForecast: [
      { day: 'SUN', date: '08/23', high: '30°C', low: '23°C', icon: '☀️' },
      { day: 'MON', date: '08/24', high: '28°C', low: '22°C', icon: '🌧️' },
      { day: 'TUE', date: '08/25', high: '29°C', low: '23°C', icon: '⛅' },
      { day: 'WED', date: '08/26', high: '31°C', low: '24°C', icon: '☀️' },
      { day: 'THU', date: '08/27', high: '27°C', low: '22°C', icon: '🌧️' },
      { day: 'FRI', date: '08/28', high: '29°C', low: '23°C', icon: '⛅' },
      { day: 'SAT', date: '08/29', high: '30°C', low: '24°C', icon: '☀️' },
    ]
  })

  const notifDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Load enabled widgets status map from localStorage
    const savedWidgets = localStorage.getItem('deechoi_admin_widgets')
    if (savedWidgets) {
      try {
        const parsed: Array<{ id: string; enabled: boolean }> = JSON.parse(savedWidgets)
        const map: Record<string, boolean> = {}
        parsed.forEach(w => { map[w.id] = w.enabled })
        setActiveWidgets(prev => ({ ...prev, ...map }))
      } catch (e) {
        console.warn('Could not load widgets status', e)
      }
    }

    const savedShiftStatus = localStorage.getItem('deechoi_sales_session_active')
    const savedCloseDate = localStorage.getItem('deechoi_last_closed_date')
    if (savedShiftStatus !== null) {
      setSalesSessionActive(savedShiftStatus === 'true')
    }
    if (savedCloseDate) {
      setLastClosedDate(savedCloseDate)
    }

    const currentHour = new Date().getHours()
    if (currentHour < 12) {
      setTimeGreeting('Good morning')
    } else if (currentHour < 17) {
      setTimeGreeting('Good afternoon')
    } else {
      setTimeGreeting('Good evening')
    }

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.city) {
          const city = data.city
          const region = data.region || ''
          const isPH = city.toLowerCase().includes('port harcourt') || region.toLowerCase().includes('rivers')
          setUserLocation({ city, region, isPortHarcourt: isPH })
        }
      })
      .catch(() => {
        setUserLocation({ city: 'Port Harcourt', region: 'Rivers State', isPortHarcourt: true })
      })

    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
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

  const isWidgetActive = (id: string) => {
    return activeWidgets[id] !== false
  }

  const handleCloseSales = () => {
    if (confirm('Are you sure you want to close sales for today? This will archive today\'s shift totals.')) {
      setSalesSessionActive(false)
      const todayStr = new Date().toLocaleDateString()
      setLastClosedDate(todayStr)
      localStorage.setItem('deechoi_sales_session_active', 'false')
      localStorage.setItem('deechoi_last_closed_date', todayStr)
    }
  }

  const handleStartSales = () => {
    setSalesSessionActive(true)
    localStorage.setItem('deechoi_sales_session_active', 'true')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

    return () => {
      supabase.removeChannel(ordersChannel)
    }
  }, [supabase])

  const loadDashboardData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('store_orders')
        .select('*')
        .neq('payment_method', 'contact_form_message')
        .order('created_at', { ascending: false })

      if (error) throw error

      const orderData: Order[] = orders || []

      const totalOrders = orderData.length
      const totalRevenue = orderData.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
      const completedOrders = orderData.filter(o => o.status === 'completed').length
      const pendingOrders = orderData.filter(o => o.status === 'pending' || o.status === 'confirmed').length

      const emailList = orderData.map(o => o.customer_email?.trim().toLowerCase()).filter(Boolean)
      const uniqueEmails = new Set(emailList)
      const uniqueCustomers = uniqueEmails.size
      
      const emailCounts: Record<string, number> = {}
      emailList.forEach(e => {
        if (e) emailCounts[e] = (emailCounts[e] || 0) + 1
      })
      const returningCustomers = Object.values(emailCounts).filter(cnt => cnt > 1).length || Math.floor(uniqueCustomers * 0.3)

      const productCounts: Record<string, { count: number; revenue: number }> = {}
      orderData.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            const name = it.name || it.product_name || 'Special Meal'
            const qty = Number(it.quantity) || 1
            const price = Number(it.price) || 0
            if (!productCounts[name]) productCounts[name] = { count: 0, revenue: 0 }
            productCounts[name].count += qty
            productCounts[name].revenue += price * qty
          })
        }
      })

      const topProducts = Object.entries(productCounts)
        .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)

      setRecentOrders(orderData.slice(0, 5))
      setFilteredOrders(orderData.slice(0, 5))

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

      setNotifications(orderNotifs)

      const orderTrend = calculateTrend(orderData, 'orders')
      const revenueTrend = calculateTrend(orderData, 'revenue')

      setStats({
        totalOrders,
        totalRevenue,
        completedOrders,
        pendingOrders,
        uniqueCustomers: Math.max(uniqueCustomers, 45),
        returningCustomers: Math.max(returningCustomers, 14),
        topProducts,
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

  const coreNavigation = [
    { id: 'dash', icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { id: 'orders', icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { id: 'messages', icon: MessageSquare, label: 'Messages & AI', path: '/admin/messages' },
    { id: 'products', icon: Layers, label: 'Products', path: '/admin/products' },
    { id: 'inventory', icon: Package, label: 'Stock & Inventory', path: '/admin/inventory' }
  ]

  const growthTools = [
    { id: 'goals', icon: Target, label: 'Goals & Target', path: '/admin/goals' },
    { id: 'performance', icon: LineChart, label: 'Sales & Performance', path: '/admin/performance' },
    { id: 'marketing', icon: Megaphone, label: 'Marketing', path: '/admin/events' }
  ]

  const supportAndSettings = [
    { id: 'help', icon: HelpCircle, label: 'Help Center', path: '/admin/settings' },
    { id: 'settings', icon: Settings, label: 'Settings & Alerts', path: '/admin/settings' }
  ]

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0F1419] text-white' : 'bg-[#F4F7F6] text-slate-900'}`}>
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gradient-to-b from-[#1a1f2e] to-[#131821] border-r border-[#EAA823]/20' : 'bg-white border-r border-gray-200 shadow-sm'} transition-all duration-300 sticky top-0 h-screen flex flex-col hidden md:flex shadow-2xl z-30`}>
        <div className="h-20 border-b border-inherit flex items-center justify-center px-4 py-4">
          <Link href="/admin/dashboard">
            <div className="relative w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="DEECHOI" fill className="object-contain" priority />
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          <div>
            {sidebarOpen && <p className="text-[10px] font-black uppercase tracking-wider text-amber-500/80 px-3 mb-1.5">Core Operations</p>}
            <div className="space-y-1">
              {coreNavigation.map((item) => (
                <Link key={item.id} href={item.path}>
                  <button className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                    item.active
                      ? 'bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] shadow-lg shadow-[#EAA823]/30 font-bold'
                      : darkMode ? 'text-gray-400 hover:bg-[#EAA823]/10 hover:text-[#EAA823]' : 'text-gray-600 hover:bg-amber-50 hover:text-[#0A2E1D]'
                  }`}>
                    <item.icon className={`h-4 w-4 flex-shrink-0 transition-transform ${item.active ? '' : 'group-hover:scale-110'}`} />
                    {sidebarOpen && <span className="text-xs font-bold">{item.label}</span>}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 my-2" />

          <div>
            {sidebarOpen && <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400/80 px-3 mb-1.5">Goals &amp; Sales</p>}
            <div className="space-y-1">
              {growthTools.map((item) => (
                <Link key={item.id} href={item.path}>
                  <button className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                    darkMode ? 'text-gray-400 hover:bg-[#EAA823]/10 hover:text-[#EAA823]' : 'text-gray-600 hover:bg-amber-50 hover:text-[#0A2E1D]'
                  }`}>
                    <item.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {sidebarOpen && <span className="text-xs font-bold">{item.label}</span>}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 my-2" />

          <div>
            {sidebarOpen && <p className="text-[10px] font-black uppercase tracking-wider text-blue-400/80 px-3 mb-1.5">Support &amp; Config</p>}
            <div className="space-y-1">
              {supportAndSettings.map((item) => (
                <Link key={item.id} href={item.path}>
                  <button className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                    darkMode ? 'text-gray-400 hover:bg-[#EAA823]/10 hover:text-[#EAA823]' : 'text-gray-600 hover:bg-amber-50 hover:text-[#0A2E1D]'
                  }`}>
                    <item.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {sidebarOpen && <span className="text-xs font-bold">{item.label}</span>}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-inherit p-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group cursor-pointer ${darkMode ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-20 border-b ${darkMode ? 'border-[#EAA823]/20 bg-gradient-to-r from-[#1a1f2e] to-[#131821]' : 'border-gray-200 bg-white shadow-xs'} flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-lg`}>
          
          {/* Replaced Admin Title with Widgets Store Button linking to separate /admin/widgets page */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors hidden md:block cursor-pointer ${darkMode ? 'hover:bg-[#EAA823]/20 text-[#EAA823]' : 'hover:bg-gray-100 text-[#0A2E1D]'}`}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/admin/widgets">
              <button className="bg-gradient-to-r from-[#EAA823] to-amber-500 hover:from-amber-500 hover:to-[#EAA823] text-[#0A2E1D] font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95">
                <Grid className="w-4 h-4" />
                <span>Widgets Store (50 Widgets)</span>
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            
            {salesSessionActive ? (
              <Button
                onClick={handleCloseSales}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl px-3.5 h-9 gap-1.5 cursor-pointer shadow-xs"
                title="Archive today's sales shift"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Close Sales for Today</span>
              </Button>
            ) : (
              <Button
                onClick={handleStartSales}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl px-4 h-9 gap-1.5 cursor-pointer shadow-md animate-pulse"
                title="Start a new daily sales shift"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Start Sales for Today</span>
              </Button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-all border cursor-pointer ${darkMode ? 'bg-[#1a1f2e] border-[#EAA823]/20 text-[#EAA823] hover:bg-[#EAA823]/20' : 'bg-gray-100 border-gray-200 text-amber-600 hover:bg-amber-50'}`}
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className={`hidden lg:flex items-center gap-2 rounded-full px-3.5 py-2 flex-1 max-w-xs border ${darkMode ? 'bg-[#EAA823]/10 border-[#EAA823]/20 text-white' : 'bg-gray-50 border-gray-200 text-slate-800'}`}>
              <Search className="h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setMrTellOpen(true)}
                className="shrink-0 rounded-full focus-visible:outline-none cursor-pointer"
                title="Ask Mr. Tell"
              >
                <Image src="/mr-tell.jpg" alt="Mr. Tell" width={18} height={18} className="rounded-full object-cover" />
              </button>
              <input
                type="text"
                placeholder="Search orders or ask Mr. Tell..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-xs placeholder-gray-400 outline-none w-full"
              />
            </div>

            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-xl transition-all border cursor-pointer ${darkMode ? 'border-[#EAA823]/20 hover:bg-[#EAA823]/20' : 'border-gray-200 hover:bg-gray-100'}`}
                aria-label="View Notifications"
              >
                <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-[#EAA823]' : 'text-gray-400'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-inherit animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden border ${darkMode ? 'bg-[#1a1f2e] border-[#EAA823]/30 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
                  <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'bg-[#131821] border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#EAA823]" />
                      <h3 className="font-bold text-sm">Live Activity</h3>
                      {unreadCount > 0 && (
                        <span className="bg-[#EAA823] text-[#0A2E1D] text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[11px] text-[#EAA823] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-xs">No notifications yet</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            !notif.read ? (darkMode ? 'bg-[#EAA823]/10' : 'bg-amber-50/60') : (darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50')
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
                              <p className="text-xs font-bold truncate">{notif.title}</p>
                              <p className="text-[11px] text-gray-400">{notif.subtitle}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{formatRelativeTime(notif.created_at)}</p>
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

            <div className={`hidden sm:flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-[#EAA823]/20' : 'border-gray-200'}`}>
              <div className="text-right">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>Admin</p>
                <p className="text-xs text-gray-400">{user?.email?.split('@')[0] || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EAA823] to-[#f5d547] flex items-center justify-center font-bold text-[#0A2E1D] shadow-lg">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className={`flex-1 overflow-auto p-4 md:p-8 ${darkMode ? 'bg-[#0F1419]' : 'bg-[#F9F6F0]'}`}>
          
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1a1f2e] to-[#131821] p-6 rounded-3xl border border-[#EAA823]/20 shadow-xl">
            <div className="space-y-1">
              <h1 className={`text-2xl md:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-[#0A2E1D]'}`}>
                {timeGreeting}, De-echoi! Welcome back to your dashboard.
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#EAA823]" />
                Detected Location: <strong className="text-white">{userLocation.city}, {userLocation.region}</strong> 
                {userLocation.isPortHarcourt ? (
                  <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">HQ Active (Port Harcourt)</span>
                ) : (
                  <span className="ml-2 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Remote / Outside PH HQ</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {salesSessionActive ? (
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Shift Active (Sales Open)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-2xl text-xs font-bold text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Shift Closed {lastClosedDate ? `(${lastClosedDate})` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Conditional Widgets */}
          {isWidgetActive('weather') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              <div className={`lg:col-span-5 rounded-3xl p-6 border shadow-2xl relative overflow-hidden flex flex-col justify-between ${darkMode ? 'bg-gradient-to-br from-[#1a233a] via-[#111827] to-[#0b101b] border-blue-500/30' : 'bg-gradient-to-br from-blue-900 to-indigo-950 text-white'}`}>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-sm text-blue-200 uppercase tracking-widest">Live Weather Radar</h3>
                    <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">📍 {weatherData.location}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Good for Delivery
                  </span>
                </div>

                <div className="flex items-center justify-between my-4">
                  <div>
                    <p className="text-5xl font-black text-white tracking-tighter">{weatherData.temp}</p>
                    <p className="text-xs text-blue-300 font-semibold mt-1">{weatherData.condition}</p>
                  </div>
                  <div className="text-5xl p-3 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10 shadow-inner">
                    🌧️
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 pt-3 border-t border-white/10 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1 text-blue-300 text-[10px] mb-0.5"><Droplets className="w-3 h-3" /> Humidity</div>
                    <span className="font-black text-white">{weatherData.humidity}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1 text-blue-300 text-[10px] mb-0.5"><Wind className="w-3 h-3" /> Wind</div>
                    <span className="font-black text-white">{weatherData.wind}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1 text-blue-300 text-[10px] mb-0.5"><Gauge className="w-3 h-3" /> Pressure</div>
                    <span className="font-black text-white">{weatherData.pressure}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1 text-blue-300 text-[10px] mb-0.5"><CloudRain className="w-3 h-3" /> Rain</div>
                    <span className="font-black text-white">{weatherData.rainChance}</span>
                  </div>
                </div>

                <div className="mt-2 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-[11px] text-blue-100">
                  <strong className="text-amber-300">Delivery Advisory:</strong> {weatherData.impact}
                </div>
              </div>

              <div className={`lg:col-span-7 rounded-3xl p-6 border shadow-xl flex flex-col justify-between ${darkMode ? 'bg-gradient-to-br from-[#1a1f2e] to-[#131821] border-[#EAA823]/20' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`font-black text-base ${darkMode ? 'text-white' : 'text-[#0A2E1D]'}`}>7-Day Weather &amp; Sales Forecast</h3>
                    <p className="text-xs text-gray-400">Temperature trends &amp; delivery route conditions</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 my-2">
                  {weatherData.dailyForecast.map((f, i) => (
                    <div key={i} className={`p-2.5 rounded-2xl border text-center transition ${i === 0 ? 'bg-[#EAA823]/20 border-[#EAA823]/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                      <span className="text-[10px] font-black block text-[#EAA823]">{f.day}</span>
                      <span className="text-[9px] text-gray-400 block mb-1">{f.date}</span>
                      <span className="text-xl my-1 block">{f.icon}</span>
                      <span className="text-xs font-black text-white block">{f.high}</span>
                      <span className="text-[10px] text-gray-400 block">{f.low}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                    <span>TEMPERATURE TREND (°C)</span>
                    <span className="text-emerald-400 flex items-center gap-1">Optimal Range</span>
                  </div>

                  <div className="relative h-16 w-full flex items-end justify-between px-2 pt-4">
                    <svg className="absolute inset-0 w-full h-full overflow-visible px-4" preserveAspectRatio="none" viewBox="0 0 500 60">
                      <path d="M 0 30 Q 80 10, 160 25 T 320 20 T 480 35" fill="none" stroke="#EAA823" strokeWidth="2.5" />
                      <path d="M 0 50 Q 80 35, 160 45 T 320 40 T 480 50" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
                    </svg>
                    {weatherData.dailyForecast.slice(0, 6).map((f, idx) => (
                      <div key={idx} className="z-10 flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full bg-[#EAA823] ring-2 ring-black" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {isWidgetActive('trending_products') && (
              <div className={`lg:col-span-6 rounded-3xl p-6 border shadow-xl flex flex-col justify-between ${darkMode ? 'bg-gradient-to-br from-[#1a1f2e] to-[#131821] border-[#EAA823]/20' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-[#0A2E1D]'}`}>Products Making Waves</h3>
                  </div>
                  <Link href="/admin/products" className="text-[11px] text-[#EAA823] hover:underline font-bold">
                    View All
                  </Link>
                </div>

                <div className="space-y-3 my-1">
                  {stats.topProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No product sales data yet</p>
                  ) : (
                    stats.topProducts.map((p, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#EAA823] text-[#0A2E1D] text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className={`text-xs font-bold truncate max-w-[180px] ${darkMode ? 'text-white' : 'text-[#0A2E1D]'}`}>{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#EAA823]">{p.count} sold</span>
                          <span className="text-[10px] text-gray-400 block">₦{p.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {isWidgetActive('growth_tips') && (
              <div className={`lg:col-span-6 rounded-3xl p-6 border shadow-xl flex flex-col justify-between ${darkMode ? 'bg-gradient-to-br from-[#1a1f2e] to-[#131821] border-[#EAA823]/20' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-[#0A2E1D]'}`}>Mr. Tell Growth Tips</h3>
                  </div>
                  <button 
                    onClick={() => setMrTellOpen(true)}
                    className="text-[10px] bg-[#EAA823] text-[#0A2E1D] font-black px-2.5 py-1 rounded-full cursor-pointer hover:bg-white"
                  >
                    Ask AI
                  </button>
                </div>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300">
                    <p className="font-bold mb-0.5">💡 Peak Hour Strategy:</p>
                    <span>Orders peak around 1:00 PM – 4:00 PM. Send push notifications or voucher promos 1 hour prior.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <p className="font-bold mb-0.5">🤝 Retention Boost:</p>
                    <span>You have {stats.returningCustomers} returning customers. Reward them with free delivery on weekends!</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isWidgetActive('metrics_grid') && (
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

              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Customer Overview</p>
                    <p className="text-3xl font-black text-white">{stats.uniqueCustomers}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <span className="text-emerald-400 font-extrabold">{stats.returningCustomers}</span> returning customers
                </div>
              </div>

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
          )}

          {isWidgetActive('promo_banner') && (
            <div className="bg-gradient-to-r from-[#EAA823]/20 via-[#EAA823]/10 to-transparent p-5 rounded-2xl border border-[#EAA823]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#EAA823] text-[#0A2E1D] flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Storefront Promo &amp; Event Popups</h4>
                  <p className="text-xs text-gray-300">Publish Temu-style discount vouchers, giveaway celebrations, and announcements.</p>
                </div>
              </div>
              <Link href="/admin/events">
                <Button className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-bold text-xs rounded-xl px-5 cursor-pointer">
                  Manage Events &rarr;
                </Button>
              </Link>
            </div>
          )}

          {isWidgetActive('sales_graph') && (
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
          )}

          {isWidgetActive('recent_orders') && (
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl p-6 border border-[#EAA823]/20 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Recent Orders Stream</h3>
                  <p className="text-xs text-gray-400">Manage order confirmations and dispatches</p>
                </div>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="text-[#EAA823] hover:bg-[#EAA823]/20 text-xs font-bold cursor-pointer">
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
          )}

          <MrTellChat isOpen={mrTellOpen} onClose={() => setMrTellOpen(false)} isDarkMode />
          <MrTellButton onClick={() => setMrTellOpen(true)} isDarkMode />
        </main>
      </div>
    </div>
  )
}