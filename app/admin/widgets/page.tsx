'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search, Grid, Check, X, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface WidgetDefinition {
  id: string
  name: string
  category: 'Sales' | 'Operations' | 'Analytics' | 'Marketing' | 'AI & Tools'
  description: string
  enabled: boolean
}

const ALL_50_WIDGETS: WidgetDefinition[] = [
  { id: 'weather', name: 'Live Weather Radar & Delivery Impact', category: 'Operations', description: 'Tracks temperature, humidity, and courier route conditions in real time.', enabled: true },
  { id: 'sales_graph', name: 'Orders Volume & Revenue Trend Graph', category: 'Sales', description: 'Interactive spline graph tracking 7-day inflows and orders volume.', enabled: true },
  { id: 'trending_products', name: 'Products Making Waves', category: 'Sales', description: 'Real-time ranking of top-selling dishes and pastries.', enabled: true },
  { id: 'growth_tips', name: 'Mr. Tell AI Growth Assistant', category: 'AI & Tools', description: 'Actionable business strategies based on customer buying patterns.', enabled: true },
  { id: 'metrics_grid', name: 'Core Glance Metrics Grid', category: 'Analytics', description: 'Total orders, revenue, customer overview, and pending orders summary.', enabled: true },
  { id: 'recent_orders', name: 'Recent Orders Stream', category: 'Operations', description: 'Live order confirmation and dispatch management stream.', enabled: true },
  { id: 'promo_banner', name: 'Storefront Promo & Event Banner', category: 'Marketing', description: 'Temu-style discount voucher and campaign manager.', enabled: true },
  { id: 'courier_dispatch', name: 'Active Courier Dispatch Map', category: 'Operations', description: 'Real-time GPS tracking for delivery bikers across Port Harcourt zones.', enabled: false },
  { id: 'inventory_alert', name: 'Low Stock Threshold Warning', category: 'Operations', description: 'Instant alerts when baking ingredients or kitchen stock run low.', enabled: false },
  { id: 'customer_retention', name: 'Customer Retention Rate', category: 'Analytics', description: 'Percentage of first-time buyers returning for repeat orders.', enabled: false },
  { id: 'hourly_traffic', name: 'Hourly Storefront Traffic Heatmap', category: 'Analytics', description: 'Peak visiting hours and cart checkout spikes.', enabled: false },
  { id: 'bank_verification', name: 'Zenith Bank Transfer Auto-Matcher', category: 'Sales', description: 'AI receipt scanner verification status log.', enabled: false },
  { id: 'voucher_redemption', name: 'Active Voucher Redemptions', category: 'Marketing', description: 'Tracks usage frequency of promo codes like DEECHOI15.', enabled: false },
  { id: 'kitchen_speed', name: 'Kitchen Prep Speed Index', category: 'Operations', description: 'Average time elapsed from order placement to packaging.', enabled: false },
  { id: 'zone_delivery_breakdown', name: 'PH Delivery Zone Volume', category: 'Operations', description: 'Orders distribution across Woji, GRA, Choba, and outer zones.', enabled: false },
  { id: 'refund_tracker', name: 'Refunds & Dispute Monitor', category: 'Sales', description: 'Tracks cancelled orders and customer support refunds.', enabled: false },
  { id: 'social_mentions', name: 'Social Media Social Listening', category: 'Marketing', description: 'Brand mentions across Instagram, WhatsApp, and Twitter.', enabled: false },
  { id: 'staff_performance', name: 'Staff Dispatch Leadboard', category: 'Operations', description: 'Ranking of dispatch riders by delivery speed.', enabled: false },
  { id: 'peak_hour_predictor', name: 'AI Peak Hour Predictor', category: 'AI & Tools', description: 'Predicts high-demand meal windows based on historical weather & day.', enabled: false },
  { id: 'cart_abandonment', name: 'Cart Abandonment Rate', category: 'Sales', description: 'Percentage of users leaving items in cart without checking out.', enabled: false },
  { id: 'sms_credit', name: 'SMS & Email API Gateway Balance', category: 'Analytics', description: 'Remaining notification dispatch credits on Nodemailer/Supabase.', enabled: false },
  { id: 'supplier_log', name: 'Kitchen Supplier Ingredient Log', category: 'Operations', description: 'Tracks raw food supplies, flour, meat, and packaging stock.', enabled: false },
  { id: 'daily_goal_gauge', name: 'Daily Revenue Gauge', category: 'Sales', description: 'Circular progress dial towards daily sales target.', enabled: false },
  { id: 'tax_estimator', name: 'Estimated VAT & Tax Calculator', category: 'Analytics', description: 'Computed state tax obligations based on gross revenue.', enabled: false },
  { id: 'vip_customers', name: 'Top VIP Spenders List', category: 'Analytics', description: 'High-value customers contributing to top revenue tiers.', enabled: false },
  { id: 'feedback_sentiment', name: 'Customer Feedback Sentiment Analysis', category: 'AI & Tools', description: 'Sentiment score from recent post-delivery reviews.', enabled: false },
  { id: 'quick_broadcast', name: 'Quick SMS/Email Broadcast Tool', category: 'Marketing', description: 'Instant bulk announcement sender to registered customer emails.', enabled: false },
  { id: 'shift_timer', name: 'Shift Timer & Attendance Tracker', category: 'Operations', description: 'Active hours logged by kitchen staff.', enabled: false },
  { id: 'discount_impact', name: 'Discount Impact on Profitability', category: 'Analytics', description: 'Net margin analysis after voucher deductions.', enabled: false },
  { id: 'api_status', name: 'Supabase & Server Health Status', category: 'Analytics', description: 'Real-time uptime and latency check for database connections.', enabled: false },
  { id: 'repeat_purchase_interval', name: 'Repeat Purchase Interval', category: 'Analytics', description: 'Average days between customer orders.', enabled: false },
  { id: 'weekend_special_tracker', name: 'Weekend Special Sales Tracker', category: 'Sales', description: 'Special tracking for weekend grills and celebration cakes.', enabled: false },
  { id: 'app_version_log', name: 'Storefront App Version Log', category: 'Operations', description: 'PWA and Next.js deployment build logs.', enabled: false },
  { id: 'security_audit', name: 'Admin Security & Login Audit', category: 'Analytics', description: 'Tracks IP addresses of admin dashboard login sessions.', enabled: false },
  { id: 'custom_note_board', name: 'Kitchen Admin Sticky Notes', category: 'AI & Tools', description: 'Pin reminders or urgent kitchen notices for the team.', enabled: false },
  { id: 'cater_booking_feed', name: 'Event Booking & Catering Requests', category: 'Sales', description: 'Incoming inquiries from "Book Us" service page.', enabled: false },
  { id: 'recipe_costing', name: 'Recipe Cost & Margin Calculator', category: 'Operations', description: 'Calculates profitability per plate of soup or cake tier.', enabled: false },
  { id: 'weather_sales_correlation', name: 'Weather vs Sales Correlation Chart', category: 'Analytics', description: 'Graph showing how rain affects delivery order volume.', enabled: false },
  { id: 'auto_reply_status', name: 'AI Support Auto-Reply Monitor', category: 'AI & Tools', description: 'Status of automated customer inquiry responses.', enabled: false },
  { id: 'seo_rank_tracker', name: 'Storefront SEO & Traffic Stats', category: 'Marketing', description: 'Google search impression and click metrics.', enabled: false },
  { id: 'cash_drawer_log', name: 'Cash Drawer & POS Reconciliation', category: 'Sales', description: 'End-of-shift physical cash vs digital transfer balance.', enabled: false },
  { id: 'delivery_radius_map', name: 'Delivery Radius Heatmap', category: 'Operations', description: 'Geographical clustering of customer delivery addresses.', enabled: false },
  { id: 'loyalty_points_ledger', name: 'Customer Loyalty Points Ledger', category: 'Marketing', description: 'Points accumulated by registered 5-digit PIN holders.', enabled: false },
  { id: 'flash_sale_timer', name: 'Flash Sale Countdown Timer Widget', category: 'Marketing', description: 'Timed discount banner for homepage promotion.', enabled: false },
  { id: 'server_bandwidth', name: 'Server Bandwidth & Storage Usage', category: 'Analytics', description: 'Supabase storage used for payment receipts and menu images.', enabled: false },
  { id: 'ingredient_expiry', name: 'Perishable Ingredient Expiry Tracker', category: 'Operations', description: 'Alerts on dairy, meat, and fresh fruit shelf lives.', enabled: false },
  { id: 'competitor_watch', name: 'Local Food Delivery Benchmark', category: 'Marketing', description: 'Market intelligence and pricing comparisons.', enabled: false },
  { id: 'push_notification_log', name: 'Push Notification Dispatch History', category: 'Marketing', description: 'Log of sent alerts and open rates.', enabled: false },
  { id: 'daily_summary_pdf', name: 'Automated Daily PDF Report Generator', category: 'Analytics', description: 'One-click export of daily revenue and order summaries.', enabled: false }
]

