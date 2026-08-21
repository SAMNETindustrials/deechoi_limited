'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Target, ArrowLeft, Trophy, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminGoalsPage() {
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchGoalsData = async () => {
      const { data } = await supabase.from('store_orders').select('total_amount')
      if (data) {
        const totalRev = data.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
        setRevenue(totalRev)
        setOrdersCount(data.length)
      }
      setLoading(false)
    }
    fetchGoalsData()
  }, [supabase])

  const monthlyRevTarget = 5000000 // ₦5M monthly target
  const revProgress = Math.min(100, Math.round((revenue / monthlyRevTarget) * 100))

  const monthlyOrdersTarget = 1500
  const ordersProgress = Math.min(100, Math.round((ordersCount / monthlyOrdersTarget) * 100))

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs bg-[#EAA823]/20 text-[#EAA823] px-3 py-1 rounded-full font-bold">Q3 2026 Targets</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-[#EAA823]" /> Goals &amp; Business Targets
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Monitor real-time progress toward De-echoi Limited monthly revenue and kitchen delivery milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Target Card */}
          <div className="bg-[#131821] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">Monthly Revenue Goal</span>
              <Trophy className="w-5 h-5 text-[#EAA823]" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">₦{revenue.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/ ₦{monthlyRevTarget.toLocaleString()}</span></p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#EAA823]">{revProgress}% Achieved</span>
                <span className="text-gray-400">Target: ₦5M</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#EAA823] to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${revProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Orders Volume Target Card */}
          <div className="bg-[#131821] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">Completed Deliveries Goal</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{ordersCount} Orders <span className="text-xs text-gray-400 font-normal">/ {monthlyOrdersTarget} target</span></p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-400">{ordersProgress}% Achieved</span>
                <span className="text-gray-400">Target: 1,500 orders</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full transition-all duration-500" style={{ width: `${ordersProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone checklist */}
        <div className="bg-[#131821] border border-white/10 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#EAA823]">Kitchen Milestone Checkpoints</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Establish Port Harcourt Woji delivery zone matrix (Zones 1–9)</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Automate 5-digit transaction code verification &amp; email delivery receipts</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <Sparkles className="w-4 h-4 text-[#EAA823] flex-shrink-0" />
              <span>Expand weekend parfait &amp; grilled turkey catering packages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}