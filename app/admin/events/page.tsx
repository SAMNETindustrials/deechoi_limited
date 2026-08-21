'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Sparkles, Plus, Trash2, Edit2, CheckCircle2, XCircle, 
  ChevronLeft, Loader2, Save, Eye, Gift, Flame, Megaphone, Tag,
  Share2, CheckSquare, Globe, MessageCircle, Instagram
} from 'lucide-react'
import Link from 'next/link'

export type EventType = 'promotion' | 'announcement' | 'giveaway' | 'flash_sale'
export type CelebrationEffect = 'flower_drop' | 'confetti' | 'gold_sparkles' | 'none'
export type TriggerMode = 'first_visit' | 'every_refresh'

export interface EventActivity {
  id: string
  title: string
  description?: string
  platform: 'instagram' | 'tiktok' | 'whatsapp' | 'facebook' | 'youtube' | 'website' | 'other'
  action_url: string
  verification_seconds: number
}

interface StoreEvent {
  id: string
  title: string
  subtitle: string
  event_type: EventType
  discount_code?: string
  discount_percentage?: string
  banner_image_url?: string
  cta_text: string
  cta_url: string
  celebration_effect: CelebrationEffect
  is_active: boolean
  auto_close_seconds: number
  trigger_mode: TriggerMode
  required_activities?: EventActivity[]
  created_at: string
}

interface EventFormData {
  title: string
  subtitle: string
  event_type: EventType
  discount_code: string
  discount_percentage: string
  banner_image_url: string
  cta_text: string
  cta_url: string
  celebration_effect: CelebrationEffect
  is_active: boolean
  auto_close_seconds: number
  trigger_mode: TriggerMode
  required_activities: EventActivity[]
}

