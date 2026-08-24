'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Loader2,
  Save,
  Eye,
  Gift,
  ShoppingCart,
  Upload,
  Image as ImageIcon,
  Utensils,
  CheckSquare,
  Megaphone,
  Trophy,
  Clock3,
  TicketPercent,
  Users,
  MousePointerClick,
  Zap,
  Settings2
} from 'lucide-react'
import Link from 'next/link'

export type EventType =
  | 'promotion'
  | 'announcement'
  | 'giveaway'
  | 'flash_sale'

export type CelebrationEffect =
  | 'flower_drop'
  | 'confetti'
  | 'gold_sparkles'
  | 'none'

export type TriggerMode =
  | 'first_visit'
  | 'every_refresh'

export interface EventActivity {
  id: string
  title: string
  description?: string
  platform:
    | 'instagram'
    | 'tiktok'
    | 'whatsapp'
    | 'facebook'
    | 'youtube'
    | 'website'
    | 'other'
  action_url: string
  verification_seconds: number
}

export interface EventAddon {
  id: string
  name: string
  price: number
  image_url: string
}

export interface EventAddonGroup {
  id: string
  title: string
  max_selections: number
  addons: EventAddon[]
}

export interface EventSpecialItem {
  id: string
  name: string
  price: number
  discount_percentage: number
  description: string
  image_url: string
  addon_groups: EventAddonGroup[]
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
  special_items?: EventSpecialItem[]
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
  special_items: EventSpecialItem[]
}

const STORAGE_BUCKET = 'store_assets'

function cleanActionUrl(input: string): string {
  let url = (input || '').trim()

  if (!url) {
    return 'https://instagram.com/deechoi01'
  }

  if (url.startsWith('@')) {
    return `https://tiktok.com/${url}`
  }

  if (
    !url.startsWith('http://') &&
    !url.startsWith('https://')
  ) {
    return `https://${url}`
  }

  return url
}

function createDefaultActivity(): EventActivity {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: 'Follow our TikTok @deechoi01',
    description:
      'Follow our page to qualify for this campaign.',
    platform: 'tiktok',
    action_url: 'https://tiktok.com/@deechoi01',
    verification_seconds: 4
  }
}

