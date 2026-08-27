'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Phone, User, Truck, LogOut, MapPin, Loader2, Wallet, 
  CreditCard, CheckCircle2, Eye, X, Package, LayoutDashboard, 
  Map as MapIcon, Clock, CheckCircle, Settings, HelpCircle, Bell, Search
} from 'lucide-react'

interface Agent {
  id: string
  full_name: string
  phone: string
  wallet_balance?: number
  bank_name?: string
  account_number?: string
  account_name?: string
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  delivery_city?: string
  delivery_state?: string
  total_amount: number
  delivery_fee?: number
  payment_method?: string
  items: any[]
  status: string
  assigned_agent_id: string
  created_at?: string
  lat?: number
  lng?: number
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
}

export default function AgentDashboard() {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const [fullNameInput, setFullNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [loadingAuth, setLoadingAuth] = useState(false)

  const [orders, setOrders] = useState<Order[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'dispatches' | 'wallet' | 'settings' | 'help'>('dashboard')
  
  // Tracking & Search state
  const [trackingInput, setTrackingInput] = useState('')
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null)

  const [agentPhoneReceiver, setAgentPhoneReceiver] = useState('')
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  // Order Details Modal State
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)

  // Bank & Wallet Settings form state
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [savingBank, setSavingBank] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const savedAgent = localStorage.getItem('deechoi_dispatch_agent')
    if (savedAgent) {
      try {
        const agentObj = JSON.parse(savedAgent)
        setCurrentAgent(agentObj)
        setAgentPhoneReceiver(agentObj.phone)
        setBankName(agentObj.bank_name || '')
        setAccountNumber(agentObj.account_number || '')
        setAccountName(agentObj.account_name || '')
        fetchAgentData(agentObj.id)
      } catch {
        localStorage.removeItem('deechoi_dispatch_agent')
      }
    }
  }, [])

  // Real-time Supabase subscriptions for orders and wallet updates
  useEffect(() => {
    if (!currentAgent) return

    const channel = supabase
      .channel('agent-portal-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_withdrawals', filter: `agent_id=eq.${currentAgent.id}` },
        () => fetchAgentData(currentAgent.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_orders', filter: `assigned_agent_id=eq.${currentAgent.id}` },
        () => fetchAgentData(currentAgent.id)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentAgent])

  // Load Google Maps Script dynamically
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [])

  const fetchAgentData = async (agentId: string) => {
    const { data: agentData } = await supabase
      .from('dispatch_agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentData) {
      setCurrentAgent(agentData)
      setBankName(agentData.bank_name || '')
      setAccountNumber(agentData.account_number || '')
      setAccountName(agentData.account_name || '')
      localStorage.setItem('deechoi_dispatch_agent', JSON.stringify(agentData))
    }

    const { data: orderData } = await supabase
      .from('store_orders')
      .select('*')
      .eq('assigned_agent_id', agentId)
      .order('created_at', { ascending: false })

    if (orderData) {
      setOrders(orderData)
      if (orderData.length > 0 && !trackedOrder) {
        setTrackedOrder(orderData[0])
      }
    }

    const { data: wdData } = await supabase
      .from('agent_withdrawals')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (wdData) {
      setWithdrawals(wdData)
    }
  }

  const handleTrackShipmentSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingInput.trim()) return

    const found = orders.find(o => o.id.toLowerCase().includes(trackingInput.trim().toLowerCase()))
    if (found) {
      setTrackedOrder(found)
      setStatusMessage(`Found shipment #${found.id.slice(0, 8)}`)
    } else {
      alert('Order ID not found in your assigned queue.')
    }
  }

  const handleAgentLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullNameInput.trim() || !phoneInput.trim()) {
      alert('Please provide your full name and phone number.')
      return
    }

    setLoadingAuth(true)
    try {
      const cleanPhone = phoneInput.trim()
      let { data: existingAgent } = await supabase
        .from('dispatch_agents')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (!existingAgent) {
        const { data: newAgent, error: insertError } = await supabase
          .from('dispatch_agents')
          .insert([{ full_name: fullNameInput.trim(), phone: cleanPhone, wallet_balance: 0 }])
          .select()
          .single()

        if (insertError) throw insertError
        existingAgent = newAgent
      }

      setCurrentAgent(existingAgent)
      setAgentPhoneReceiver(existingAgent.phone)
      setBankName(existingAgent.bank_name || '')
      setAccountNumber(existingAgent.account_number || '')
      setAccountName(existingAgent.account_name || '')
      localStorage.setItem('deechoi_dispatch_agent', JSON.stringify(existingAgent))
      fetchAgentData(existingAgent.id)
    } catch (err: any) {
      alert(err.message || 'Authentication error.')
    } finally {
      setLoadingAuth(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('deechoi_dispatch_agent')
    setCurrentAgent(null)
    setOrders([])
    setWithdrawals(0 as any)
  }

  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAgent) return

    setSavingBank(true)
    try {
      const { error } = await supabase
        .from('dispatch_agents')
        .update({ bank_name: bankName.trim(), account_number: accountNumber.trim(), account_name: accountName.trim() })
        .eq('id', currentAgent.id)

      if (error) throw error
      alert('Bank settings saved!')
      fetchAgentData(currentAgent.id)
    } catch (err: any) {
      alert(err.message || 'Failed to save.')
    } finally {
      setSavingBank(false)
    }
  }

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAgent) return

    const amount = parseFloat(withdrawAmount)
    const balance = currentAgent.wallet_balance || 0

    if (isNaN(amount) || amount <= 0 || amount > balance) {
      alert('Invalid withdrawal amount.')
      return
    }

    if (!currentAgent.account_number || !currentAgent.bank_name) {
      alert('Please configure bank details first.')
      return
    }

    setWithdrawing(true)
    try {
      await supabase.from('agent_withdrawals').insert([{
        agent_id: currentAgent.id, amount, bank_name: currentAgent.bank_name,
        account_number: currentAgent.account_number, account_name: currentAgent.account_name, status: 'pending'
      }])

      await supabase.from('dispatch_agents').update({ wallet_balance: balance - amount }).eq('id', currentAgent.id)

      alert(`Withdrawal request of ₦${amount.toLocaleString()} submitted! Pending admin confirmation.`)
      setWithdrawAmount('')
      fetchAgentData(currentAgent.id)
    } catch (err: any) {
      alert(err.message || 'Withdrawal failed.')
    } finally {
      setWithdrawing(false)
    }
  }

  const handleMarkAsDelivered = async (orderId: string) => {
    if (!confirm('Mark order as delivered? Commission will be added.')) return

    try {
      await supabase.from('store_orders').update({ status: 'delivered_pending_confirmation' }).eq('id', orderId)
      if (currentAgent) {
        await supabase.from('dispatch_agents').update({ wallet_balance: (currentAgent.wallet_balance || 0) + 1500 }).eq('id', currentAgent.id)
      }
      alert('Order marked as delivered! ₦1,500 added to wallet.')
      if (currentAgent) fetchAgentData(currentAgent.id)
    } catch (err: any) {
      alert(err.message || 'Failed to update order.')
    }
  }

  const handleCallCustomer = async (orderId: string) => {
    if (!agentPhoneReceiver) {
      alert('Configure your receiver phone number first.')
      return
    }

    setLoadingOrderId(orderId)
    setStatusMessage('Connecting secure bridge call...')
    try {
      const res = await fetch('/api/agent/call-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, agentPhone: agentPhoneReceiver }),
      })
      const data = await res.json()
      setStatusMessage(data.success ? 'Phone ringing! Answer your phone.' : `Error: ${data.message}`)
    } catch {
      setStatusMessage('Network error placing call.')
    } finally {
      setLoadingOrderId(null)
    }
  }

  if (!currentAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2E1D] to-[#072215] flex items-center justify-center p-4">
        <div className="bg-[#131821] border border-[#EAA823]/30 rounded-2xl w-full max-w-md p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#EAA823]/20 border border-[#EAA823]/40 rounded-full flex items-center justify-center mx-auto mb-3 text-[#EAA823]">
              <Truck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">Agent Portal Access</h1>
            <p className="text-xs text-gray-400 mt-1">Enter credentials to open your dashboard.</p>
          </div>

          <form onSubmit={handleAgentLoginOrRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  required
                  className="w-full bg-[#0F1419] border border-[#EAA823]/30 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:border-[#EAA823] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. +2348030001111"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  required
                  className="w-full bg-[#0F1419] border border-[#EAA823]/30 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:border-[#EAA823] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingAuth}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-black text-sm shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              {loadingAuth ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Open Portal</span>}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'See map', icon: MapIcon },
    { id: 'dispatches', label: 'My orders', icon: Package, count: orders.length },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help/FAQ', icon: HelpCircle },
  ]

  const completedCount = orders.filter(o => o.status === 'completed' || o.status === 'delivered_pending_confirmation').length
  const pendingCount = orders.filter(o => o.status !== 'completed' && o.status !== 'delivered_pending_confirmation').length

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col md:flex-row pb-20 md:pb-0 select-none">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111622] border-r border-white/5 sticky top-0 h-screen z-40 p-4 justify-between">
        <div>
          <div className="flex items-center gap-2 px-2 py-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#EAA823] flex items-center justify-center text-[#0B0F17] font-black">C</div>
            <span className="text-xl font-black tracking-widest text-white">CARTO</span>
          </div>

          <nav className="space-y-1.5">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-[#EAA823] text-[#0B0F17] shadow-lg shadow-[#EAA823]/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === item.id ? 'bg-[#0B0F17] text-white' : 'bg-[#EAA823]/20 text-[#EAA823]'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-bold transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111622] border-t border-white/10 z-50 px-4 py-2 flex justify-around items-center">
        {navigationItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
              activeTab === item.id ? 'text-[#EAA823]' : 'text-gray-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-[#111622] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-[#0B0F17] font-black text-lg">
              {currentAgent.full_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-gray-200">Hello {currentAgent.full_name.split(' ')[0]}</h2>
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              </div>
              <p className="text-[11px] text-gray-400">{currentAgent.phone} • Agent Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleTrackShipmentSearch} className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-[#EAA823] outline-none"
              />
            </form>
            <button className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-300 hover:text-[#EAA823] transition relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EAA823]" />
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-3 rounded-xl mb-6 text-xs font-medium">
            {statusMessage}
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-xl font-black text-white">Dashboard</h1>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111622] p-4 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total orders</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">{orders.length}</span>
                  <Package className="w-5 h-5 text-gray-500" />
                </div>
              </div>

              <div className="bg-[#111622] p-4 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Completed orders</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-green-400">{completedCount}</span>
                  <CheckCircle className="w-5 h-5 text-green-500/50" />
                </div>
              </div>

              <div className="bg-[#111622] p-4 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Pending orders</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
                  <Clock className="w-5 h-5 text-amber-500/50" />
                </div>
              </div>

              <div className="bg-[#111622] p-4 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Wallet Balance</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-[#EAA823]">₦{(currentAgent.wallet_balance || 0).toLocaleString()}</span>
                  <Wallet className="w-5 h-5 text-[#EAA823]/50" />
                </div>
              </div>
            </div>

            {/* Current Tracking Section with Real Google Maps embed */}
            <div className="bg-[#111622] p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Current tracking</h3>
                {trackedOrder && (
                  <span className="text-xs font-mono text-[#EAA823]">#{trackedOrder.id.slice(0, 8)}</span>
                )}
              </div>

              {/* Google Map Box */}
              <div className="w-full h-72 rounded-xl overflow-hidden border border-white/10 relative bg-[#0B0F17]">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(trackedOrder?.delivery_address || 'Lagos, Nigeria')}`}
                ></iframe>
              </div>

              {trackedOrder && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
                  <div>
                    <p className="text-gray-400">Tracking No.</p>
                    <p className="font-mono font-bold text-white">#{trackedOrder.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Customer</p>
                    <p className="font-bold text-white">{trackedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Delivery Address</p>
                    <p className="font-bold text-white truncate">{trackedOrder.delivery_address}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold capitalize">{trackedOrder.status}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Order History Table */}
            <div className="bg-[#111622] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 font-bold text-xs">My order history</div>
              <div className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <p className="p-8 text-center text-xs text-gray-500">No past orders available.</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="p-4 flex items-center justify-between text-xs hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-[#EAA823]" />
                        <div>
                          <p className="font-bold text-white">{order.customer_name}</p>
                          <p className="text-[10px] text-gray-400">#{order.id.slice(0, 8)} • {order.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">₦{Number(order.total_amount).toLocaleString()}</span>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${
                          order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {order.status}
                        </span>
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white font-bold"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <h1 className="text-xl font-black text-white">Live Customer Address Map</h1>
            <div className="w-full h-[75vh] rounded-2xl overflow-hidden border border-white/10 relative">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(trackedOrder?.delivery_address || 'Lagos, Nigeria')}`}
              ></iframe>
            </div>
          </div>
        )}

        {/* TAB: DISPATCHES / MY ORDERS */}
        {activeTab === 'dispatches' && (
          <div className="space-y-4">
            <h1 className="text-xl font-black text-white">Assigned Dispatches</h1>
            <div className="bg-[#111622] p-4 rounded-xl border border-white/5 mb-4">
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Your Call Receiver Phone Number</label>
              <input
                type="text"
                value={agentPhoneReceiver}
                onChange={(e) => setAgentPhoneReceiver(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-[#111622] p-5 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#EAA823]">#{order.id.slice(0, 8)}</span>
                    <h3 className="font-bold text-sm text-white">{order.customer_name}</h3>
                    <p className="text-xs text-gray-400">{order.customer_phone} • {order.delivery_address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCallCustomer(order.id)}
                      disabled={loadingOrderId === order.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      {loadingOrderId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : '📞 Call'}
                    </button>
                    {order.status !== 'completed' && order.status !== 'delivered_pending_confirmation' && (
                      <button
                        onClick={() => handleMarkAsDelivered(order.id)}
                        className="bg-[#EAA823] text-[#0B0F17] px-4 py-2 rounded-xl text-xs font-black hover:opacity-90"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: WALLET */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111622] p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-gray-400">Wallet Balance</h3>
              <p className="text-4xl font-black text-[#EAA823]">₦{(currentAgent.wallet_balance || 0).toLocaleString()}</p>
              
              <form onSubmit={handleRequestWithdrawal} className="space-y-3 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Withdraw Amount (NGN)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full py-3 rounded-xl bg-[#EAA823] text-[#0B0F17] font-black text-xs"
                >
                  {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Payout'}
                </button>
              </form>
            </div>

            <div className="bg-[#111622] p-6 rounded-2xl border border-white/5">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">Payout Tracking Status</h3>
              <div className="space-y-2 overflow-y-auto max-h-[300px]">
                {withdrawals.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No requests yet.</p>
                ) : (
                  withdrawals.map(wd => (
                    <div key={wd.id} className="bg-[#0B0F17] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#EAA823]">₦{Number(wd.amount).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">{wd.bank_name}</p>
                      </div>
                      <div>
                        {wd.status === 'completed' ? (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-bold">Paid</span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-[10px] font-bold animate-pulse">Pending Admin</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto bg-[#111622] p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">Bank Account Settings</h3>
            <form onSubmit={handleSaveBankSettings} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase text-gray-400 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block uppercase text-gray-400 mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block uppercase text-gray-400 mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingBank}
                className="w-full py-3 rounded-xl bg-[#EAA823] text-[#0B0F17] font-black"
              >
                Save Bank Details
              </button>
            </form>
          </div>
        )}

        {/* TAB: HELP */}
        {activeTab === 'help' && (
          <div className="max-w-xl mx-auto bg-[#111622] p-6 rounded-2xl border border-white/5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Help & FAQ</h3>
            <p className="text-gray-400">1. How do I get delivery commissions? Mark an assigned order as delivered. ₦1,500 is credited instantly.</p>
            <p className="text-gray-400">2. How long do withdrawals take? Withdrawals are processed once confirmed by the admin.</p>
          </div>
        )}

      </main>

      {/* ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111622] border border-[#EAA823]/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedOrderDetails(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black text-white mb-4">Order Details</h2>
            <div className="bg-[#0B0F17] p-3 rounded-xl text-xs space-y-1 mb-4">
              <p><span className="text-gray-400">Customer:</span> {selectedOrderDetails.customer_name}</p>
              <p><span className="text-gray-400">Address:</span> {selectedOrderDetails.delivery_address}</p>
            </div>
            <button onClick={() => setSelectedOrderDetails(null)} className="w-full py-2 bg-white/10 text-white rounded-xl font-bold text-xs">Close</button>
          </div>
        </div>
      )}

    </div>
  )
}