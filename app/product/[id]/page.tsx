'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  Users,
  Plus,
  Minus,
  Loader2,
  Utensils,
  Sparkles,
  Flame,
  Fish,
  Check,
  AlertCircle,
  XCircle,
  ShieldAlert,
  Info
} from 'lucide-react'

interface Option {
  name: string
  price_modifier: number
  is_available: boolean
  description?: string
  has_counter?: boolean
  unit_price?: number
  multiplier?: number
  minimum_quantity?: number
  min_quantity?: number
  min_order_quantity?: number
  minimum_order_quantity?: number
  min_multiplier_count?: number
  has_cuts_selection?: boolean
  cut_selection_title?: string
  allowed_cuts?: string[]
  min_cuts_selection?: number
  max_cuts_selection?: number
}

interface OptionGroup {
  name: string
  is_required: boolean
  type?: 'radio' | 'checkbox'
  price_mode?: 'standalone' | 'addon'
  options: Option[]
}

interface SelectedOptionItem {
  groupName: string
  optionName: string
  priceModifier: number
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const productId = resolvedParams.id

  const router = useRouter()
  const { addItem } = useCart()
  const supabase = createClient()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Global & Time-Bound States
  const [isStoreLive, setIsStoreLive] = useState(true)
  const [isTimeValid, setIsTimeValid] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [quantity, setQuantity] = useState(1)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [selectedRadioOptions, setSelectedRadioOptions] = useState<Record<string, Option | null>>({})
  const [selectedCheckboxOptions, setSelectedCheckboxOptions] = useState<Record<string, boolean>>({})
  const [unitCounters, setUnitCounters] = useState<Record<string, number>>({})
  const [selectedCuts, setSelectedCuts] = useState<Record<string, string[]>>({})

