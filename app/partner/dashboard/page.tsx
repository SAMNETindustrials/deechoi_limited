'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingCart, TrendingUp, DollarSign, Package, CheckCircle2, Store, Power, AlertCircle } from 'lucide-react'

interface PartnerOrder {
  id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
  items: any[]
}

export default function PartnerDashboard() {
  const [partner, setPartner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stationActive, setStationActive] = useState(true)
  const [orders, setOrders] = useState<PartnerOrder[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    grossRevenue: 0,
    netEarnings: 0,
    topDishes: [] as { name: string; count: number; revenue: number }[]
  })

  const supabase = createClient()

  useEffect(() => {
    const fetchPartnerData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch partner profile linked to user email or auth ID
        const { data: partnerProfile } = await supabase
          .from('partners')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()

        if (partnerProfile) {
          setPartner(partnerProfile)
          loadOrders(partnerProfile.state)
        }
      } catch (err) {
        console.error('Error loading partner dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPartnerData()
  }, [supabase])

  const loadOrders = async (stateName: string) => {
    try {
      const { data: orderData, error } = await supabase
        .from('store_orders')
        .select('*')
        .eq('fulfillment_state', stateName)
        .order('created_at', { ascending: false })

      if (error) throw error

      const parsedOrders: PartnerOrder[] = orderData || []
      setOrders(parsedOrders)

      const totalOrders = parsedOrders.length
      const grossRevenue = parsedOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      const netEarnings = grossRevenue * 0.70 // 70% Partner cut, 30% De-echoi HQ

      // Calculate dish sales velocity
      const productCounts: Record<string, { count: number; revenue: number }> = {}
      parsedOrders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            const name = it.name || it.product_name || 'Standard De-echoi Meal'
            const qty = Number(it.quantity) || 1
            const price = Number(it.price) || 0
            if (!productCounts[name]) productCounts[name] = { count: 0, revenue: 0 }
            productCounts[name].count += qty
            productCounts[name].revenue += price * qty
          })
        }
      })

      const topDishes = Object.entries(productCounts)
        .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.count - a.count)

      setStats({
        totalOrders,
        grossRevenue,
        netEarnings,
        topDishes
      })
    } catch (err) {
      console.error('Error fetching hub orders:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center text-amber-400 font-bold">
        Loading Partner Hub...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl font-black text-[#EAA823] flex items-center gap-2">
              <Store className="w-6 h-6" /> {partner?.business_name || 'De-echoi Partner Hub'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Location Hub: <strong className="text-white">{partner?.city}, {partner?.state}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStationActive(!stationActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                stationActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Kitchen Status: </span>
              <span className="font-black">{stationActive ? 'ONLINE' : 'PAUSED'}</span>
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1a1f2e] p-6 rounded-3xl border border-[#EAA823]/20 shadow-xl">
            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Station Orders</p>
            <p className="text-3xl font-black text-white">{stats.totalOrders}</p>
            <span className="text-[10px] text-emerald-400 mt-2 block">Live fulfillment active</span>
          </div>

          <div className="bg-[#1a1f2e] p-6 rounded-3xl border border-[#EAA823]/20 shadow-xl">
            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Gross Menu Revenue</p>
            <p className="text-3xl font-black text-[#EAA823]">₦{stats.grossRevenue.toLocaleString()}</p>
            <span className="text-[10px] text-gray-400 mt-2 block">Total sales generated</span>
          </div>

          <div className="bg-[#1a1f2e] p-6 rounded-3xl border border-[#EAA823]/20 shadow-xl">
            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Your Net Earnings (70%)</p>
            <p className="text-3xl font-black text-emerald-400">₦{stats.netEarnings.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-300 mt-2 block">After 30% De-echoi HQ split</span>
          </div>
        </div>

        {/* Menu Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#1a1f2e] p-6 rounded-3xl border border-[#EAA823]/20 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-[#EAA823]" /> De-echoi Menu Performance at Your Station
            </h3>

            <div className="space-y-3">
              {stats.topDishes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No product sales recorded yet for this station.</p>
              ) : (
                stats.topDishes.map((dish, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">{dish.name}</p>
                      <span className="text-[10px] text-[#EAA823]">{dish.count} plates/units fulfilled</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-400">₦{dish.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Orders Feed */}
          <div className="lg:col-span-5 bg-[#1a1f2e] p-6 rounded-3xl border border-[#EAA823]/20 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" /> Station Order Feed
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Awaiting incoming state orders...</p>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{o.customer_name}</span>
                      <span className="text-xs font-black text-[#EAA823]">₦{Number(o.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{new Date(o.created_at).toLocaleTimeString()}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full uppercase font-bold">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}