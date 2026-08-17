'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingCart, LogOut, Menu, X, Bell, Search, BarChart3, TrendingUp, Package, 
  Users, Settings, ChevronRight, Plus, Edit, Trash2, Eye, MapPin, Phone,
  Star, CheckCircle, AlertCircle, Download, Filter
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Rider {
  id: string
  name: string
  email: string
  phone: string
  status: string
  deliveries_completed: number
  rating: number
  created_at: string
}

export default function RidersPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [riders, setRiders] = useState<Rider[]>([])
  const [filteredRiders, setFilteredRiders] = useState<Rider[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNotifications, setShowNotifications] = useState(false)
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
        loadRidersData()
      }
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadRidersData = async () => {
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRiders(data || [])
      setFilteredRiders(data || [])
    } catch (error) {
      console.error('[v0] Error loading riders:', error)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const filtered = riders.filter(rider =>
      rider.name.toLowerCase().includes(query.toLowerCase()) ||
      rider.email.toLowerCase().includes(query.toLowerCase()) ||
      rider.phone.includes(query)
    )
    setFilteredRiders(filtered)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    if (status === 'all') {
      setFilteredRiders(riders)
    } else {
      setFilteredRiders(riders.filter(r => r.status === status))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleDeleteRider = async (riderId: string) => {
    if (!confirm('Are you sure you want to delete this rider?')) return

    try {
      const { error } = await supabase.from('riders').delete().eq('id', riderId)
      if (error) throw error
      loadRidersData()
    } catch (error) {
      console.error('[v0] Error deleting rider:', error)
      alert('Failed to delete rider')
    }
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
    { icon: TrendingUp, label: 'Analytics', path: '/admin/sales' },
    { icon: Package, label: 'Stock', path: '/admin/stock-inventory' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: Users, label: 'Riders', path: '/admin/riders', active: true },
    { icon: Settings, label: 'Settings', path: '/admin/settings' }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-500/20 text-green-400'
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400'
      case 'on_delivery':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const stats = {
    totalRiders: riders.length,
    activeRiders: riders.filter(r => r.status === 'active').length,
    onDelivery: riders.filter(r => r.status === 'on_delivery').length,
    totalDeliveries: riders.reduce((sum, r) => sum + (r.deliveries_completed || 0), 0)
  }

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
            <h2 className="text-xl font-bold hidden md:block">Riders Management</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-[#EAA823]/10 rounded-lg px-3 py-2 flex-1 max-w-xs">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search riders..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
              />
            </div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-[#EAA823]/20 rounded-lg"
            >
              <Bell className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Delivery Riders</h1>
            <p className="text-gray-400">Manage and monitor your delivery team</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-[#EAA823]/20">
              <p className="text-gray-400 text-sm mb-2">Total Riders</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalRiders}</h3>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-green-500/20">
              <p className="text-gray-400 text-sm mb-2">Active Riders</p>
              <h3 className="text-3xl font-bold text-green-400">{stats.activeRiders}</h3>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-blue-500/20">
              <p className="text-gray-400 text-sm mb-2">On Delivery</p>
              <h3 className="text-3xl font-bold text-blue-400">{stats.onDelivery}</h3>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl p-6 border border-purple-500/20">
              <p className="text-gray-400 text-sm mb-2">Total Deliveries</p>
              <h3 className="text-3xl font-bold text-purple-400">{stats.totalDeliveries}</h3>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D]'
                  : 'bg-[#EAA823]/10 text-[#EAA823] hover:bg-[#EAA823]/20'
              }`}
            >
              All Riders
            </button>
            <button
              onClick={() => handleStatusFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusFilter('on_delivery')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'on_delivery'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              On Delivery
            </button>
            <button
              onClick={() => handleStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Riders Table */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-xl border border-[#EAA823]/20 overflow-hidden shadow-xl">
            {filteredRiders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-40" />
                <p>No riders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#EAA823]/20 bg-[#0F1419]/50">
                      <th className="px-6 py-4 text-left font-semibold text-white">Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-white">Contact</th>
                      <th className="px-6 py-4 text-left font-semibold text-white">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-white">Deliveries</th>
                      <th className="px-6 py-4 text-left font-semibold text-white">Rating</th>
                      <th className="px-6 py-4 text-center font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiders.map((rider) => (
                      <tr key={rider.id} className="border-b border-[#EAA823]/10 hover:bg-[#EAA823]/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{rider.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{rider.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{rider.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rider.status)}`}>
                            {rider.status.replace('_', ' ').charAt(0).toUpperCase() + rider.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{rider.deliveries_completed || 0}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-[#EAA823] fill-current" />
                            <span className="text-white font-medium">{rider.rating || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button variant="ghost" size="sm" className="text-[#EAA823] hover:bg-[#EAA823]/10">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRider(rider.id)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