function cleanActionUrl(input: string): string {
  let url = (input || '').trim()
  if (!url) return 'https://instagram.com/deechoi01'
  if (url.startsWith('@')) {
    return `https://tiktok.com/${url}`
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

const DEFAULT_ACTIVITIES_PRESET: EventActivity[] = [
  {
    id: 'act-tt',
    title: 'Follow our TikTok @deechoi01',
    description: 'Watch behind-the-scenes gourmet preparation and live bakes',
    platform: 'tiktok',
    action_url: 'https://tiktok.com/@deechoi01',
    verification_seconds: 4
  },
  {
    id: 'act-ig',
    title: 'Follow our official Instagram @deechoi01',
    description: 'Follow our page to stay updated with daily menu drops & giveaways',
    platform: 'instagram',
    action_url: 'https://instagram.com/deechoi01',
    verification_seconds: 4
  },
  {
    id: 'act-wa',
    title: 'Join our VIP WhatsApp Community',
    description: 'Get express order priorities and direct kitchen chef chats',
    platform: 'whatsapp',
    action_url: 'https://wa.me/2347031385337',
    verification_seconds: 4
  }
]

export default function AdminEventsPage() {
  const [events, setEvents] = useState<StoreEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<EventFormData>({
    title: '🎉 VIP SOCIAL REWARD & GIVEAWAY VOUCHER!',
    subtitle: 'Complete the quick social check-ins below to unlock your personalized 15% discount code!',
    event_type: 'promotion',
    discount_code: 'DEECHOI15',
    discount_percentage: '15% OFF',
    banner_image_url: '/Recipe2.jpg',
    cta_text: 'Claim Voucher Now',
    cta_url: '/#our-menu-section',
    celebration_effect: 'flower_drop',
    is_active: true,
    auto_close_seconds: 0,
    trigger_mode: 'every_refresh',
    required_activities: DEFAULT_ACTIVITIES_PRESET,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (err: any) {
      console.warn('Events fetch note:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '🎉 SPECIAL PROMOTION & GIVEAWAY!',
      subtitle: 'Complete the quick activities to unlock your voucher code.',
      event_type: 'promotion',
      discount_code: 'DEECHOI15',
      discount_percentage: '15% OFF',
      banner_image_url: '',
      cta_text: 'Claim Offer',
      cta_url: '/#our-menu-section',
      celebration_effect: 'flower_drop',
      is_active: true,
      auto_close_seconds: 0,
      trigger_mode: 'every_refresh',
      required_activities: DEFAULT_ACTIVITIES_PRESET,
    })
    setEditingId(null)
  }

  const handleEdit = (ev: StoreEvent) => {
    setFormData({
      title: ev.title,
      subtitle: ev.subtitle || '',
      event_type: ev.event_type || 'promotion',
      discount_code: ev.discount_code || '',
      discount_percentage: ev.discount_percentage || '',
      banner_image_url: ev.banner_image_url || '',
      cta_text: ev.cta_text || 'Claim Offer',
      cta_url: ev.cta_url || '/#our-menu-section',
      celebration_effect: ev.celebration_effect || 'flower_drop',
      is_active: ev.is_active ?? true,
      auto_close_seconds: ev.auto_close_seconds ?? 0,
      trigger_mode: ev.trigger_mode || 'every_refresh',
      required_activities: Array.isArray(ev.required_activities) ? ev.required_activities : [],
    })
    setEditingId(ev.id)
    setShowForm(true)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('store_events')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      fetchEvents()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle event.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event/promo?')) return
    try {
      const { error } = await supabase.from('store_events').delete().eq('id', id)
      if (error) throw error
      fetchEvents()
    } catch (err: any) {
      alert(err.message || 'Failed to delete event.')
    }
  }

  const addActivity = () => {
    const newAct: EventActivity = {
      id: `act-${Date.now()}`,
      title: 'Follow our TikTok @deechoi01',
      description: 'Follow our account to earn your voucher discount',
      platform: 'tiktok',
      action_url: 'https://tiktok.com/@deechoi01',
      verification_seconds: 4
    }
    setFormData((prev) => ({
      ...prev,
      required_activities: [...prev.required_activities, newAct]
    }))
  }

  const removeActivity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      required_activities: prev.required_activities.filter(a => a.id !== id)
    }))
  }

  const updateActivity = (id: string, field: keyof EventActivity, value: any) => {
    setFormData((prev) => ({
      ...prev,
      required_activities: prev.required_activities.map(a => 
        a.id === id ? { ...a, [field]: value } : a
      )
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Event title is required.')
      return
    }

    try {
      setSubmitting(true)

      const sanitizedActivities = formData.required_activities.map(act => ({
        ...act,
        action_url: cleanActionUrl(act.action_url)
      }))

      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        event_type: formData.event_type,
        discount_code: formData.discount_code?.trim() || null,
        discount_percentage: formData.discount_percentage?.trim() || null,
        banner_image_url: formData.banner_image_url?.trim() || null,
        cta_text: formData.cta_text.trim(),
        cta_url: formData.cta_url.trim(),
        celebration_effect: formData.celebration_effect,
        is_active: formData.is_active,
        auto_close_seconds: Number(formData.auto_close_seconds) || 0,
        trigger_mode: formData.trigger_mode,
        required_activities: sanitizedActivities,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase
          .from('store_events')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        alert('Event, tasks, and social verification updated successfully!')
      } else {
        const { error } = await supabase
          .from('store_events')
          .insert([payload])
        if (error) throw error
        alert('New Storefront Promo Event with Social Tasks published live!')
      }

      setShowForm(false)
      resetForm()
      fetchEvents()
    } catch (err: any) {
      alert(err.message || 'Failed to save event.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white font-sans pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1f2e] to-[#131821] border-b border-[#EAA823]/20 p-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-[#EAA823]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold">Events, Giveaways &amp; Social Tasks</h1>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Set customer objectives (e.g., Follow Instagram, TikTok, WhatsApp) and auto-verify before unlocking voucher rewards.
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="secondary" className="gap-2 bg-[#EAA823]/10 text-[#EAA823] hover:bg-[#EAA823] hover:text-[#0A2E1D] border border-[#EAA823]/30 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold gap-2 rounded-xl shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Promo &amp; Task Campaign
          </Button>

          <Link href="/" target="_blank" className="text-xs text-[#EAA823] font-bold flex items-center gap-1 hover:underline">
            Test Live Storefront <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Drawer / Form */}
        {showForm && (
          <form onSubmit={handleSave} className="bg-[#1a1f2e] border border-[#EAA823]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#EAA823]" />
                {editingId ? 'Edit Event Campaign & Actions' : 'Create Live Promo Event with Social Tasks'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-300 uppercase">Popup Headline *</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 🎉 VIP SOCIAL REWARD & GIVEAWAY VOUCHER!"
                  className="bg-[#131821] border-[#EAA823]/30 text-white font-bold"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-300 uppercase">Subtitle / Instructions</label>
                <Textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Follow our official pages below to automatically verify and unlock your discount code!"
                  className="bg-[#131821] border-[#EAA823]/30 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
                  className="w-full bg-[#131821] border border-[#EAA823]/30 text-white text-xs rounded-xl p-3 outline-none"
                >
                  <option value="promotion">🎁 Promotion &amp; Discount Voucher</option>
                  <option value="giveaway">🌟 Giveaway &amp; Social Follow Contest</option>
                  <option value="flash_sale">⚡ Flash Sale Alert</option>
                  <option value="announcement">📢 General Store Announcement</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Celebration Effect</label>
                <select
                  value={formData.celebration_effect}
                  onChange={(e) => setFormData({ ...formData, celebration_effect: e.target.value as CelebrationEffect })}
                  className="w-full bg-[#131821] border border-[#EAA823]/30 text-white text-xs rounded-xl p-3 outline-none font-bold text-amber-300"
                >
                  <option value="flower_drop">🌸 Celebration Flower Drop Animation</option>
                  <option value="confetti">🎊 Colorful Party Confetti Shower</option>
                  <option value="gold_sparkles">✨ Gold Luxury Sparkles Shower</option>
                  <option value="none">No Particles</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Promo Prefix / Base Code</label>
                <Input
                  value={formData.discount_code}
                  onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DEECHOI15"
                  className="bg-[#131821] border-[#EAA823]/30 text-amber-300 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Discount Badge Text</label>
                <Input
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  placeholder="e.g. 15% OFF or FREE DELIVERY"
                  className="bg-[#131821] border-[#EAA823]/30 text-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Auto-Elapse Timer (Seconds)</label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.auto_close_seconds}
                  onChange={(e) => setFormData({ ...formData, auto_close_seconds: Number(e.target.value) })}
                  placeholder="0 (0 = Stay open for task completion)"
                  className="bg-[#131821] border-[#EAA823]/30 text-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Trigger Frequency</label>
                <select
                  value={formData.trigger_mode}
                  onChange={(e) => setFormData({ ...formData, trigger_mode: e.target.value as TriggerMode })}
                  className="w-full bg-[#131821] border border-[#EAA823]/30 text-white text-xs rounded-xl p-3 outline-none"
                >
                  <option value="every_refresh">Pops up on Every Refresh</option>
                  <option value="first_visit">First-Time Visitors Only (Session Storage)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Button CTA Text</label>
                <Input
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  placeholder="Claim 15% Voucher Now"
                  className="bg-[#131821] border-[#EAA823]/30 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase">Button Link / Action</label>
                <Input
                  value={formData.cta_url}
                  onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                  placeholder="/#our-menu-section"
                  className="bg-[#131821] border-[#EAA823]/30 text-white"
                />
              </div>
            </div>

            {/* REQUIRED CUSTOMER ACTIVITIES & SOCIAL VERIFICATION BUILDER */}
            <div className="bg-[#131821] p-5 rounded-2xl border border-[#EAA823]/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-extrabold text-[#EAA823] flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Required Customer Activities / Social Follows ({formData.required_activities.length})
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Customers must complete these actions to verify and unlock their discount code.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={addActivity}
                  className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] text-xs font-bold rounded-xl gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Activity
                </Button>
              </div>

              {formData.required_activities.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-xs italic">
                  No required actions set. The voucher will unlock immediately for visiting customers.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.required_activities.map((act, index) => (
                    <div key={act.id} className="p-4 bg-[#1a1f2e] border border-white/10 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <span>Task #{index + 1}:</span>
                          <span className="capitalize text-white">({act.platform})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeActivity(act.id)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Task Title</label>
                          <Input
                            value={act.title}
                            onChange={(e) => updateActivity(act.id, 'title', e.target.value)}
                            placeholder="e.g. Follow @deechoi01 on TikTok"
                            className="bg-[#131821] border-gray-700 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Platform</label>
                          <select
                            value={act.platform}
                            onChange={(e) => updateActivity(act.id, 'platform', e.target.value as EventActivity['platform'])}
                            className="w-full bg-[#131821] border border-gray-700 text-white text-xs rounded-xl p-2.5 outline-none font-semibold"
                          >
                            <option value="tiktok">TikTok</option>
                            <option value="instagram">Instagram</option>
                            <option value="whatsapp">WhatsApp Channel</option>
                            <option value="facebook">Facebook</option>
                            <option value="youtube">YouTube</option>
                            <option value="website">Custom Website Link</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Target Action Link / Handle</label>
                          <Input
                            value={act.action_url}
                            onChange={(e) => updateActivity(act.id, 'action_url', e.target.value)}
                            placeholder="https://tiktok.com/@deechoi01"
                            className="bg-[#131821] border-gray-700 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Min Active Seconds</label>
                          <Input
                            type="number"
                            min="2"
                            max="30"
                            value={act.verification_seconds}
                            onChange={(e) => updateActivity(act.id, 'verification_seconds', Number(e.target.value))}
                            placeholder="4"
                            className="bg-[#131821] border-gray-700 text-xs text-white font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#131821] rounded-2xl border border-[#EAA823]/20">
              <div>
                <span className="text-sm font-bold text-white block">Event Active on Live Storefront</span>
                <span className="text-xs text-gray-400">Broadcast this popup &amp; task verification to all visiting customers.</span>
              </div>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 accent-[#EAA823] cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="border-gray-600 text-gray-300 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-bold px-6 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update Event & Actions' : 'Publish Event'}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Existing Events List */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />
            <p className="text-xs">Loading promo campaigns...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#1a1f2e] border border-dashed border-gray-700 rounded-3xl p-12 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-[#EAA823] mx-auto opacity-50" />
            <h4 className="font-bold text-white">No promotional campaigns created yet.</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Create your first promotional popup with follow-to-unlock social tasks, celebrations, and discount vouchers!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className={`bg-gradient-to-br from-[#1a1f2e] to-[#131821] p-5 rounded-2xl border transition-all space-y-4 ${
                  ev.is_active ? 'border-[#EAA823]/50 shadow-lg' : 'border-white/10 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ev.event_type === 'giveaway' ? 'bg-purple-500/20 text-purple-300' :
                        ev.event_type === 'flash_sale' ? 'bg-red-500/20 text-red-300' :
                        'bg-[#EAA823]/20 text-[#EAA823]'
                      }`}>
                        {ev.event_type}
                      </span>
                      {ev.is_active ? (
                        <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Paused
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-white text-base leading-tight">{ev.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{ev.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(ev)}
                      className="text-gray-300 hover:text-white p-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ev.id)}
                      className="text-red-400 hover:text-red-300 p-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="p-3 bg-[#131821] rounded-xl border border-white/5 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div>
                    {ev.discount_code ? (
                      <span className="font-mono text-amber-300 font-bold bg-[#EAA823]/10 px-2 py-0.5 rounded border border-[#EAA823]/20">
                        {ev.discount_code} {ev.discount_percentage ? `(${ev.discount_percentage})` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">No code</span>
                    )}
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Tasks: <b className="text-[#EAA823]">{Array.isArray(ev.required_activities) ? ev.required_activities.length : 0} Required</b> &bull; Effect: <b className="text-white">{ev.celebration_effect}</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-400">
                    Trigger: <b className="text-gray-200">{ev.trigger_mode === 'every_refresh' ? 'Every Refresh' : '1st Visit Only'}</b>
                  </span>

                  <button
                    onClick={() => handleToggleActive(ev.id, ev.is_active)}
                    className={`text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer ${
                      ev.is_active
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }`}
                  >
                    {ev.is_active ? 'Pause Campaign' : 'Publish Live'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}