export default function AdminWidgetsPage() {
  const [widgets, setWidgets] = useState<WidgetDefinition[]>(ALL_50_WIDGETS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('deechoi_admin_widgets')
    if (saved) {
      try {
        const parsed: Array<{ id: string; enabled: boolean }> = JSON.parse(saved)
        const map = new Map(parsed.map(w => [w.id, w.enabled]))
        setWidgets(ALL_50_WIDGETS.map(w => ({
          ...w,
          enabled: map.has(w.id) ? (map.get(w.id) ?? w.enabled) : w.enabled
        })))
      } catch (e) {
        console.warn('Error loading widgets storage', e)
      }
    }
  }, [])

  const toggleWidget = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    setWidgets(updated)
    localStorage.setItem('deechoi_admin_widgets', JSON.stringify(updated.map(w => ({ id: w.id, enabled: w.enabled }))))
  }

  const filtered = widgets.filter(w => {
    const matchCat = selectedCategory === 'All' || w.category === selectedCategory
    const matchQuery = !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchQuery
  })

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-6 sm:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs bg-[#EAA823]/20 text-[#EAA823] px-3.5 py-1.5 rounded-full font-bold">
            {widgets.filter(w => w.enabled).length} of 50 Widgets Active
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Grid className="w-8 h-8 text-[#EAA823]" /> De-echoi Enterprise Widget Store
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Toggle any of the 50 operational widgets to instantly customize your real-time command center dashboard.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#131821] p-4 rounded-3xl border border-white/10">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search 50 widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-[#EAA823]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['All', 'Sales', 'Operations', 'Analytics', 'Marketing', 'AI & Tools'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#EAA823] text-[#0A2E1D]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <div
              key={w.id}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between gap-4 ${
                w.enabled
                  ? 'bg-gradient-to-br from-[#1a233a] to-[#131821] border-[#EAA823]/40 shadow-lg'
                  : 'bg-[#131821] border-white/5 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                    {w.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWidget(w.id)}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                      w.enabled ? 'bg-[#EAA823]' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        w.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <h4 className="font-bold text-sm text-white">{w.name}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{w.description}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className={w.enabled ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-gray-500'}>
                  {w.enabled ? <><Check className="w-3.5 h-3.5" /> Active on Dashboard</> : 'Disabled'}
                </span>
                <span className="font-mono text-gray-500">ID: {w.id}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
          <Link href="/admin/dashboard">
            <Button className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-extrabold text-xs rounded-2xl px-8 py-3 cursor-pointer">
              Save &amp; Return to Dashboard
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}