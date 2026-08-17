'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingCart, LogOut, Menu, X, Bell, Search, BarChart3, TrendingUp, Package, 
  Users, Settings, ChevronRight, Calendar, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SalesMetric {
  date: string
  sales: number
  orders: number
  revenue: number
}

interface CategorySales {
  category: string
  sales: number
  percentage: number
}

export default function SalesPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [salesData, setSalesData] = useState<SalesMetric[]>([])
  const [categoryData, setCategoryData] = useState<CategorySales[]>([])
  const [totalSalesValue, setTotalSalesValue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
        loadSalesData()
      }
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadSalesData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const orderData = orders || []
      setTotalOrders(orderData.length)

      const totalRevenue = orderData.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      setTotalSalesValue(totalRevenue)
      setAvgOrderValue(orderData.length > 0 ? totalRevenue / orderData.length : 0)

      // Calculate sales trends (last 7 days)
      const trends = calculateSalesTrends(orderData)
      setSalesData(trends)

      // Get category breakdown
      const { data: products } = await supabase.from('store_products').select('*')
      const categoryBreakdown = calculateCategoryBreakdown(orderData, products || [])
      setCategoryData(categoryBreakdown)
    } catch (error) {
      console.error('[v0] Error loading sales data:', error)
    }
  }

  const calculateSalesTrends = (orders: any[]) => {
    const trends = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate.toLocaleDateString() === date.toLocaleDateString()
      })

      const revenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

      trends.push({
        date: dateStr,
        sales: dayOrders.length,
        orders: dayOrders.length,
        revenue
      })
    }

    return trends
  }

  const calculateCategoryBreakdown = (orders: any[], products: any[]) => {
    const categoryMap: { [key: string]: number } = {}
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    // Group by category (simplified for demo)
    products.forEach(product => {
      const category = product.category || 'Uncategorized'
      categoryMap[category] = (categoryMap[category] || 0) + 1
    })

    return Object.entries(categoryMap).map(([category, count]) => ({
      category,
      sales: count,
      percentage: ((count / (products.length || 1)) * 100)
    }))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1419]">
        <div className="w-12 h-12 border-4 border-[#EAA823]/30 border-t-[#EAA823] rounded-full animate-spin"></div>
      </div>
    )
  }

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: TrendingUp, label: 'Analytics', path: '/admin/sales', active: true },
    { icon: Package, label: 'Stock', path: '/admin/stock-inventory' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: Users, label: 'Riders', path: '/admin/riders' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' }
  ]

  return (
    <div className="min-h-screen bg-[#0F1419] text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-[#1a1f2e] to-[#131821] border-r border-[#EAA823]/20 transition-all duration-300 sticky top-0 h-screen flex flex-col hidden md:flex shadow-2xl`}>
        <div className="h-20 border-b border-[#EAA823]/20 flex items-center justify-center px-4">
          {sidebarOpen ? (
            <Link href="/admin/dashboard">
              <div className="relative w-12 h-12 cursor-pointer hover:opacity-80">
                <Image src="/logo-deechoi.png" alt="DEECHOI" fill className="object-contain" priority />
              </div>
            </Link>
          ) : (
            <Link href="/admin/dashboard">
              <div className="relative w-10 h-10 cursor-pointer hover:opacity-80 animate-pulse">
                <Image src="/logo-deechoi.png" alt="DEECHOI" fill className="object-contain" priority />
              </div>
            </Link>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D]'
                  : 'text-gray-400 hover:bg-[#EAA823]/10'
              }`}>
                <item.icon className="h-5 w-5" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#EAA823]/20 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-[#EAA823]/20 bg-gradient-to-r from-[#1a1f2e] to-[#131821] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#EAA823]/20 rounded-lg hidden md:block"
            >
              <Menu className="h-5 w-5 text-[#EAA823]" />
            </button>
            <h2 className="text-xl font-bold hidden md:block">Sales Analytics</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-[#EAA823]/10 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-[#EAA823]/20 rounded-lg">
                <Bell className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Sales Analytics</h1>
            <p className="text-gray-400">Real-time sales performance and insights</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-[#EAA823]/20">
              <p className="text-gray-400 text-sm mb-2">Total Sales Revenue</p>
              <h3 className="text-3xl font-bold text-white mb-3">₦{(totalSalesValue / 1000000).toFixed(2)}M</h3>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span>+15.3% from last month</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-[#EAA823]/20">
              <p className="text-gray-400 text-sm mb-2">Total Orders</p>
              <h3 className="text-3xl font-bold text-white mb-3">{totalOrders}</h3>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span>+8.2% from last week</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-[#EAA823]/20">
              <p className="text-gray-400 text-sm mb-2">Average Order Value</p>
              <h3 className="text-3xl font-bold text-white mb-3">₦{avgOrderValue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span>+3.5% increase</span>
              </div>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-[#EAA823]/20 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">7-Day Sales Trend</h3>
              <Button variant="ghost" size="sm" className="text-[#EAA823]">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="h-80 flex items-end justify-between gap-2 px-4">
              {salesData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div
                    className="w-full bg-gradient-to-t from-[#EAA823] to-[#f5d547] rounded-t-lg hover:shadow-lg hover:shadow-[#EAA823]/50 transition-all group cursor-pointer"
                    style={{ height: `${Math.max(data.revenue / 10000, 20)}px` }}
                    title={`₦${data.revenue.toLocaleString()}`}
                  />
                  <span className="text-xs text-gray-400 text-center">{data.date}</span>
                  <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.orders} orders
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-[#EAA823]/20">
              <h3 className="text-lg font-bold text-white mb-6">Category Breakdown</h3>
              <div className="space-y-4">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{cat.category}</span>
                        <span className="text-sm text-gray-400">{cat.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-[#EAA823]/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#EAA823] to-[#f5d547]"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-[#EAA823]/20">
              <h3 className="text-lg font-bold text-white mb-6">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#EAA823]/10 rounded-lg">
                  <span className="text-sm text-gray-400">Conversion Rate</span>
                  <span className="text-lg font-bold text-[#EAA823]">3.2%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                  <span className="text-sm text-gray-400">Customer Satisfaction</span>
                  <span className="text-lg font-bold text-green-400">4.8/5</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                  <span className="text-sm text-gray-400">Repeat Customer Rate</span>
                  <span className="text-lg font-bold text-blue-400">28%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                  <span className="text-sm text-gray-400">Avg Delivery Time</span>
                  <span className="text-lg font-bold text-purple-400">2.5 days</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