function createDefaultSpecialItem(): EventSpecialItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: 'Weekend Special Platter',
    price: 5500,
    discount_percentage: 10,
    description: 'Exclusive event meal combo.',
    image_url: '',
    addon_groups: [
      {
        id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: 'Choose your Free Drink',
        max_selections: 1,
        addons: [
          {
            id: `add-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: 'Chilled Zobo Drink',
            price: 0,
            image_url: ''
          }
        ]
      }
    ]
  }
}

function getEventTypeConfig(type: EventType) {
  switch (type) {
    case 'promotion':
      return {
        label: 'Promotion & Discount',
        icon: TicketPercent,
        color: 'amber',
        description:
          'Create a promotional offer, voucher or discount campaign.',
        defaultTitle: '🎉 VIP SOCIAL REWARD VOUCHER!',
        defaultSubtitle:
          'Complete the required activities below to unlock your promotional reward.',
        defaultCTA: 'Claim Voucher Now',
        defaultURL: '/#our-menu-section',
        defaultEffect: 'flower_drop' as CelebrationEffect,
        defaultTrigger: 'every_refresh' as TriggerMode,
        defaultTimer: 0
      }

    case 'giveaway':
      return {
        label: 'Giveaway & Contest',
        icon: Trophy,
        color: 'purple',
        description:
          'Run a prize giveaway or social contest with configurable entry requirements.',
        defaultTitle: '🏆 DE-ECHOI GIVEAWAY!',
        defaultSubtitle:
          'Complete the required entry activities below to qualify for this giveaway.',
        defaultCTA: 'Enter Giveaway',
        defaultURL: '/#giveaway',
        defaultEffect: 'confetti' as CelebrationEffect,
        defaultTrigger: 'every_refresh' as TriggerMode,
        defaultTimer: 0
      }

    case 'flash_sale':
      return {
        label: 'Flash Sale',
        icon: Zap,
        color: 'emerald',
        description:
          'Create a time-sensitive sale with special products, discounts and add-ons.',
        defaultTitle: '🔥 EXCLUSIVE FLASH SALE IS LIVE!',
        defaultSubtitle:
          'Grab these special packages before the offer disappears.',
        defaultCTA: 'Shop Flash Sale',
        defaultURL: '/#our-menu-section',
        defaultEffect: 'confetti' as CelebrationEffect,
        defaultTrigger: 'every_refresh' as TriggerMode,
        defaultTimer: 0
      }

    case 'announcement':
      return {
        label: 'Announcement',
        icon: Megaphone,
        color: 'blue',
        description:
          'Publish an important announcement, notice or store update.',
        defaultTitle: '📢 IMPORTANT ANNOUNCEMENT',
        defaultSubtitle:
          'Stay updated with the latest news and information from De-echoi.',
        defaultCTA: 'Learn More',
        defaultURL: '/',
        defaultEffect: 'gold_sparkles' as CelebrationEffect,
        defaultTrigger: 'every_refresh' as TriggerMode,
        defaultTimer: 0
      }
  }
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<StoreEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [formMode, setFormMode] = useState<
    'none' | 'promo' | 'weekend'
  >('none')

  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<string | null>(null)

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    subtitle: '',
    event_type: 'promotion',
    discount_code: '',
    discount_percentage: '',
    banner_image_url: '',
    cta_text: '',
    cta_url: '',
    celebration_effect: 'none',
    is_active: true,
    auto_close_seconds: 0,
    trigger_mode: 'every_refresh',
    required_activities: [],
    special_items: []
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
        .order('created_at', {
          ascending: false
        })

      if (error) throw error

      setEvents(data || [])
    } catch (err: any) {
      console.warn(
        'Events fetch note:',
        err.message
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * ============================================================
   * EVENT TYPE CONFIGURATION
   * ============================================================
   */

  const applyEventTypeDefaults = (
    type: EventType,
    preserveContent = false
  ) => {
    const config = getEventTypeConfig(type)

    setFormData(prev => ({
      ...prev,

      event_type: type,

      title: preserveContent
        ? prev.title
        : config.defaultTitle,

      subtitle: preserveContent
        ? prev.subtitle
        : config.defaultSubtitle,

      cta_text: preserveContent
        ? prev.cta_text
        : config.defaultCTA,

      cta_url: preserveContent
        ? prev.cta_url
        : config.defaultURL,

      celebration_effect:
        config.defaultEffect,

      trigger_mode:
        config.defaultTrigger,

      auto_close_seconds:
        config.defaultTimer,

      /*
       * These are intentionally reset when switching campaign
       * types so a previous campaign configuration doesn't leak
       * into a different campaign type.
       */
      discount_code:
        type === 'promotion'
          ? preserveContent
            ? prev.discount_code
            : 'DEECHOI15'
          : '',

      discount_percentage:
        type === 'promotion'
          ? preserveContent
            ? prev.discount_percentage
            : '15% OFF'
          : '',

      required_activities:
        type === 'promotion' || type === 'giveaway'
          ? preserveContent
            ? prev.required_activities
            : [createDefaultActivity()]
          : [],

      special_items:
        type === 'flash_sale'
          ? preserveContent
            ? prev.special_items
            : [createDefaultSpecialItem()]
          : []
    }))
  }

  /*
   * ============================================================
   * CREATE CAMPAIGNS
   * ============================================================
   */

  const resetForm = (
    mode: 'promo' | 'weekend'
  ) => {
    const type: EventType =
      mode === 'promo'
        ? 'promotion'
        : 'flash_sale'

    const config = getEventTypeConfig(type)

    setFormData({
      title: config.defaultTitle,
      subtitle: config.defaultSubtitle,
      event_type: type,
      discount_code:
        type === 'promotion'
          ? 'DEECHOI15'
          : '',
      discount_percentage:
        type === 'promotion'
          ? '15% OFF'
          : '',
      banner_image_url: '',
      cta_text: config.defaultCTA,
      cta_url: config.defaultURL,
      celebration_effect:
        config.defaultEffect,
      is_active: true,
      auto_close_seconds:
        config.defaultTimer,
      trigger_mode:
        config.defaultTrigger,
      required_activities:
        type === 'promotion'
          ? [createDefaultActivity()]
          : [],
      special_items:
        type === 'flash_sale'
          ? [createDefaultSpecialItem()]
          : []
    })

    setEditingId(null)
    setFormMode(mode)
  }

  /*
   * ============================================================
   * EDIT
   * ============================================================
   */

  const handleEdit = (ev: StoreEvent) => {
    const migratedItems =
      (ev.special_items || []).map(
        (item: any) => {
          if (
            item.addons &&
            !item.addon_groups
          ) {
            return {
              ...item,
              addon_groups: [
                {
                  id: `grp-${Date.now()}`,
                  title: 'Extras',
                  max_selections:
                    item.addons.length,
                  addons:
                    item.addons.map(
                      (a: any) => ({
                        ...a,
                        image_url:
                          a.image_url || ''
                      })
                    )
                }
              ]
            }
          }

          return {
            ...item,
            addon_groups:
              item.addon_groups || []
          }
        }
      )

    const hasPackages =
      migratedItems.length > 0

    const mode =
      hasPackages
        ? 'weekend'
        : 'promo'

    setFormData({
      title: ev.title || '',
      subtitle: ev.subtitle || '',
      event_type:
        ev.event_type || 'promotion',
      discount_code:
        ev.discount_code || '',
      discount_percentage:
        ev.discount_percentage || '',
      banner_image_url:
        ev.banner_image_url || '',
      cta_text:
        ev.cta_text || 'Claim Offer',
      cta_url:
        ev.cta_url || '/#our-menu-section',
      celebration_effect:
        ev.celebration_effect ||
        'flower_drop',
      is_active:
        ev.is_active ?? true,
      auto_close_seconds:
        ev.auto_close_seconds ?? 0,
      trigger_mode:
        ev.trigger_mode ||
        'every_refresh',
      required_activities:
        Array.isArray(
          ev.required_activities
        )
          ? ev.required_activities
          : [],
      special_items:
        migratedItems
    })

    setEditingId(ev.id)
    setFormMode(mode)
  }

  /*
   * ============================================================
   * ACTIVE / DELETE
   * ============================================================
   */

  const handleToggleActive = async (
    id: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } =
        await supabase
          .from('store_events')
          .update({
            is_active:
              !currentStatus
          })
          .eq('id', id)

      if (error) throw error

      fetchEvents()
    } catch (err: any) {
      alert(
        err.message ||
          'Failed to toggle event.'
      )
    }
  }

  const handleDelete = async (
    id: string
  ) => {
    if (
      !confirm(
        'Are you sure you want to delete this event/promo?'
      )
    ) {
      return
    }

    try {
      const { error } =
        await supabase
          .from('store_events')
          .delete()
          .eq('id', id)

      if (error) throw error

      fetchEvents()
    } catch (err: any) {
      alert(
        err.message ||
          'Failed to delete event.'
      )
    }
  }

  /*
   * ============================================================
   * IMAGE UPLOADS
   * ============================================================
   */

  const handleGenericUpload =
    async (file: File) => {
      const extension =
        file.name
          .split('.')
          .pop() || 'jpg'

      const fileName =
        `uploads/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${extension}`

      const { error } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(
            fileName,
            file
          )

      if (error) throw error

      const {
        data: { publicUrl }
      } =
        supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(
            fileName
          )

      return publicUrl
    }

  const handleBannerUpload =
    async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (
        !e.target.files?.[0]
      ) {
        return
      }

      try {
        setUploadingBanner(true)

        const url =
          await handleGenericUpload(
            e.target.files[0]
          )

        setFormData(prev => ({
          ...prev,
          banner_image_url: url
        }))
      } catch (err: any) {
        alert(
          `Upload failed: ${err.message}`
        )
      } finally {
        setUploadingBanner(false)
      }
    }

  const handleItemImageUpload =
    async (
      itemId: string,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (
        !e.target.files?.[0]
      ) {
        return
      }

      try {
        setUploadTarget(
          `item-${itemId}`
        )

        const url =
          await handleGenericUpload(
            e.target.files[0]
          )

        setFormData(prev => ({
          ...prev,
          special_items:
            prev.special_items.map(
              item =>
                item.id === itemId
                  ? {
                      ...item,
                      image_url: url
                    }
                  : item
            )
        }))
      } catch (err: any) {
        alert(
          `Upload failed: ${err.message}`
        )
      } finally {
        setUploadTarget(null)
      }
    }

  const handleAddonImageUpload =
    async (
      itemId: string,
      groupId: string,
      addonId: string,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (
        !e.target.files?.[0]
      ) {
        return
      }

      try {
        setUploadTarget(
          `addon-${addonId}`
        )

        const url =
          await handleGenericUpload(
            e.target.files[0]
          )

        setFormData(prev => ({
          ...prev,
          special_items:
            prev.special_items.map(
              item =>
                item.id === itemId
                  ? {
                      ...item,
                      addon_groups:
                        item.addon_groups.map(
                          group =>
                            group.id ===
                            groupId
                              ? {
                                  ...group,
                                  addons:
                                    group.addons.map(
                                      addon =>
                                        addon.id ===
                                        addonId
                                          ? {
                                              ...addon,
                                              image_url:
                                                url
                                            }
                                          : addon
                                    )
                                }
                              : group
                        )
                    }
                  : item
            )
        }))
      } catch (err: any) {
        alert(
          `Upload failed: ${err.message}`
        )
      } finally {
        setUploadTarget(null)
      }
    }

  /*
   * ============================================================
   * ACTIVITIES
   * ============================================================
   */

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      required_activities: [
        ...prev.required_activities,
        {
          id: `act-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          title:
            'Follow Us',
          description:
            'Complete this activity to qualify.',
          platform:
            'instagram',
          action_url:
            'https://instagram.com',
          verification_seconds: 4
        }
      ]
    }))
  }

  const removeActivity = (
    id: string
  ) => {
    setFormData(prev => ({
      ...prev,
      required_activities:
        prev.required_activities.filter(
          activity =>
            activity.id !== id
        )
    }))
  }

  const updateActivity = (
    id: string,
    field: keyof EventActivity,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      required_activities:
        prev.required_activities.map(
          activity =>
            activity.id === id
              ? {
                  ...activity,
                  [field]: value
                }
              : activity
        )
    }))
  }

  /*
   * ============================================================
   * SPECIAL ITEMS
   * ============================================================
   */

  const addSpecialItem = () => {
    setFormData(prev => ({
      ...prev,
      special_items: [
        ...prev.special_items,
        {
          id: `item-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          name:
            'New Flash Sale Package',
          price: 5000,
          discount_percentage: 0,
          description: '',
          image_url: '',
          addon_groups: []
        }
      ]
    }))
  }

  const removeSpecialItem = (
    id: string
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.filter(
          item =>
            item.id !== id
        )
    }))
  }

  const updateSpecialItem = (
    id: string,
    field: keyof EventSpecialItem,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.map(
          item =>
            item.id === id
              ? {
                  ...item,
                  [field]: value
                }
              : item
        )
    }))
  }

  /*
   * ============================================================
   * ADDON GROUPS
   * ============================================================
   */

  const addAddonGroup = (
    itemId: string
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.map(
          item =>
            item.id === itemId
              ? {
                  ...item,
                  addon_groups: [
                    ...(item.addon_groups ||
                      []),
                    {
                      id: `grp-${Date.now()}`,
                      title:
                        'Choose Options',
                      max_selections: 1,
                      addons: []
                    }
                  ]
                }
              : item
        )
    }))
  }

  const removeAddonGroup = (
    itemId: string,
    groupId: string
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.map(
          item =>
            item.id === itemId
              ? {
                  ...item,
                  addon_groups:
                    item.addon_groups.filter(
                      group =>
                        group.id !==
                        groupId
                    )
                }
              : item
        )
    }))
  }

  const updateAddonGroup = (
    itemId: string,
    groupId: string,
    field: keyof EventAddonGroup,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.map(
          item =>
            item.id === itemId
              ? {
                  ...item,
                  addon_groups:
                    item.addon_groups.map(
                      group =>
                        group.id ===
                        groupId
                          ? {
                              ...group,
                              [field]:
                                value
                            }
                          : group
                    )
                }
              : item
        )
    }))
  }

  const addAddonToGroup = (
    itemId: string,
    groupId: string
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.map(
          item =>
            item.id === itemId
              ? {
                  ...item,
                  addon_groups:
                    item.addon_groups.map(
                      group =>
                        group.id ===
                        groupId
                          ? {
                              ...group,
                              addons: [
                                ...group.addons,
                                {
                                  id: `add-${Date.now()}`,
                                  name:
                                    'Option',
                                  price: 0,
                                  image_url:
                                    ''
                                }
                              ]
                            }
                          : group
                    )
                }
              : item
        )
    }))
  }

  const removeAddonFromGroup = (
    itemId: string,
    groupId: string,
    addonId: string
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.map(
          item =>
            item.id === itemId
              ? {
                  ...item,
                  addon_groups:
                    item.addon_groups.map(
                      group =>
                        group.id ===
                        groupId
                          ? {
                              ...group,
                              addons:
                                group.addons.filter(
                                  addon =>
                                    addon.id !==
                                    addonId
                                )
                            }
                          : group
                    )
                }
              : item
        )
    }))
  }

  const updateAddonInGroup = (
    itemId: string,
    groupId: string,
    addonId: string,
    field: keyof EventAddon,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      special_items:
        prev.special_items.map(
          item =>
            item.id === itemId
              ? {
                  ...item,
                  addon_groups:
                    item.addon_groups.map(
                      group =>
                        group.id ===
                        groupId
                          ? {
                              ...group,
                              addons:
                                group.addons.map(
                                  addon =>
                                    addon.id ===
                                    addonId
                                      ? {
                                          ...addon,
                                          [field]:
                                            value
                                        }
                                      : addon
                                )
                            }
                          : group
                    )
                }
              : item
        )
    }))
  }

  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (
      !formData.title.trim()
    ) {
      return alert(
        'Event title is required.'
      )
    }

    try {
      setSubmitting(true)

      const sanitizedActivities =
        formData.required_activities.map(
          activity => ({
            ...activity,
            action_url:
              cleanActionUrl(
                activity.action_url
              )
          })
        )

      /*
       * Only send data that is relevant to
       * the selected campaign type.
       */
      const payload = {
        title:
          formData.title.trim(),

        subtitle:
          formData.subtitle.trim(),

        event_type:
          formData.event_type,

        celebration_effect:
          formData.celebration_effect,

        banner_image_url:
          formData.banner_image_url?.trim() ||
          null,

        is_active:
          formData.is_active,

        auto_close_seconds:
          Number(
            formData.auto_close_seconds
          ) || 0,

        trigger_mode:
          formData.trigger_mode,

        cta_text:
          formData.cta_text.trim(),

        cta_url:
          formData.cta_url.trim(),

        discount_code:
          formData.event_type ===
          'promotion'
            ? formData.discount_code?.trim() ||
              null
            : null,

        discount_percentage:
          formData.event_type ===
          'promotion'
            ? formData.discount_percentage?.trim() ||
              null
            : null,

        required_activities:
          formData.event_type ===
            'promotion' ||
          formData.event_type ===
            'giveaway'
            ? sanitizedActivities
            : [],

        special_items:
          formData.event_type ===
          'flash_sale'
            ? formData.special_items
            : [],

        updated_at:
          new Date().toISOString()
      }

      if (editingId) {
        const { error } =
          await supabase
            .from('store_events')
            .update(payload)
            .eq('id', editingId)

        if (error) throw error

        alert(
          'Campaign updated successfully!'
        )
      } else {
        const { error } =
          await supabase
            .from('store_events')
            .insert([payload])

        if (error) throw error

        alert(
          'New Campaign published successfully!'
        )
      }

      setFormMode('none')
      setEditingId(null)

      await fetchEvents()
    } catch (err: any) {
      alert(
        err.message ||
          'Failed to save campaign.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  /*
   * ============================================================
   * UI HELPERS
   * ============================================================
   */

  const eventConfig =
    getEventTypeConfig(
      formData.event_type
    )

  const EventIcon =
    eventConfig.icon

  const isPromotion =
    formData.event_type ===
    'promotion'

  const isGiveaway =
    formData.event_type ===
    'giveaway'

  const isFlashSale =
    formData.event_type ===
    'flash_sale'

  const isAnnouncement =
    formData.event_type ===
    'announcement'

  const isTaskCampaign =
    isPromotion ||
    isGiveaway

  return (
    <div className="min-h-screen bg-[#0F1419] text-white font-sans pb-24">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="bg-gradient-to-r from-[#1a1f2e] to-[#131821] border-b border-[#EAA823]/20 p-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          <div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-[#EAA823]" />

              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Events, Giveaways &amp; Campaigns
              </h1>
            </div>

            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Build intelligent campaigns where the available
              settings automatically adapt to the selected event type.
            </p>
          </div>

          <Link href="/admin/dashboard">
            <Button
              variant="secondary"
              className="gap-2 bg-[#EAA823]/10 text-[#EAA823] hover:bg-[#EAA823] hover:text-[#0A2E1D] border border-[#EAA823]/30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>

        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

        {/* ====================================================
            CREATE BUTTONS
        ===================================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex flex-wrap items-center gap-3">

            <Button
              onClick={() =>
                resetForm('promo')
              }
              className="bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold gap-2 rounded-xl shadow-lg cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              Create Promotion
            </Button>

            <Button
              onClick={() => {
                setFormMode('promo')
                setEditingId(null)
                applyEventTypeDefaults(
                  'giveaway'
                )
              }}
              className="bg-purple-600 text-white hover:bg-purple-500 font-bold gap-2 rounded-xl shadow-lg cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              Create Giveaway
            </Button>

            <Button
              onClick={() =>
                resetForm('weekend')
              }
              className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold gap-2 rounded-xl shadow-lg cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Create Flash Sale
            </Button>

            <Button
              onClick={() => {
                setFormMode('promo')
                setEditingId(null)
                applyEventTypeDefaults(
                  'announcement'
                )
              }}
              className="bg-blue-600 text-white hover:bg-blue-500 font-bold gap-2 rounded-xl shadow-lg cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              Create Announcement
            </Button>

          </div>

          <Link
            href="/"
            target="_blank"
            className="text-xs text-[#EAA823] font-bold flex items-center gap-1 hover:underline"
          >
            Test Live Storefront
            <Eye className="w-3.5 h-3.5" />
          </Link>

        </div>

        {/* ====================================================
            CAMPAIGN EDITOR
        ===================================================== */}

        {formMode !== 'none' && (
          <form
            onSubmit={handleSave}
            className="bg-[#1a1f2e] border border-[#EAA823]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >

            {/* EDITOR HEADER */}

            <div className="flex justify-between items-center pb-4 border-b border-white/10">

              <div>
                <div className="flex items-center gap-2">

                  <EventIcon
                    className="w-5 h-5 text-[#EAA823]"
                  />

                  <h3 className="font-extrabold text-lg text-white">
                    Campaign Settings &amp; Customization
                  </h3>

                </div>

                <p className="text-xs text-gray-400 mt-1">
                  {eventConfig.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormMode('none')
                }
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>

            </div>

            {/* =================================================
                EVENT TYPE SELECTOR
            ================================================== */}

            <div className="bg-[#131821] rounded-2xl border border-[#EAA823]/20 p-5">

              <div className="flex items-center gap-2 mb-3">

                <Settings2 className="w-4 h-4 text-[#EAA823]" />

                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Campaign Type
                  </h4>

                  <p className="text-[10px] text-gray-500">
                    Changing this will automatically
                    adjust the campaign settings below.
                  </p>
                </div>

              </div>

              <select
                value={
                  formData.event_type
                }
                onChange={e =>
                  applyEventTypeDefaults(
                    e.target.value as EventType
                  )
                }
                className="w-full bg-[#0F1419] border border-[#EAA823]/40 text-white text-sm rounded-xl p-3 outline-none focus:border-[#EAA823]"
              >

                <option value="promotion">
                  🎁 Promotion &amp; Discount
                </option>

                <option value="giveaway">
                  🏆 Giveaway &amp; Contest
                </option>

                <option value="flash_sale">
                  ⚡ Flash Sale
                </option>

                <option value="announcement">
                  📢 Announcement
                </option>

              </select>

              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">

                <div className="flex items-center gap-2">

                  <EventIcon className="w-4 h-4 text-[#EAA823]" />

                  <span className="text-xs font-bold text-white">
                    {eventConfig.label}
                  </span>

                </div>

                <p className="text-[10px] text-gray-400 mt-1">
                  {eventConfig.description}
                </p>

              </div>

            </div>

            {/* =================================================
                BASIC CONTENT
            ================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-1.5 md:col-span-2">

                <label className="text-xs font-bold text-gray-300 uppercase">
                  {isAnnouncement
                    ? 'Announcement Headline *'
                    : isGiveaway
                    ? 'Giveaway Headline *'
                    : isFlashSale
                    ? 'Flash Sale Headline *'
                    : 'Promotion Headline *'}
                </label>

                <Input
                  required
                  value={
                    formData.title
                  }
                  onChange={e =>
                    setFormData({
                      ...formData,
                      title:
                        e.target.value
                    })
                  }
                  className="bg-[#131821] border-[#EAA823]/30 text-white font-bold"
                />

              </div>

              <div className="space-y-1.5 md:col-span-2">

                <label className="text-xs font-bold text-gray-300 uppercase">
                  {isAnnouncement
                    ? 'Announcement Message'
                    : isGiveaway
                    ? 'Contest Instructions'
                    : isFlashSale
                    ? 'Flash Sale Message'
                    : 'Promotion Instructions'}
                </label>

                <Textarea
                  rows={3}
                  value={
                    formData.subtitle
                  }
                  onChange={e =>
                    setFormData({
                      ...formData,
                      subtitle:
                        e.target.value
                    })
                  }
                  className="bg-[#131821] border-[#EAA823]/30 text-white text-xs"
                />

              </div>

              {/* =================================================
                  BANNER
              ================================================== */}

              <div className="md:col-span-2 bg-[#131821] p-4 rounded-xl border border-white/5">

                <label className="text-xs font-bold text-gray-300 uppercase">
                  Campaign Banner / Featured Image
                </label>

                <div className="flex gap-2 mt-2">

                  <Input
                    value={
                      formData.banner_image_url
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        banner_image_url:
                          e.target.value
                      })
                    }
                    placeholder="URL or upload image"
                    className="bg-black/50 border-[#EAA823]/30 text-white text-xs flex-1"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    id="banner-upload"
                    className="hidden"
                    onChange={
                      handleBannerUpload
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document
                        .getElementById(
                          'banner-upload'
                        )
                        ?.click()
                    }
                    disabled={
                      uploadingBanner
                    }
                    className="border-[#EAA823]/50 text-gray-300 hover:text-white shrink-0"
                  >

                    {uploadingBanner ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}

                    Upload
                  </Button>

                </div>

                {formData.banner_image_url && (
                  <div className="mt-3 w-full max-w-sm h-32 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={
                        formData.banner_image_url
                      }
                      alt="Campaign Banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

              </div>

            </div>

            {/* =================================================
                PROMOTION SETTINGS
            ================================================== */}

            {isPromotion && (
              <div className="bg-[#131821] border border-amber-500/30 rounded-2xl p-5 space-y-5">

                <div className="flex items-center gap-2">

                  <TicketPercent className="w-5 h-5 text-amber-400" />

                  <div>
                    <h4 className="text-sm font-extrabold text-amber-300">
                      Promotion &amp; Voucher Configuration
                    </h4>

                    <p className="text-[10px] text-gray-500">
                      Configure the discount users receive after completing the campaign.
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-1.5">

                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Promo / Voucher Code
                    </label>

                    <Input
                      value={
                        formData.discount_code
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          discount_code:
                            e.target.value.toUpperCase()
                        })
                      }
                      placeholder="DEECHOI15"
                      className="bg-[#0F1419] border-amber-500/30 text-amber-300 font-mono font-bold"
                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Discount Display
                    </label>

                    <Input
                      value={
                        formData.discount_percentage
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          discount_percentage:
                            e.target.value
                        })
                      }
                      placeholder="15% OFF"
                      className="bg-[#0F1419] border-amber-500/30 text-white font-bold"
                    />

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                GIVEAWAY SETTINGS
            ================================================== */}

            {isGiveaway && (
              <div className="bg-[#131821] border border-purple-500/30 rounded-2xl p-5 space-y-5">

                <div className="flex items-center gap-2">

                  <Trophy className="w-5 h-5 text-purple-400" />

                  <div>
                    <h4 className="text-sm font-extrabold text-purple-300">
                      Giveaway &amp; Contest Configuration
                    </h4>

                    <p className="text-[10px] text-gray-500">
                      Define the reward and how participants qualify.
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-1.5">

                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Prize / Reward
                    </label>

                    <Input
                      value={
                        formData.discount_percentage
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          discount_percentage:
                            e.target.value
                        })
                      }
                      placeholder="e.g. ₦20,000 Cash + 10GB Data"
                      className="bg-[#0F1419] border-purple-500/30 text-purple-300 font-bold"
                    />

                  </div>

                  <div className="space-y-1.5">

                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Winner / Reward Reference
                    </label>

                    <Input
                      value={
                        formData.discount_code
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          discount_code:
                            e.target.value
                        })
                      }
                      placeholder="e.g. GIVEAWAY-AUG-2026"
                      className="bg-[#0F1419] border-purple-500/30 text-white"
                    />

                  </div>

                </div>

                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">

                  <div className="flex items-center gap-2">

                    <Users className="w-4 h-4 text-purple-400" />

                    <span className="text-xs font-bold text-purple-300">
                      Entry Requirements
                    </span>

                  </div>

                  <p className="text-[10px] text-gray-500 mt-1">
                    Add social activities below. Participants
                    must complete the configured activities before
                    they can qualify for the giveaway.
                  </p>

                </div>

              </div>
            )}

            {/* =================================================
                FLASH SALE SETTINGS
            ================================================== */}

            {isFlashSale && (
              <div className="bg-[#131821] border border-emerald-500/30 rounded-2xl p-5 space-y-4">

                <div className="flex items-center gap-2">

                  <Zap className="w-5 h-5 text-emerald-400" />

                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-300">
                      Flash Sale Configuration
                    </h4>

                    <p className="text-[10px] text-gray-500">
                      Configure limited-time products, prices, discounts and add-ons.
                    </p>
                  </div>

                </div>

                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">

                  <div className="flex items-center gap-2">

                    <Clock3 className="w-4 h-4 text-emerald-400" />

                    <span className="text-xs font-bold text-emerald-300">
                      Urgency Timer
                    </span>

                  </div>

                  <p className="text-[10px] text-gray-500 mt-1">
                    Use the auto-close timer below to create a
                    stronger time-sensitive flash-sale experience.
                  </p>

                </div>

              </div>
            )}

            {/* =================================================
                ANNOUNCEMENT SETTINGS
            ================================================== */}

            {isAnnouncement && (
              <div className="bg-[#131821] border border-blue-500/30 rounded-2xl p-5">

                <div className="flex items-center gap-2">

                  <Megaphone className="w-5 h-5 text-blue-400" />

                  <div>
                    <h4 className="text-sm font-extrabold text-blue-300">
                      Announcement Configuration
                    </h4>

                    <p className="text-[10px] text-gray-500">
                      This campaign is optimized for information,
                      notices, updates and important store messages.
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                DISPLAY / EXPERIENCE SETTINGS
            ================================================== */}

            <div className="bg-[#131821] border border-white/10 rounded-2xl p-5 space-y-4">

              <div className="flex items-center gap-2">

                <Settings2 className="w-4 h-4 text-[#EAA823]" />

                <h4 className="text-sm font-extrabold">
                  Campaign Experience
                </h4>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Celebration */}

                <div className="space-y-1.5">

                  <label className="text-xs font-bold text-gray-300 uppercase">
                    Celebration Effect
                  </label>

                  <select
                    value={
                      formData.celebration_effect
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        celebration_effect:
                          e.target.value as CelebrationEffect
                      })
                    }
                    className="w-full bg-[#0F1419] border border-white/10 text-white text-xs rounded-xl p-3 outline-none"
                  >

                    <option value="flower_drop">
                      🌸 Flower Drop
                    </option>

                    <option value="confetti">
                      🎊 Confetti Burst
                    </option>

                    <option value="gold_sparkles">
                      ✨ Gold Sparkles
                    </option>

                    <option value="none">
                      No Animation
                    </option>

                  </select>

                </div>

                {/* Trigger */}

                <div className="space-y-1.5">

                  <label className="text-xs font-bold text-gray-300 uppercase">
                    Popup Trigger
                  </label>

                  <select
                    value={
                      formData.trigger_mode
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        trigger_mode:
                          e.target.value as TriggerMode
                      })
                    }
                    className="w-full bg-[#0F1419] border border-white/10 text-white text-xs rounded-xl p-3 outline-none"
                  >

                    <option value="every_refresh">
                      Every Refresh
                    </option>

                    <option value="first_visit">
                      First Visit Only
                    </option>

                  </select>

                </div>

                {/* Timer */}

                <div className="space-y-1.5">

                  <label className="text-xs font-bold text-gray-300 uppercase">
                    Auto-Close / Urgency Timer
                  </label>

                  <Input
                    type="number"
                    min="0"
                    max="300"
                    value={
                      formData.auto_close_seconds
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        auto_close_seconds:
                          Number(
                            e.target.value
                          )
                      })
                    }
                    placeholder="0 = Stay open"
                    className="bg-[#0F1419] border-white/10 text-white"
                  />

                  <p className="text-[9px] text-gray-500">
                    {isFlashSale
                      ? 'Recommended for flash sales.'
                      : '0 keeps the popup open until the customer closes it.'}
                  </p>

                </div>

                {/* CTA */}

                <div className="space-y-1.5">

                  <label className="text-xs font-bold text-gray-300 uppercase">
                    CTA Button Text
                  </label>

                  <Input
                    value={
                      formData.cta_text
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        cta_text:
                          e.target.value
                      })
                    }
                    className="bg-[#0F1419] border-white/10 text-white"
                  />

                </div>

                <div className="space-y-1.5 md:col-span-2">

                  <label className="text-xs font-bold text-gray-300 uppercase">
                    CTA Destination
                  </label>

                  <Input
                    value={
                      formData.cta_url
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        cta_url:
                          e.target.value
                      })
                    }
                    placeholder="/#our-menu-section"
                    className="bg-[#0F1419] border-white/10 text-white"
                  />

                </div>

              </div>

            </div>

            {/* =================================================
                TASK / ENTRY BUILDER
            ================================================== */}

            {isTaskCampaign && (
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isGiveaway
                    ? 'bg-purple-500/5 border-purple-500/30'
                    : 'bg-[#131821] border-[#EAA823]/30'
                }`}
              >

                <div className="flex items-center justify-between pb-2 border-b border-white/10">

                  <div>

                    <h4
                      className={`text-sm font-extrabold flex items-center gap-2 ${
                        isGiveaway
                          ? 'text-purple-300'
                          : 'text-[#EAA823]'
                      }`}
                    >

                      {isGiveaway ? (
                        <Trophy className="w-4 h-4" />
                      ) : (
                        <CheckSquare className="w-4 h-4" />
                      )}

                      {isGiveaway
                        ? 'Giveaway Entry Tasks'
                        : 'Promotion Qualification Tasks'}

                    </h4>

                    <p className="text-[10px] text-gray-500 mt-1">
                      {isGiveaway
                        ? 'Configure the actions users must complete to enter.'
                        : 'Configure the actions users must complete to unlock the voucher.'}
                    </p>

                  </div>

                  <Button
                    type="button"
                    onClick={
                      addActivity
                    }
                    className={`text-xs font-bold rounded-xl gap-1 cursor-pointer ${
                      isGiveaway
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-[#EAA823] hover:bg-white text-[#0A2E1D]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </Button>

                </div>

                <div className="space-y-3">

                  {formData.required_activities.map(
                    (activity, index) => (
                      <div
                        key={
                          activity.id
                        }
                        className="p-4 bg-[#1a1f2e] border border-white/10 rounded-xl space-y-3"
                      >

                        <div className="flex justify-between">

                          <span
                            className={`text-xs font-bold ${
                              isGiveaway
                                ? 'text-purple-300'
                                : 'text-amber-300'
                            }`}
                          >
                            {isGiveaway
                              ? `Entry Requirement #${
                                  index + 1
                                }`
                              : `Task #${
                                  index + 1
                                }`}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeActivity(
                                activity.id
                              )
                            }
                            className="text-red-400 p-1 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                          <div className="sm:col-span-2 space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Task Title
                            </label>

                            <Input
                              value={
                                activity.title
                              }
                              onChange={e =>
                                updateActivity(
                                  activity.id,
                                  'title',
                                  e.target.value
                                )
                              }
                              className="bg-[#131821] border-gray-700 text-xs text-white"
                            />

                          </div>

                          <div className="space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Platform
                            </label>

                            <select
                              value={
                                activity.platform
                              }
                              onChange={e =>
                                updateActivity(
                                  activity.id,
                                  'platform',
                                  e.target.value
                                )
                              }
                              className="w-full bg-[#131821] border border-gray-700 text-white text-xs rounded-xl p-2.5"
                            >

                              <option value="tiktok">
                                TikTok
                              </option>

                              <option value="instagram">
                                Instagram
                              </option>

                              <option value="facebook">
                                Facebook
                              </option>

                              <option value="youtube">
                                YouTube
                              </option>

                              <option value="whatsapp">
                                WhatsApp
                              </option>

                              <option value="website">
                                Website
                              </option>

                            </select>

                          </div>

                          <div className="sm:col-span-2 space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Target Link
                            </label>

                            <Input
                              value={
                                activity.action_url
                              }
                              onChange={e =>
                                updateActivity(
                                  activity.id,
                                  'action_url',
                                  e.target.value
                                )
                              }
                              className="bg-[#131821] border-gray-700 text-xs text-white"
                            />

                          </div>

                          <div className="space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Verification Seconds
                            </label>

                            <Input
                              type="number"
                              min="2"
                              max="60"
                              value={
                                activity.verification_seconds
                              }
                              onChange={e =>
                                updateActivity(
                                  activity.id,
                                  'verification_seconds',
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="bg-[#131821] border-gray-700 text-xs text-white font-bold"
                            />

                          </div>

                          <div className="sm:col-span-3 space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Task Description
                            </label>

                            <Input
                              value={
                                activity.description ||
                                ''
                              }
                              onChange={e =>
                                updateActivity(
                                  activity.id,
                                  'description',
                                  e.target.value
                                )
                              }
                              placeholder="Explain what the customer needs to do."
                              className="bg-[#131821] border-gray-700 text-xs text-white"
                            />

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* =================================================
                FLASH SALE PRODUCTS
            ================================================== */}

            {isFlashSale && (
              <div className="bg-[#131821] p-5 rounded-2xl border border-emerald-600/50 space-y-4">

                <div className="flex items-center justify-between pb-2 border-b border-white/10">

                  <div>

                    <h4 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Flash Sale Products (
                      {
                        formData.special_items.length
                      }
                      )
                    </h4>

                    <p className="text-[10px] text-gray-500 mt-1">
                      Products configured here become the special
                      shoppable items for this flash sale.
                    </p>

                  </div>

                  <Button
                    type="button"
                    onClick={
                      addSpecialItem
                    }
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product
                  </Button>

                </div>

                <div className="space-y-4">

                  {formData.special_items.map(
                    (item, index) => (
                      <div
                        key={
                          item.id
                        }
                        className="p-4 bg-[#1a1f2e] border border-white/10 rounded-xl space-y-4"
                      >

                        <div className="flex justify-between items-center">

                          <span className="text-xs font-bold text-emerald-300">
                            Flash Product #
                            {index + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeSpecialItem(
                                item.id
                              )
                            }
                            className="text-red-400 p-1 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                          <div className="space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Product / Package Name
                            </label>

                            <Input
                              value={
                                item.name
                              }
                              onChange={e =>
                                updateSpecialItem(
                                  item.id,
                                  'name',
                                  e.target.value
                                )
                              }
                              className="bg-[#131821] border-gray-700 text-xs text-white font-bold"
                            />

                          </div>

                          <div className="space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Base Price (₦)
                            </label>

                            <Input
                              type="number"
                              min="0"
                              value={
                                item.price
                              }
                              onChange={e =>
                                updateSpecialItem(
                                  item.id,
                                  'price',
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="bg-[#131821] border-gray-700 text-xs text-white font-bold"
                            />

                          </div>

                          <div className="space-y-1">

                            <label className="text-[10px] text-amber-400 font-bold uppercase">
                              Flash Discount %
                            </label>

                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={
                                item.discount_percentage ||
                                0
                              }
                              onChange={e =>
                                updateSpecialItem(
                                  item.id,
                                  'discount_percentage',
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="bg-[#2d2210] border-amber-500/50 text-amber-300 text-xs font-bold"
                            />

                          </div>

                          <div className="space-y-1 sm:col-span-2">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Product Description
                            </label>

                            <Textarea
                              rows={2}
                              value={
                                item.description
                              }
                              onChange={e =>
                                updateSpecialItem(
                                  item.id,
                                  'description',
                                  e.target.value
                                )
                              }
                              className="bg-[#131821] border-gray-700 text-xs text-white"
                            />

                          </div>

                          {/* IMAGE */}

                          <div className="sm:col-span-2 space-y-1">

                            <label className="text-[10px] text-gray-400 uppercase">
                              Product Image
                            </label>

                            <div className="flex gap-2">

                              <div className="bg-black/50 border border-gray-700 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">

                                {item.image_url ? (
                                  <img
                                    src={
                                      item.image_url
                                    }
                                    alt="Product"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-gray-500" />
                                )}

                              </div>

                              <Input
                                value={
                                  item.image_url
                                }
                                onChange={e =>
                                  updateSpecialItem(
                                    item.id,
                                    'image_url',
                                    e.target.value
                                  )
                                }
                                placeholder="URL or Upload"
                                className="bg-[#131821] border-gray-700 text-xs text-white flex-1 h-10"
                              />

                              <input
                                type="file"
                                accept="image/*"
                                id={`upload-${item.id}`}
                                className="hidden"
                                onChange={e =>
                                  handleItemImageUpload(
                                    item.id,
                                    e
                                  )
                                }
                              />

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById(
                                      `upload-${item.id}`
                                    )
                                    ?.click()
                                }
                                disabled={
                                  uploadTarget ===
                                  `item-${item.id}`
                                }
                                className="border-gray-700 text-gray-300 hover:text-white shrink-0 h-10"
                              >

                                {uploadTarget ===
                                `item-${item.id}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-1.5" />
                                )}

                                Upload

                              </Button>

                            </div>

                          </div>

                          {/* ADDON GROUPS */}

                          <div className="sm:col-span-2 mt-3 space-y-3">

                            <div className="flex justify-between items-center">

                              <div>

                                <span className="text-xs font-bold text-gray-300">
                                  Customer Add-ons
                                </span>

                                <p className="text-[9px] text-gray-500">
                                  Optional extras customers can select.
                                </p>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  addAddonGroup(
                                    item.id
                                  )
                                }
                                className="text-[10px] bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded"
                              >
                                + Add Options Group
                              </button>

                            </div>

                            {item.addon_groups?.map(
                              group => (
                                <div
                                  key={
                                    group.id
                                  }
                                  className="bg-[#0c1015] p-3 rounded-lg border border-gray-700 space-y-3"
                                >

                                  <div className="flex gap-2 items-end">

                                    <div className="flex-1 space-y-1">

                                      <label className="text-[9px] text-gray-400">
                                        Group Title
                                      </label>

                                      <Input
                                        value={
                                          group.title
                                        }
                                        onChange={e =>
                                          updateAddonGroup(
                                            item.id,
                                            group.id,
                                            'title',
                                            e.target.value
                                          )
                                        }
                                        className="bg-[#131821] border-gray-700 text-xs text-white h-8"
                                      />

                                    </div>

                                    <div className="w-24 space-y-1">

                                      <label className="text-[9px] text-gray-400">
                                        Max Choices
                                      </label>

                                      <Input
                                        type="number"
                                        min="1"
                                        value={
                                          group.max_selections
                                        }
                                        onChange={e =>
                                          updateAddonGroup(
                                            item.id,
                                            group.id,
                                            'max_selections',
                                            Number(
                                              e.target.value
                                            )
                                          )
                                        }
                                        className="bg-[#131821] border-gray-700 text-xs text-white h-8 text-center font-bold"
                                      />

                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeAddonGroup(
                                          item.id,
                                          group.id
                                        )
                                      }
                                      className="text-red-400 hover:bg-red-500/20 p-2 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                  </div>

                                  <div className="pl-2 border-l-2 border-gray-800 space-y-2">

                                    {group.addons.map(
                                      addon => (
                                        <div
                                          key={
                                            addon.id
                                          }
                                          className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-[#131821] p-2 rounded border border-white/5"
                                        >

                                          <div className="w-8 h-8 shrink-0 bg-black/40 rounded overflow-hidden flex items-center justify-center border border-gray-700">

                                            {addon.image_url ? (
                                              <img
                                                src={
                                                  addon.image_url
                                                }
                                                alt={
                                                  addon.name
                                                }
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <ImageIcon className="w-4 h-4 text-gray-600" />
                                            )}

                                          </div>

                                          <input
                                            type="file"
                                            accept="image/*"
                                            id={`upload-${addon.id}`}
                                            className="hidden"
                                            onChange={e =>
                                              handleAddonImageUpload(
                                                item.id,
                                                group.id,
                                                addon.id,
                                                e
                                              )
                                            }
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              document
                                                .getElementById(
                                                  `upload-${addon.id}`
                                                )
                                                ?.click()
                                            }
                                            className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-1.5 rounded border border-gray-600"
                                          >
                                            {uploadTarget ===
                                            `addon-${addon.id}` ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              'IMG'
                                            )}
                                          </button>

                                          <Input
                                            value={
                                              addon.name
                                            }
                                            onChange={e =>
                                              updateAddonInGroup(
                                                item.id,
                                                group.id,
                                                addon.id,
                                                'name',
                                                e.target.value
                                              )
                                            }
                                            placeholder="e.g. Zobo"
                                            className="bg-transparent border-gray-700 text-xs text-white h-8 min-w-[120px] flex-1"
                                          />

                                          <Input
                                            type="number"
                                            min="0"
                                            value={
                                              addon.price
                                            }
                                            onChange={e =>
                                              updateAddonInGroup(
                                                item.id,
                                                group.id,
                                                addon.id,
                                                'price',
                                                Number(
                                                  e.target.value
                                                )
                                              )
                                            }
                                            placeholder="Price"
                                            className="bg-transparent border-gray-700 text-xs h-8 w-24 text-emerald-300 font-bold"
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeAddonFromGroup(
                                                item.id,
                                                group.id,
                                                addon.id
                                              )
                                            }
                                            className="text-red-400 hover:bg-red-500/20 p-1 rounded"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>

                                        </div>
                                      )
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        addAddonToGroup(
                                          item.id,
                                          group.id
                                        )
                                      }
                                      className="text-[10px] text-emerald-400 mt-1 hover:underline"
                                    >
                                      + Add Option
                                    </button>

                                  </div>

                                </div>
                              )
                            )}

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* =================================================
                FINAL CAMPAIGN STATE
            ================================================== */}

            <div className="flex items-center justify-between p-4 bg-[#131821] rounded-2xl border border-[#EAA823]/20">

              <div>

                <span className="text-sm font-bold text-white block">
                  Publish Campaign Live
                </span>

                <span className="text-[10px] text-gray-500">
                  Customers can see this campaign immediately.
                </span>

              </div>

              <input
                type="checkbox"
                checked={
                  formData.is_active
                }
                onChange={e =>
                  setFormData({
                    ...formData,
                    is_active:
                      e.target.checked
                  })
                }
                className="w-5 h-5 accent-[#EAA823] cursor-pointer"
              />

            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3 pt-2">

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormMode('none')
                }
                className="border-gray-600 text-gray-300 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  submitting
                }
                className={`font-bold px-6 cursor-pointer ${
                  isFlashSale
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : isGiveaway
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : isAnnouncement
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-[#EAA823] hover:bg-white text-[#0A2E1D]'
                }`}
              >

                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}

                {editingId
                  ? 'Update Campaign'
                  : 'Publish Campaign'}

              </Button>

            </div>

          </form>
        )}

        {/* ====================================================
            EXISTING CAMPAIGNS
        ===================================================== */}

        {loading ? (

          <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-2">

            <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />

            <p className="text-xs">
              Loading campaigns...
            </p>

          </div>

        ) : events.length === 0 ? (

          <div className="bg-[#1a1f2e] border border-dashed border-gray-700 rounded-3xl p-12 text-center space-y-3">

            <Sparkles className="w-10 h-10 text-[#EAA823] mx-auto opacity-50" />

            <h4 className="font-bold text-white">
              No campaigns created yet.
            </h4>

            <p className="text-xs text-gray-500">
              Create a promotion, giveaway,
              flash sale or announcement above.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {events.map(ev => {

              const hasPackages =
                Array.isArray(
                  ev.special_items
                ) &&
                ev.special_items.length >
                  0

              const Config =
                getEventTypeConfig(
                  ev.event_type
                )

              const Icon =
                Config.icon

              return (
                <div
                  key={ev.id}
                  className={`bg-gradient-to-br from-[#1a1f2e] to-[#131821] p-5 rounded-2xl border transition-all space-y-4 ${
                    ev.is_active
                      ? 'border-[#EAA823]/50 shadow-lg'
                      : 'border-white/10 opacity-70'
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="space-y-1 min-w-0">

                      <div className="flex items-center gap-2">

                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-gray-200 flex items-center gap-1">

                          <Icon className="w-3 h-3" />

                          {hasPackages
                            ? 'FLASH SALE'
                            : Config.label}

                        </span>

                        {ev.is_active ? (

                          <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">

                            <CheckCircle2 className="w-3 h-3" />

                            Live

                          </span>

                        ) : (

                          <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">

                            <XCircle className="w-3 h-3" />

                            Paused

                          </span>

                        )}

                      </div>

                      <h4 className="font-black text-white text-base leading-tight">
                        {ev.title}
                      </h4>

                      <p className="text-xs text-gray-400 line-clamp-2">
                        {ev.subtitle}
                      </p>

                    </div>

                    <div className="flex items-center gap-1">

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleEdit(ev)
                        }
                        className="text-gray-300 hover:text-white p-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(
                            ev.id
                          )
                        }
                        className="text-red-400 hover:text-red-300 p-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                    </div>

                  </div>

                  <div className="flex items-center justify-between pt-1">

                    <span className="text-[11px] text-gray-400">

                      Trigger:{' '}

                      <b className="text-gray-200">
                        {ev.trigger_mode}
                      </b>

                    </span>

                    <button
                      onClick={() =>
                        handleToggleActive(
                          ev.id,
                          ev.is_active
                        )
                      }
                      className={`text-xs font-bold px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                        ev.is_active
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      }`}
                    >
                      {ev.is_active
                        ? 'Pause Campaign'
                        : 'Publish Live'}
                    </button>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>
    </div>
  )
}