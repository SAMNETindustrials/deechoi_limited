'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingCart, LogOut, Menu, X, Search, BarChart3, Package, 
  Settings, Download, Eye, Trash2, Clock, 
  CheckCircle, AlertCircle, Loader2, RefreshCw, CheckCircle2, Truck, Layers, ChevronLeft, MessageSquare, Send, CreditCard, Wallet
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_city: string
  delivery_state: string
  delivery_fee?: number
  total_amount: number
  payment_method: string
  payment_proof_url?: string | null
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered_pending_confirmation' | 'completed' | 'cancelled'
  assigned_agent_id?: string | null
  assigned_agent_name?: string | null
  assigned_agent_phone?: string | null
  items: any[]
  created_at: string
}

interface Agent {
  id: string
  full_name: string
  phone: string
  wallet_balance?: number
  bank_name?: string
  account_number?: string
  account_name?: string
}

interface WithdrawalRequest {
  id: string
  agent_id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: 'pending' | 'completed'
  created_at: string
  dispatch_agents?: {
    full_name: string
    phone: string
  }
}

export default function OrdersPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTabNav, setActiveTabNav] = useState<'orders' | 'payouts'>('orders')

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])

  const [loading, setLoading] = useState(true)
  const [fetchingOrders, setFetchingOrders] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'confirmed' | 'dispatched' | 'delivered_pending_confirmation' | 'completed' | 'cancelled'>('All')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Messaging Modal State
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState<Order | null>(null)
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Dispatch Modal State
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [dispatchingOrder, setDispatchingOrder] = useState(false)

  // Processing Payout Loading State
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/admin/login')
        return
      } else {
        setUser(user)
      }
      setLoading(false)
      fetchOrders()
      fetchAgents()
      fetchWithdrawals()
    }

    checkAuthAndFetch()
  }, [router, supabase])

  const fetchOrders = async () => {
    try {
      setFetchingOrders(true)
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const orderList = data || []
      setOrders(orderList)
      filterOrdersList(searchQuery, statusFilter, orderList)
    } catch (err: any) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setFetchingOrders(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('dispatch_agents')
        .select('*')

      if (!error && data) {
        setAgents(data)
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_withdrawals')
        .select('*, dispatch_agents(full_name, phone)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setWithdrawals(data)
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err)
    }
  }

  const handleConfirmPayout = async (withdrawalId: string) => {
    if (!confirm('Are you sure you have paid this agent from your bank account? This will mark the withdrawal as completed.')) return

    setProcessingPayoutId(withdrawalId)
    try {
      const { error } = await supabase
        .from('agent_withdrawals')
        .update({ status: 'completed' })
        .eq('id', withdrawalId)

      if (error) throw error

      alert('Withdrawal request marked as completed & paid!')
      fetchWithdrawals()
    } catch (err: any) {
      alert(err.message || 'Failed to update payout status.')
    } finally {
      setProcessingPayoutId(null)
    }
  }

  const filterOrdersList = (query: string, status: string, list: Order[]) => {
    let result = [...list]

    if (status !== 'All') {
      result = result.filter((o) => o.status?.toLowerCase() === status.toLowerCase())
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_phone?.toLowerCase().includes(q) ||
          o.customer_email?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q) ||
          o.delivery_address?.toLowerCase().includes(q)
      )
    }

    setFilteredOrders(result)
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    filterOrdersList(q, statusFilter, orders)
  }

  const handleStatusFilterChange = (status: any) => {
    setStatusFilter(status)
    filterOrdersList(searchQuery, status, orders)
  }

  const openDispatchModal = (order: Order) => {
    setSelectedOrderForDispatch(order)
    setSelectedAgentId(order.assigned_agent_id || '')
    setDispatchModalOpen(true)
  }

  const handleAssignAndDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderForDispatch || !selectedAgentId) {
      alert('Please select a dispatch agent.')
      return
    }

    const chosenAgent = agents.find(a => a.id === selectedAgentId)
    if (!chosenAgent) return

    setDispatchingOrder(true)
    try {
      const { error } = await supabase
        .from('store_orders')
        .update({
          status: 'dispatched',
          assigned_agent_id: chosenAgent.id,
          assigned_agent_name: chosenAgent.full_name,
          assigned_agent_phone: chosenAgent.phone
        })
        .eq('id', selectedOrderForDispatch.id)

      if (error) throw error

      alert(`Order successfully dispatched and assigned to ${chosenAgent.full_name}!`)
      setDispatchModalOpen(false)
      setSelectedOrderForDispatch(null)
      fetchOrders()
    } catch (err: any) {
      console.error('Failed to dispatch order:', err)
      alert(err.message || 'Failed to dispatch order.')
    } finally {
      setDispatchingOrder(false)
    }
  }

  const handleQuickStatusChange = async (orderId: string, newStatus: any) => {
    try {
      const { error } = await supabase
        .from('store_orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      setOrders(updated)
      filterOrdersList(searchQuery, statusFilter, updated)
    } catch (err: any) {
      alert(err.message || 'Failed to update order status')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      const { error } = await supabase
        .from('store_orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      const updated = orders.filter((o) => o.id !== orderId)
      setOrders(updated)
      filterOrdersList(searchQuery, statusFilter, updated)
    } catch (err: any) {
      alert(err.message || 'Failed to delete order')
    }
  }

  const openMessageModal = (order: Order) => {
    setSelectedOrderForMessage(order)
    setMessageSubject(`Update regarding Order #${order.id.slice(0, 8).toUpperCase()}`)
    setMessageBody(`Hello ${order.customer_name}, \n\nWe are writing regarding your order #${order.id.slice(0, 8).toUpperCase()}. \n\n`)
    setMessageModalOpen(true)
  }

  const handleSendCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderForMessage) return

    if (!messageSubject.trim() || !messageBody.trim()) {
      alert('Please enter both a subject and message.')
      return
    }

    setSendingMessage(true)
    try {
      const customerEmail = selectedOrderForMessage.customer_email.trim().toLowerCase()

      const { error } = await supabase
        .from('customer_inquiries')
        .insert([{
          customer_email: customerEmail,
          subject: messageSubject.trim(),
          message: messageBody.trim(),
          reply: 'Message sent by Admin',
          reply_status: 'replied',
          status: 'open'
        }])

      if (error) throw error

      alert(`Success! Message sent to ${customerEmail}.`)
      setMessageModalOpen(false)
      setSelectedOrderForMessage(null)
      setMessageSubject('')
      setMessageBody('')
    } catch (err: any) {
      alert(err.message || 'Failed to send message to customer.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export.')
      return
    }

    const headers = ['Order ID', 'Customer Name', 'Phone', 'Email', 'Items Count', 'Total (NGN)', 'Status', 'Assigned Agent', 'Date']
    const rows = filteredOrders.map(o => [
      o.id,
      `"${o.customer_name || ''}"`,
      `"${o.customer_phone || ''}"`,
      `"${o.customer_email || ''}"`,
      o.items?.length || 0,
      o.total_amount || 0,
      o.status || 'pending',
      `"${o.assigned_agent_name || 'Unassigned'}"`,
      new Date(o.created_at).toLocaleString()
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `deechoi_orders_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      if (diffDays === 1) return '1 day ago'
      return `${diffDays} days ago`
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2E1D] to-[#072215]">
        <div className="w-12 h-12 border-4 border-[#EAA823]/30 border-t-[#EAA823] rounded-full animate-spin"></div>
      </div>
    )
  }

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ShoppingCart, label: 'Orders & Payouts', path: '/admin/orders', active: true },
    { icon: Layers, label: 'Products', path: '/admin/products' },
    { icon: Package, label: 'Stock & Inventory', path: '/admin/inventory' },
    { icon: Settings, label: 'Notifications & Settings', path: '/admin/settings' }
  ]

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'dispatched': return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      case 'delivered_pending_confirmation': return 'bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse'
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="h-3.5 w-3.5" />
      case 'confirmed': return <CheckCircle2 className="h-3.5 w-3.5" />
      case 'dispatched': return <Truck className="h-3.5 w-3.5 text-amber-400" />
      case 'delivered_pending_confirmation': return <CheckCircle className="h-3.5 w-3.5 text-purple-400" />
      case 'completed': return <CheckCircle className="h-3.5 w-3.5" />
      default: return <AlertCircle className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-[#1a1f2e] to-[#131821] border-r border-[#EAA823]/20 transition-all duration-300 sticky top-0 h-screen flex flex-col hidden md:flex shadow-2xl`}>
        <div className="h-20 border-b border-[#EAA823]/20 flex items-center justify-center px-4 py-4">
          <Link href="/admin/dashboard">
            <div className="relative w-12 h-12 cursor-pointer hover:opacity-85 transition-opacity">
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

            <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#EAA823] transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-[#EAA823]/10 rounded-lg px-3 py-2 flex-1 max-w-xs mx-6">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, phone, ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-gray-400 outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => { fetchOrders(); fetchWithdrawals(); }}
              title="Refresh Data"
              className="p-2 hover:bg-[#EAA823]/20 rounded-lg text-gray-400 hover:text-[#EAA823] transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${fetchingOrders ? 'animate-spin text-[#EAA823]' : ''}`} />
            </button>

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

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-[#0F1419]">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">Orders & Agent Payouts</h1>
              <p className="text-gray-400 text-sm">
                Manage live customer orders, coordinate agent dispatches, and process commission payouts.
              </p>
            </div>

            {/* Main Navigation Switch Between Orders and Payouts */}
            <div className="flex items-center bg-[#1a1f2e] p-1 rounded-xl border border-[#EAA823]/30">
              <button
                onClick={() => setActiveTabNav('orders')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTabNav === 'orders' ? 'bg-[#EAA823] text-[#0A2E1D]' : 'text-gray-300 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Store Orders ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTabNav('payouts')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 relative ${
                  activeTabNav === 'payouts' ? 'bg-[#EAA823] text-[#0A2E1D]' : 'text-gray-300 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Agent Payouts</span>
                {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">
                    {withdrawals.filter(w => w.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* =========================================================
              TAB 1: STORE ORDERS
          ========================================================== */}
          {activeTabNav === 'orders' && (
            <div>
              {/* Status Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  {(['All', 'pending', 'confirmed', 'dispatched', 'delivered_pending_confirmation', 'completed', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusFilterChange(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize border ${
                        statusFilter === st
                          ? 'bg-[#EAA823] text-[#0A2E1D] border-[#EAA823] shadow-md'
                          : 'bg-[#1a1f2e] text-gray-300 border-[#EAA823]/20 hover:bg-[#EAA823]/10'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EAA823]/30 hover:bg-[#EAA823]/10 transition-colors text-gray-300 hover:text-[#EAA823] text-xs font-bold"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Orders Table */}
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] rounded-2xl border border-[#EAA823]/20 overflow-hidden shadow-xl">
                {fetchingOrders && orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />
                    <p className="text-sm text-gray-400">Loading orders from Supabase...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-20 p-6 space-y-3">
                    <ShoppingCart className="w-12 h-12 text-gray-500 mx-auto opacity-40" />
                    <h3 className="text-lg font-bold text-gray-300">No Orders Found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {searchQuery || statusFilter !== 'All'
                        ? 'No orders match your filter criteria.'
                        : 'Customer orders placed on the storefront will appear here in real time.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#EAA823]/20 bg-[#EAA823]/5">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Order ID</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Customer</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Total Amount</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Status</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Assigned Agent</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Placed</th>
                          <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAA823]/10">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-[#EAA823]/5 transition-colors duration-150 group">
                            <td className="px-6 py-4">
                              <span className="font-mono font-bold text-xs text-[#EAA823]">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-bold text-white">{order.customer_name}</p>
                                <p className="text-xs text-gray-400">{order.customer_phone}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-black text-sm text-white">
                              ₦{Number(order.total_amount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold capitalize ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {order.status.replace(/_/g, ' ')}
                                </span>

                                {order.status === 'pending' && (
                                  <button
                                    onClick={() => handleQuickStatusChange(order.id, 'confirmed')}
                                    title="Confirm Order"
                                    className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-0.5 rounded font-bold transition-all border border-blue-500/30"
                                  >
                                    Confirm
                                  </button>
                                )}

                                {(order.status === 'confirmed' || order.status === 'pending') && (
                                  <button
                                    onClick={() => openDispatchModal(order)}
                                    title="Dispatch to Agent"
                                    className="text-xs bg-amber-500 hover:bg-amber-400 text-[#072d1d] px-2 py-0.5 rounded font-black transition-all shadow-sm flex items-center gap-1"
                                  >
                                    <Truck className="w-3.5 h-3.5" /> Dispatch
                                  </button>
                                )}

                                {order.status === 'delivered_pending_confirmation' && (
                                  <button
                                    onClick={() => handleQuickStatusChange(order.id, 'completed')}
                                    className="text-xs bg-emerald-500 hover:bg-emerald-400 text-[#072d1d] px-2.5 py-0.5 rounded font-black transition shadow"
                                  >
                                    Approve Delivery
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {order.assigned_agent_name ? (
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-medium border border-emerald-500/30">
                                  {order.assigned_agent_name}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                              {formatRelativeTime(order.created_at)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openMessageModal(order)}
                                  title="Message Customer"
                                  className="p-2 hover:bg-emerald-500/20 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </button>

                                <Link href={`/admin/orders/${order.id}`}>
                                  <button 
                                    title="View Order Details"
                                    className="p-2 hover:bg-[#EAA823]/20 rounded-lg text-gray-400 hover:text-[#EAA823] transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </Link>
                                
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  title="Delete Order"
                                  className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: AGENT PAYOUTS & WITHDRAWALS
          ========================================================== */}
          {activeTabNav === 'payouts' && (
            <div className="space-y-6">
              <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-[#EAA823]/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-[#EAA823]" /> Agent Withdrawal Requests
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Review bank account details submitted by dispatch agents and confirm payouts when completed.
                    </p>
                  </div>
                  <button
                    onClick={fetchWithdrawals}
                    className="text-xs bg-[#EAA823]/10 text-[#EAA823] border border-[#EAA823]/30 px-3 py-1.5 rounded-lg font-bold hover:bg-[#EAA823]/20 transition"
                  >
                    Refresh List
                  </button>
                </div>

                {withdrawals.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-sm">
                    No withdrawal requests submitted by agents yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#EAA823]/20 bg-[#EAA823]/5">
                          <th className="px-4 py-3 text-xs font-bold uppercase text-gray-300">Agent Name</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-gray-300">Amount (NGN)</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-gray-300">Bank Details</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-gray-300">Status</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-gray-300">Date</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-300">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAA823]/10 text-xs">
                        {withdrawals.map((item) => (
                          <tr key={item.id} className="hover:bg-[#EAA823]/5">
                            <td className="px-4 py-3 font-bold text-white">
                              {item.dispatch_agents?.full_name || 'Unknown Agent'}
                              <p className="text-[10px] text-gray-400">{item.dispatch_agents?.phone}</p>
                            </td>
                            <td className="px-4 py-3 font-black text-[#EAA823] text-sm">
                              ₦{Number(item.amount).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-300">
                              <p><span className="text-gray-500">Bank:</span> <strong className="text-white">{item.bank_name}</strong></p>
                              <p><span className="text-gray-500">Acct:</span> <strong className="font-mono text-white">{item.account_number}</strong></p>
                              <p><span className="text-gray-500">Name:</span> <strong className="text-white">{item.account_name}</strong></p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded font-bold uppercase text-[10px] ${
                                item.status === 'completed'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400">
                              {new Date(item.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.status === 'pending' ? (
                                <button
                                  onClick={() => handleConfirmPayout(item.id)}
                                  disabled={processingPayoutId === item.id}
                                  className="bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-black px-3 py-1.5 rounded-lg shadow hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1 ml-auto"
                                >
                                  {processingPayoutId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Paid</span>}
                                </button>
                              ) : (
                                <span className="text-green-400 font-bold flex items-center gap-1 justify-end">
                                  <CheckCircle className="w-4 h-4" /> Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================
          DISPATCH MODAL (SELECT AGENT)
      ========================================================== */}
      {dispatchModalOpen && selectedOrderForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] border border-[#EAA823]/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAA823]/20 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" /> Assign & Dispatch Order
              </h3>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-[#EAA823]/20 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignAndDispatch} className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  Order ID: <span className="font-mono text-[#EAA823]">#{selectedOrderForDispatch.id.slice(0, 8).toUpperCase()}</span>
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Customer: <span className="text-white font-semibold">{selectedOrderForDispatch.customer_name}</span> ({selectedOrderForDispatch.customer_phone})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Select Dispatch Agent</label>
                {agents.length === 0 ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                    No active agents found.
                  </div>
                ) : (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    required
                    className="w-full bg-[#0F1419] border border-[#EAA823]/30 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#EAA823] outline-none"
                  >
                    <option value="">-- Choose Agent --</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.full_name} ({ag.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAA823]/20">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchingOrder || agents.length === 0}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#072d1d] font-black text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {dispatchingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  <span>Forward to Agent</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          ADMIN MESSAGE MODAL
      ========================================================== */}
      {messageModalOpen && selectedOrderForMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] border border-[#EAA823]/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAA823]/20 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#EAA823]" /> Message Customer
              </h3>
              <button
                onClick={() => setMessageModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-[#EAA823]/20 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCustomerMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">To Customer Email</label>
                <input
                  type="text"
                  disabled
                  value={selectedOrderForMessage.customer_email}
                  className="w-full bg-[#0F1419] border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  required
                  className="w-full bg-[#0F1419] border border-[#EAA823]/30 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#EAA823]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Message Body</label>
                <textarea
                  rows={5}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  required
                  className="w-full bg-[#0F1419] border border-[#EAA823]/30 rounded-xl p-3 text-sm text-white outline-none focus:border-[#EAA823]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAA823]/20">
                <button
                  type="button"
                  onClick={() => setMessageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-black text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}