  // Format 24h time to 12h AM/PM for friendly display
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hours = parseInt(h, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${m} ${ampm}`
  }

  useEffect(() => {
    setMounted(true)

    const checkStoreStatus = async () => {
      const storeStatus = localStorage.getItem('deechoi_storefront_active')
      if (storeStatus !== null) {
        setIsStoreLive(storeStatus === 'true')
      } else {
        const { data } = await supabase.from('store_settings').select('value').eq('key', 'storefront_active').single()
        if (data) {
          setIsStoreLive(data.value === 'true')
          localStorage.setItem('deechoi_storefront_active', data.value)
        }
      }
    }

    checkStoreStatus()

    window.addEventListener('storage', checkStoreStatus)
    window.addEventListener('deechoi_store_status_change', checkStoreStatus)

    return () => {
      window.removeEventListener('storage', checkStoreStatus)
      window.removeEventListener('deechoi_store_status_change', checkStoreStatus)
    }
  }, [supabase])

  useEffect(() => {
    if (product?.is_time_bound && product?.available_from && product?.available_to) {
      const checkTime = () => {
        const now = new Date()
        const currentHour = now.getHours().toString().padStart(2, '0')
        const currentMinute = now.getMinutes().toString().padStart(2, '0')
        const currentTime = `${currentHour}:${currentMinute}`

        let valid = false
        if (product.available_from < product.available_to) {
          valid = currentTime >= product.available_from && currentTime <= product.available_to
        } else {
          valid = currentTime >= product.available_from || currentTime <= product.available_to
        }

        setIsTimeValid(valid)
      }

      checkTime()
      const intervalId = setInterval(checkTime, 60000)
      return () => clearInterval(intervalId)
    } else {
      setIsTimeValid(true)
    }
  }, [product])

  const getPositiveNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed)
    }
    return null
  }

  const getCounterMinimum = (option: Option | null | undefined): number => {
    if (!option) return 1
    const minCount = getPositiveNumber(option.min_multiplier_count)
    if (minCount !== null && minCount > 0) {
      return minCount
    }
    return 1
  }

  const getMinimumOrderQuantity = (productData: any): number => {
    if (!productData) return 1
    const configuredMinimum = Number(productData?.min_order_quantity)
    if (Number.isFinite(configuredMinimum) && configuredMinimum >= 1) {
      return Math.floor(configuredMinimum)
    }
    return 1
  }

  const isMinimumQuantityEnabled = (productData: any): boolean => {
    if (!productData) return false
    const minimum = getMinimumOrderQuantity(productData)
    return minimum > 1
  }

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    try {
      setLoading(true)
      setValidationError(null)

      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      if (data) {
        setProduct(data)

        const minimumQuantity = getMinimumOrderQuantity(data)
        setQuantity(Math.max(1, minimumQuantity))

        const defaults: Record<string, Option | null> = {}
        const counters: Record<string, number> = {}
        const cuts: Record<string, string[]> = {}

        if (Array.isArray(data.customization_options)) {
          data.customization_options.forEach((group: OptionGroup) => {
            if (group.is_required === true && (!group.type || group.type === 'radio') && Array.isArray(group.options) && group.options.length > 0) {
              const defaultOpt = group.options[0]
              defaults[group.name] = defaultOpt

              if (defaultOpt.has_counter) {
                counters[defaultOpt.name] = getCounterMinimum(defaultOpt)
              }

              if (Boolean(defaultOpt.has_cuts_selection) && Array.isArray(defaultOpt.allowed_cuts) && defaultOpt.allowed_cuts.length > 0) {
                const minCount = defaultOpt.min_cuts_selection ?? 1
                cuts[defaultOpt.name] = defaultOpt.allowed_cuts.slice(0, Math.max(1, minCount))
              }
            } else {
              defaults[group.name] = null
            }
          })
        }

        setSelectedRadioOptions(defaults)
        setSelectedCheckboxOptions({})
        setUnitCounters(counters)
        setSelectedCuts(cuts)
      }
    } catch (err) {
      console.error('Error fetching product detail page:', err)
    } finally {
      setLoading(false)
    }
  }

  const isStandaloneGroup = (group: OptionGroup) => {
    if (group.price_mode === 'standalone') return true
    if (group.price_mode === 'addon') return false
    const gName = group.name.toLowerCase()
    return (
      gName.includes('portion') ||
      gName.includes('size') ||
      gName.includes('category') ||
      gName.includes('style') ||
      gName.includes('variant')
    )
  }

  const handleRadioClick = (group: OptionGroup, opt: Option) => {
    setValidationError(null)
    const isCurrentlySelected = selectedRadioOptions[group.name]?.name === opt.name

    if (isCurrentlySelected && !group.is_required) {
      const updated = { ...selectedRadioOptions }
      updated[group.name] = null
      setSelectedRadioOptions(updated)

      const updatedCuts = { ...selectedCuts }
      delete updatedCuts[opt.name]
      setSelectedCuts(updatedCuts)
      return
    }

    setSelectedRadioOptions({
      ...selectedRadioOptions,
      [group.name]: opt,
    })

    if (opt.has_counter) {
      const counterMinimum = getCounterMinimum(opt)
      setUnitCounters({
        ...unitCounters,
        [opt.name]: Math.max(counterMinimum, unitCounters[opt.name] || counterMinimum),
      })
    }

    if (Boolean(opt.has_cuts_selection) && Array.isArray(opt.allowed_cuts) && opt.allowed_cuts.length > 0) {
      if (!selectedCuts[opt.name] || selectedCuts[opt.name].length === 0) {
        const minCount = opt.min_cuts_selection ?? 1
        setSelectedCuts({
          ...selectedCuts,
          [opt.name]: opt.allowed_cuts.slice(0, Math.max(1, minCount)),
        })
      }
    }
  }

  const toggleCheckboxOption = (optName: string) => {
    setValidationError(null)
    setSelectedCheckboxOptions({
      ...selectedCheckboxOptions,
      [optName]: !selectedCheckboxOptions[optName]
    })
  }

  const toggleCut = (optionName: string, cutName: string, maxSelect: number = 1) => {
    setValidationError(null)
    const current = selectedCuts[optionName] || []

    if (current.includes(cutName)) {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]: current.filter((c) => c !== cutName),
      })
      return
    }

    if (maxSelect === 1) {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]: [cutName],
      })
      return
    }

    if (current.length < maxSelect) {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]: [...current, cutName],
      })
    } else {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]: [...current.slice(1), cutName],
      })
    }
  }

  const handleCounterChange = (option: Option, change: number) => {
    setValidationError(null)
    const minimum = getCounterMinimum(option)

    setUnitCounters((currentCounters) => {
      const current = currentCounters[option.name] || minimum
      const requested = current + change
      return {
        ...currentCounters,
        [option.name]: Math.max(minimum, requested),
      }
    })
  }

  const handleQuantityChange = (change: number) => {
    if (!product) return
    const minimumQuantity = getMinimumOrderQuantity(product)
    setValidationError(null)

    setQuantity((currentQuantity) => {
      const requestedQuantity = currentQuantity + change
      return Math.max(minimumQuantity, requestedQuantity)
    })
  }

  const calculateTotal = () => {
    if (!product) return 0
    let base = Number(product.price) || 0

    if (Array.isArray(product.customization_options)) {
      product.customization_options.forEach((group: OptionGroup) => {
        if (!group.type || group.type === 'radio') {
          const selectedOpt = selectedRadioOptions[group.name]
          if (selectedOpt && isStandaloneGroup(group)) {
            if (selectedOpt.has_counter) {
              const minimum = getCounterMinimum(selectedOpt)
              const count = Math.max(minimum, unitCounters[selectedOpt.name] || minimum)
              base = (selectedOpt.unit_price || selectedOpt.price_modifier || 0) * count
            } else {
              base = selectedOpt.price_modifier || 0
            }
          }
        }
      })

      product.customization_options.forEach((group: OptionGroup) => {
        if (!group.type || group.type === 'radio') {
          const selectedOpt = selectedRadioOptions[group.name]
          if (selectedOpt && !isStandaloneGroup(group)) {
            if (selectedOpt.has_counter) {
              const minimum = getCounterMinimum(selectedOpt)
              const count = Math.max(minimum, unitCounters[selectedOpt.name] || minimum)
              base += (selectedOpt.unit_price || selectedOpt.price_modifier || 0) * count
            } else {
              base += selectedOpt.price_modifier || 0
            }
          }
        }
      })
    }

    if (Array.isArray(product.customization_options)) {
      product.customization_options.forEach((group: OptionGroup) => {
        if (group.type === 'checkbox') {
          group.options.forEach((opt) => {
            if (selectedCheckboxOptions[opt.name]) {
              base += opt.price_modifier || 0
            }
          })
        }
      })
    }

    return base * quantity
  }

  const handleAddToCart = () => {
    if (!product) return

    const minimumQuantity = getMinimumOrderQuantity(product)

    if (quantity < minimumQuantity) {
      setQuantity(minimumQuantity)
      setValidationError(`Minimum order quantity for this product is ${minimumQuantity}.`)
      return
    }

    const isOutOfStock = product.in_stock === false || product.is_available === false

    if (isOutOfStock) {
      setValidationError('This product is currently out of stock.')
      return
    }

    if (Array.isArray(product.customization_options)) {
      for (const group of product.customization_options) {
        if (group.is_required && (!group.type || group.type === 'radio')) {
          const opt = selectedRadioOptions[group.name]
          if (!opt) {
            setValidationError(`Please select an option for "${group.name}".`)
            return
          }
        }

        if (!group.type || group.type === 'radio') {
          const opt = selectedRadioOptions[group.name]
          if (opt && Boolean(opt.has_cuts_selection)) {
            const minAllowed = opt.min_cuts_selection ?? 1
            const currentChosen = selectedCuts[opt.name] || []

            if (currentChosen.length < minAllowed) {
              setValidationError(`Please select at least ${minAllowed} piece cut${minAllowed > 1 ? 's' : ''} for "${opt.name}".`)
              return
            }
          }
        }
      }
    }

    const selectedOptionsList: SelectedOptionItem[] = []

    if (Array.isArray(product.customization_options)) {
      product.customization_options.forEach((group: OptionGroup) => {
        if (!group.type || group.type === 'radio') {
          const opt = selectedRadioOptions[group.name]
          if (opt) {
            let modifier = opt.price_modifier || 0
            let optDisplayName = opt.name

            if (opt.has_counter) {
              const minimum = getCounterMinimum(opt)
              const count = Math.max(minimum, unitCounters[opt.name] || minimum)
              modifier = (opt.unit_price || opt.price_modifier || 0) * count
              optDisplayName = `${opt.name} (${count} units)`
            }

            if (Boolean(opt.has_cuts_selection) && selectedCuts[opt.name] && selectedCuts[opt.name].length > 0) {
              optDisplayName += ` [Parts: ${selectedCuts[opt.name].join(', ')}]`
            }

            selectedOptionsList.push({
              groupName: group.name,
              optionName: optDisplayName,
              priceModifier: modifier,
            })
          }
        }
      })
    }

    if (Array.isArray(product.customization_options)) {
      product.customization_options.forEach((group: OptionGroup) => {
        if (group.type === 'checkbox') {
          group.options.forEach((opt) => {
            if (selectedCheckboxOptions[opt.name]) {
              selectedOptionsList.push({
                groupName: group.name,
                optionName: opt.name,
                priceModifier: opt.price_modifier || 0,
              })
            }
          })
        }
      })
    }

    const calculatedUnitPrice = calculateTotal() / quantity

    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: calculatedUnitPrice,
      quantity: quantity,
      imageUrl: product.image_url,
      selected_options: selectedOptionsList,
      product_name: product.name,
      unit_price: calculatedUnitPrice,
      final_price: calculatedUnitPrice,
      prep_time: product.preparation_time_minutes || undefined,
      cooking_time: undefined,
      fulfillment_time: undefined,
    })

    router.push('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
        <StorefrontHeader />
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />
          <p className="text-xs font-bold text-gray-500">Preparing delicious meal details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
        <StorefrontHeader />
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-2xl font-black text-[#0A2E1D]">Meal not found</h2>
          <p className="text-sm text-gray-500">The product you are looking for is currently unavailable.</p>
          <Link href="/#our-menu-section">
            <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6 cursor-pointer">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOutOfStock = product.in_stock === false || product.is_available === false
  const isTimeBlocked = isStoreLive && product.is_time_bound && !isTimeValid
  const isUnavailable = isOutOfStock || isTimeBlocked

  const minimumQuantity = getMinimumOrderQuantity(product)
  const minimumQuantityEnabled = isMinimumQuantityEnabled(product)

  const hasIngredients = Array.isArray(product.ingredients) && product.ingredients.length > 0
  const hasAllergens = Array.isArray(product.allergens) && product.allergens.length > 0
  const hasPrepTime = Boolean(product.preparation_time_minutes)
  const hasStorage = Boolean(product.storage_instructions)

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-28">
      <StorefrontHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/#our-menu-section"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          {/* HERO IMAGE */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-[#072d1d] to-[#041a11] border-2 border-[#EAA823]/30 shadow-2xl group">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  priority
                  className={`object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 ${
                    isUnavailable ? 'grayscale opacity-65' : ''
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                  <Utensils className="w-16 h-16" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40 pointer-events-none" />

              {isOutOfStock ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
                  <span className="bg-red-600 text-white font-black text-sm sm:text-base px-5 py-2.5 rounded-full uppercase shadow-xl tracking-wider flex items-center gap-2 border border-white/20">
                    <XCircle className="w-5 h-5" />
                    Currently Out of Stock
                  </span>
                </div>
              ) : isTimeBlocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-30 p-6 text-center">
                  <span className="bg-amber-500 text-[#072d1d] font-black text-xs sm:text-sm px-4 py-2 rounded-full uppercase tracking-wider mb-2 shadow-lg">
                    {product.menu_section ? `${product.menu_section.toUpperCase()} MENU CLOSED` : 'MENU CLOSED'}
                  </span>
                  <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-xl">
                    Available from {formatTime(product.available_from)} tomorrow
                  </span>
                </div>
              ) : (
                <div className="absolute top-3.5 left-3.5 z-20 flex flex-col gap-1.5 items-start">
                  <span className="bg-[#EAA823] text-[#072d1d] font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-full uppercase shadow-lg tracking-wider border border-white/20 flex items-center gap-1.5 backdrop-blur-md">
                    <Sparkles className="w-3 h-3 fill-current" />
                    {product.category || 'Specialty'}
                  </span>
                  
                  {product.is_time_bound && product.menu_section && (
                    <span className="bg-amber-100/95 backdrop-blur-md text-amber-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shadow-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {product.menu_section} Menu
                    </span>
                  )}
                </div>
              )}

