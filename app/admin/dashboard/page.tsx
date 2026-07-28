'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Package, BarChart3, LogOut, ShoppingCart, Users, TrendingUp, Bell, Settings, Menu } from 'lucide-react'

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
    pendingOrders: 0
  })
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
        loadDashboardStats()
      }
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          completedOrders: data.completedOrders || 0,
          pendingOrders: data.pendingOrders || 0
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: TrendingUp, label: 'Sales Analytics', path: '/admin/sales' },
    { icon: Package, label: 'Store Inventory', path: '/admin/store-inventory' },
    { icon: Users, label: 'Riders', path: '/admin/riders' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' }
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 sticky top-0 h-screen flex flex-col`}>
        {/* Logo */}
        <div className="h-16 border-b border-border flex items-center justify-center px-4">
          {sidebarOpen ? (
            <h1 className="font-bold text-lg text-primary">🍲 DEECHOI</h1>
          ) : (
            <span className="text-2xl">🍲</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your business today</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">All time</p>
            </Card>

            {/* Total Revenue */}
            <Card className="p-6 border-l-4 border-l-accent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-foreground">₦{(stats.totalRevenue).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">All time</p>
            </Card>

            {/* Completed Orders */}
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed Orders</p>
                  <p className="text-3xl font-bold text-foreground">{stats.completedOrders}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Package className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Delivered</p>
            </Card>

            {/* Pending Orders */}
            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pendingOrders}</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Awaiting action</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Recent Orders</h3>
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/orders')}>
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-foreground">Order #{1000 + i}</p>
                      <p className="text-xs text-muted-foreground">Customer ordered</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₦5,500</p>
                      <p className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Pending</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">Quick Links</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push('/admin/store-inventory')}
                >
                  <Package className="h-4 w-4" />
                  Manage Products
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push('/admin/orders')}
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push('/admin/riders')}
                >
                  <Users className="h-4 w-4" />
                  Manage Riders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push('/admin/sales')}
                >
                  <TrendingUp className="h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