              {/* Pre-Order Mode Badge */}
              {!isStoreLive && mounted && !isOutOfStock && (
                <div className="absolute top-3.5 right-3.5 z-20">
                  <span className="bg-amber-500 text-[#072d1d] text-xs font-black px-3 py-1.5 rounded-full uppercase shadow-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Pre-Order Mode
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-gray-500 font-semibold">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Cooked Fresh to Order
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                {product.servings || 1} Serving{product.servings > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* DETAILS */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-4xl font-black text-[#0A2E1D] leading-tight">
                  {product.name}
                </h1>
                {isOutOfStock && (
                  <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                    Sold Out
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {product.description || 'Prepared fresh with premium ingredients from the De-echoi kitchen in Woji, Port Harcourt.'}
              </p>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
                  {!isStoreLive && mounted ? 'Pre-Order Price' : 'Starting Price'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#0A2E1D]">
                  ₦{Number(product.price).toLocaleString()}
                </span>
              </div>

              {minimumQuantityEnabled && minimumQuantity > 1 && !isOutOfStock && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-black text-amber-800">Minimum order quantity</span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700">
                      You must order at least {minimumQuantity} units of this product.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* RECIPE SPECS, ALLERGENS & STORAGE INFO CARD */}
            {(hasPrepTime || hasIngredients || hasAllergens || hasStorage) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3.5">
                <h3 className="text-xs font-black uppercase text-[#0A2E1D] tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <Info className="w-4 h-4 text-[#EAA823]" />
                  <span>Preparation, Ingredients &amp; Storage Specs</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {hasPrepTime && (
                    <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2.5 rounded-xl">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold block text-[10px] uppercase text-gray-400">Prep Time</span>
                        <span className="font-extrabold text-[#0A2E1D]">{product.preparation_time_minutes} minutes</span>
                      </div>
                    </div>
                  )}

                  {product.servings && (
                    <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2.5 rounded-xl">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block text-[10px] uppercase text-gray-400">Serving Size</span>
                        <span className="font-extrabold text-[#0A2E1D]">{product.servings} Person{product.servings > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {hasIngredients && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Key Ingredients</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.ingredients.map((ing: string, i: number) => (
                        <span key={i} className="bg-emerald-50 text-emerald-900 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hasAllergens && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-extrabold uppercase text-red-500 block flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Allergen Notice
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.allergens.map((all: string, i: number) => (
                        <span key={i} className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                          {all}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hasStorage && (
                  <div className="space-y-1 pt-1 border-t border-gray-100 mt-2">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Storage Instructions</span>
                    <p className="text-xs text-gray-700 font-medium italic bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/50">
                      {product.storage_instructions}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ALERTS */}
            {isTimeBlocked && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">Menu Currently Closed</span>
                  <p className="text-[11px] font-medium leading-relaxed mt-0.5">
                    This menu is only active between {formatTime(product.available_from)} and {formatTime(product.available_to)}. 
                    {!isStoreLive ? ' You can still pre-order for tomorrow!' : ''}
                  </p>
                </div>
              </div>
            )}

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="font-semibold">{validationError}</span>
              </div>
            )}

            {/* CUSTOMIZATION OPTIONS & PIECE CUTS */}
            {!isOutOfStock && Array.isArray(product.customization_options) && product.customization_options.length > 0 && (
              <div className="space-y-4">
                {product.customization_options.map((group: OptionGroup, gIdx: number) => {
                  const isStandalone = isStandaloneGroup(group)
                  const selectedGroupOpt = selectedRadioOptions[group.name]

                  return (
                    <div key={gIdx} className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${isTimeBlocked ? 'bg-gray-100 border-gray-200 opacity-60 pointer-events-none' : 'bg-white border-gray-200 shadow-xs'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0A2E1D] uppercase tracking-wider">
                          {group.name}:
                        </span>
                        {group.is_required ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-medium">Optional</span>
                        )}
                      </div>

                      {/* RADIO / SINGLE SELECT */}
                      {(!group.type || group.type === 'radio') && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {group.options.map((opt: Option) => {
                              const isSelected = selectedRadioOptions[group.name]?.name === opt.name

                              return (
                                <button
                                  key={opt.name}
                                  type="button"
                                  onClick={() => handleRadioClick(group, opt)}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                                      : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-center w-full gap-2">
                                    <span className="text-xs font-bold flex items-center gap-1.5">
                                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#EAA823]" />}
                                      {opt.name}
                                    </span>
                                    {opt.price_modifier > 0 && (
                                      <span className={`text-[10px] font-black ${isSelected ? 'text-[#EAA823]' : 'text-[#0A2E1D]'}`}>
                                        {isStandalone ? `₦${opt.price_modifier.toLocaleString()}` : `+₦${opt.price_modifier.toLocaleString()}`}
                                      </span>
                                    )}
                                  </div>
                                  {opt.description && (
                                    <span className={`text-[10px] mt-1 block leading-tight ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                      {opt.description}
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* CHECKBOX / MULTI-SELECT */}
                      {group.type === 'checkbox' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {group.options.map((opt: Option) => {
                            const isChecked = Boolean(selectedCheckboxOptions[opt.name])

                            return (
                              <button
                                key={opt.name}
                                type="button"
                                onClick={() => toggleCheckboxOption(opt.name)}
                                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                                  isChecked
                                    ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                                    : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-[#EAA823] border-[#EAA823] text-[#0A2E1D]' : 'border-gray-400 bg-white'}`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="text-xs font-bold">{opt.name}</span>
                                </div>
                                {opt.price_modifier > 0 && (
                                  <span className={`text-[10px] font-black ${isChecked ? 'text-[#EAA823]' : 'text-[#0A2E1D]'}`}>
                                    +₦{opt.price_modifier.toLocaleString()}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* COUNTER */}
                      {selectedGroupOpt?.has_counter && (() => {
                        const currentOpt = selectedGroupOpt
                        const counterMinimum = getCounterMinimum(currentOpt)
                        const currentCount = Math.max(counterMinimum, unitCounters[currentOpt.name] || counterMinimum)

                        return (
                          <div className="flex items-center justify-between bg-[#FDFBF7] p-3 rounded-xl border border-gray-200 mt-2">
                            <div>
                              <span className="text-xs font-bold text-[#0A2E1D]">Quantity Count:</span>
                              <span className="text-[10px] text-gray-500 block">
                                ₦{(currentOpt.unit_price || currentOpt.price_modifier || 2000).toLocaleString()} per unit
                              </span>
                              <span className="text-[9px] text-amber-600 font-black block mt-1">
                                Minimum starts at: {counterMinimum} units
                              </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                              <button
                                type="button"
                                disabled={currentCount <= counterMinimum}
                                onClick={() => handleCounterChange(currentOpt, -1)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-xs w-8 text-center text-[#0A2E1D]">{currentCount}</span>
                              <button
                                type="button"
                                onClick={() => handleCounterChange(currentOpt, 1)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })()}

                      {/* PIECE / CUTS SELECTION */}
                      {selectedGroupOpt && Boolean(selectedGroupOpt.has_cuts_selection) && Array.isArray(selectedGroupOpt.allowed_cuts) && selectedGroupOpt.allowed_cuts.length > 0 && (() => {
                        const currentOpt = selectedGroupOpt
                        const maxSelect = currentOpt.max_cuts_selection || 1
                        const chosenCuts = selectedCuts[currentOpt.name] || []
                        const displayCutTitle = currentOpt.cut_selection_title || 'Select Preferred Cut / Parts'

                        return (
                          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <Fish className="w-4 h-4 text-emerald-700" />
                                {displayCutTitle} ({maxSelect === 1 ? 'Pick 1' : `Up to ${maxSelect}`}):
                              </span>
                              <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                                {chosenCuts.length} / {maxSelect} Selected
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                              {currentOpt.allowed_cuts.map((cutName: string) => {
                                const isCutChosen = chosenCuts.includes(cutName)

                                return (
                                  <button
                                    key={cutName}
                                    type="button"
                                    onClick={() => toggleCut(currentOpt.name, cutName, maxSelect)}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                      isCutChosen
                                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <span>{cutName}</span>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isCutChosen ? 'bg-[#EAA823] border-[#EAA823] text-emerald-950' : 'border-gray-300 bg-white'}`}>
                                      {isCutChosen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            )}

            {/* BOTTOM CART BAR */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 bg-[#FDFBF7] border border-gray-300 rounded-xl p-1">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= minimumQuantity}
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 rounded-lg hover:bg-white text-gray-700 cursor-pointer transition active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-sm w-7 text-center text-[#0A2E1D]">{quantity}</span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 rounded-lg hover:bg-white text-gray-700 cursor-pointer transition active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {minimumQuantityEnabled && minimumQuantity > 1 && (
                  <span className="text-[8px] sm:text-[9px] font-black text-amber-600 uppercase tracking-wide whitespace-nowrap">
                    Minimum: {minimumQuantity}
                  </span>
                )}
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 font-black text-xs sm:text-sm py-6 rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white active:scale-95 cursor-pointer'
                }`}
              >
                {isOutOfStock ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Out of Stock</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {!isStoreLive && mounted 
                        ? `Pre-Order • ₦${calculateTotal().toLocaleString()}`
                        : `Add to Cart • ₦${calculateTotal().toLocaleString()}`
                      }
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}