'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import {
  X,
  ShoppingBag,
  Clock,
  Users,
  Plus,
  Minus,
  Loader2,
  Utensils,
  Sparkles,
  Truck,
  Fish,
  Check,
  AlertCircle,
} from 'lucide-react'

interface Option {
  name: string
  price_modifier: number
  is_available: boolean
  description?: string
  has_counter?: boolean
  unit_price?: number
  has_cuts_selection?: boolean
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

export interface ProductDetailModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailModal({
  productId,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const { addItem } = useCart()
  const supabase = createClient()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [validationError, setValidationError] = useState<string | null>(null)

  // -----------------------------------------------------------
  // GLOBAL & TIME-BOUND STATES
  // -----------------------------------------------------------
  const [isStoreLive, setIsStoreLive] = useState(true)
  const [isTimeValid, setIsTimeValid] = useState(true)

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
    const checkStoreStatus = () => {
      const storeStatus = localStorage.getItem('deechoi_storefront_active')
      if (storeStatus !== null) {
        setIsStoreLive(storeStatus === 'true')
      }
    }

    checkStoreStatus()
    window.addEventListener('storage', checkStoreStatus)
    window.addEventListener('deechoi_store_status_change', checkStoreStatus)

    return () => {
      window.removeEventListener('storage', checkStoreStatus)
      window.removeEventListener('deechoi_store_status_change', checkStoreStatus)
    }
  }, [])

  useEffect(() => {
    if (product?.is_time_bound && product?.available_from && product?.available_to) {
      const checkTime = () => {
        const now = new Date()
        const currentHour = now.getHours().toString().padStart(2, '0')
        const currentMinute = now.getMinutes().toString().padStart(2, '0')
        const currentTime = `${currentHour}:${currentMinute}`

        let valid = false
        if (product.available_from < product.available_to) {
          // Standard same-day window
          valid = currentTime >= product.available_from && currentTime <= product.available_to
        } else {
          // Cross-midnight window
          valid = currentTime >= product.available_from || currentTime <= product.available_to
        }

        setIsTimeValid(valid)
      }

      checkTime()
      const intervalId = setInterval(checkTime, 60000) // Re-verify every minute while modal is open
      return () => clearInterval(intervalId)
    } else {
      setIsTimeValid(true)
    }
  }, [product])

  // -----------------------------------------------------------
  // SELECTED STATE
  // -----------------------------------------------------------

  const [selectedRadioOptions, setSelectedRadioOptions] = useState<Record<string, Option | null>>({})
  const [selectedCheckboxOptions, setSelectedCheckboxOptions] = useState<Record<string, boolean>>({})
  const [unitCounters, setUnitCounters] = useState<Record<string, number>>({})
  const [selectedCuts, setSelectedCuts] = useState<Record<string, string[]>>({})

  // -----------------------------------------------------------
  // NORMALIZE MINIMUM ORDER QUANTITY
  // -----------------------------------------------------------

  const getMinimumOrderQuantity = (productData: any): number => {
    const configuredMinimum = Number(productData?.min_order_quantity)
    if (Number.isFinite(configuredMinimum) && configuredMinimum >= 1) {
      return Math.floor(configuredMinimum)
    }
    return 1
  }

  // -----------------------------------------------------------
  // LOAD PRODUCT
  // -----------------------------------------------------------

  useEffect(() => {
    if (isOpen && productId) {
      loadProduct()
    }
  }, [isOpen, productId])

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
        setQuantity(minimumQuantity)

        const defaults: Record<string, Option | null> = {}
        const counters: Record<string, number> = {}
        const cuts: Record<string, string[]> = {}

        if (Array.isArray(data.customization_options)) {
          data.customization_options.forEach((group: OptionGroup) => {
            if (group.is_required === true && (!group.type || group.type === 'radio') && group.options.length > 0) {
              const defaultOpt = group.options[0]
              defaults[group.name] = defaultOpt

              if (defaultOpt.has_counter) {
                counters[defaultOpt.name] = 1
              }

              if (defaultOpt.has_cuts_selection === true && Array.isArray(defaultOpt.allowed_cuts) && defaultOpt.allowed_cuts.length > 0) {
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
      console.error('Error fetching product details modal:', err)
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------------------------
  // RESET WHEN MODAL CLOSES
  // -----------------------------------------------------------

  useEffect(() => {
    if (!isOpen) {
      setValidationError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const minimumQuantity = getMinimumOrderQuantity(product)

  // -----------------------------------------------------------
  // QUANTITY CHANGE
  // -----------------------------------------------------------

  const handleQuantityChange = (delta: number) => {
    if (!product) return

    const minimumOrder = getMinimumOrderQuantity(product)
    setValidationError(null)

    setQuantity((previousQuantity) => {
      const requestedQuantity = previousQuantity + delta
      return Math.max(minimumOrder, requestedQuantity)
    })
  }

  // -----------------------------------------------------------
  // STANDALONE GROUP
  // -----------------------------------------------------------

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

  // -----------------------------------------------------------
  // RADIO SELECTION
  // -----------------------------------------------------------

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

    if (opt.has_counter && !unitCounters[opt.name]) {
      setUnitCounters({ ...unitCounters, [opt.name]: 1 })
    }

    if (opt.has_cuts_selection === true && opt.allowed_cuts && opt.allowed_cuts.length > 0) {
      if (!selectedCuts[opt.name] || selectedCuts[opt.name].length === 0) {
        const minCount = opt.min_cuts_selection ?? 1
        setSelectedCuts({
          ...selectedCuts,
          [opt.name]: opt.allowed_cuts.slice(0, Math.max(1, minCount)),
        })
      }
    }
  }

  // -----------------------------------------------------------
  // CUT SELECTION
  // -----------------------------------------------------------

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

  // -----------------------------------------------------------
  // CALCULATE TOTAL
  // -----------------------------------------------------------

  const calculateTotal = () => {
    if (!product) return 0

    let base = Number(product.price) || 0

    if (Array.isArray(product.customization_options)) {
      product.customization_options.forEach((group: OptionGroup) => {
        if (!group.type || group.type === 'radio') {
          const selectedOpt = selectedRadioOptions[group.name]
          if (selectedOpt && isStandaloneGroup(group)) {
            if (selectedOpt.has_counter) {
              const count = unitCounters[selectedOpt.name] || 1
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
              const count = unitCounters[selectedOpt.name] || 1
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

  // -----------------------------------------------------------
  // ADD TO CART
  // -----------------------------------------------------------

  const handleAddToCart = () => {
    if (!product) return

    const minOrder = getMinimumOrderQuantity(product)

    if (quantity < minOrder) {
      setQuantity(minOrder)
      setValidationError(`Minimum order quantity for this product is ${minOrder}.`)
      return
    }

    setValidationError(null)

    // VALIDATE CUSTOMIZATION OPTIONS
    if (Array.isArray(product.customization_options)) {
      for (const group of product.customization_options) {
        
        // 1. Radio Requirements
        if (group.is_required && (!group.type || group.type === 'radio')) {
          const opt = selectedRadioOptions[group.name]
          if (!opt) {
            setValidationError(`Please select a required option for "${group.name}".`)
            return
          }
        }

        // 2. Checkbox Requirements
        if (group.is_required && group.type === 'checkbox') {
          const hasAtLeastOne = group.options.some((opt: Option) => selectedCheckboxOptions[opt.name] === true)
          if (!hasAtLeastOne) {
            setValidationError(`Please select at least one required add-on from "${group.name}".`)
            return
          }
        }

        // 3. Piece/Cuts Selection Requirements
        if (!group.type || group.type === 'radio') {
          const opt = selectedRadioOptions[group.name]
          if (opt && opt.has_cuts_selection === true) {
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

    // BUILD SELECTED OPTIONS
    const selectedOptionsList: SelectedOptionItem[] = []

    if (Array.isArray(product.customization_options)) {
      product.customization_options.forEach((group: OptionGroup) => {
        if (!group.type || group.type === 'radio') {
          const opt = selectedRadioOptions[group.name]
          if (opt) {
            let modifier = opt.price_modifier || 0
            let optDisplayName = opt.name

            if (opt.has_counter) {
              const count = unitCounters[opt.name] || 1
              modifier = (opt.unit_price || opt.price_modifier) * count
              optDisplayName = `${opt.name} (${count} units)`
            }

            if (opt.has_cuts_selection === true && selectedCuts[opt.name] && selectedCuts[opt.name].length > 0) {
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
      prep_time: undefined,
      cooking_time: undefined,
      fulfillment_time: undefined,
    })

    onClose()
  }

  // Unavailable State Block Logic
  const isUnavailable = !product?.in_stock || (isStoreLive && product?.is_time_bound && !isTimeValid)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#072d1d] text-white rounded-3xl overflow-hidden shadow-2xl border border-[#EAA823]/30 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />
            <p className="text-xs text-emerald-200 font-bold">Loading meal details...</p>
          </div>
        ) : product ? (
          <>
            <div className="overflow-y-auto flex-1 space-y-5 p-5 sm:p-6 no-scrollbar">

              {/* PRODUCT IMAGE */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-[#072d1d] to-[#041a11] border border-white/10 shadow-md">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className={`object-cover filter transition-all ${isUnavailable ? 'grayscale-[50%] brightness-50' : 'brightness-95'}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Utensils className="w-10 h-10 text-emerald-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />
                
                <span className="absolute top-3 left-3 bg-[#EAA823] text-[#072d1d] font-black text-[10px] px-2.5 py-1 rounded-full uppercase shadow-md flex items-center gap-1 z-20">
                  <Sparkles className="w-3 h-3 fill-current" />
                  {product.category || 'Kitchen Special'}
                </span>

                {/* TIME BOUND BADGE */}
                {product.is_time_bound && product.menu_section && (
                  <span className="absolute top-10 left-3 bg-amber-100/95 backdrop-blur-md text-amber-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shadow-xs flex items-center gap-1 z-20">
                    <Clock className="w-3 h-3" />
                    {product.menu_section} Menu
                  </span>
                )}

                {/* PRE-ORDER BADGE */}
                {!isStoreLive && product.in_stock && (
                  <div className="absolute top-3 right-3 z-20">
                    <span className="bg-amber-500 text-[#0A2E1D] text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pre-Order
                    </span>
                  </div>
                )}
              </div>

              {/* PRODUCT DETAILS */}
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex items-center gap-4 pt-1 text-[11px] text-gray-300 font-medium">
                  {product.preparation_time_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#EAA823]" />
                      ~{product.preparation_time_minutes} mins
                    </span>
                  )}
                  {product.servings && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#EAA823]" />
                      {product.servings} serving{product.servings > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* MINIMUM ORDER NOTICE */}
                {minimumQuantity > 1 && (
                  <div className="mt-3 flex items-center gap-2 bg-[#0A3B27] border border-[#EAA823]/40 rounded-xl px-3 py-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#EAA823] flex-shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-200">
                      Minimum order: {minimumQuantity} {minimumQuantity === 1 ? 'unit' : 'units'}
                    </span>
                  </div>
                )}
              </div>

              {/* OUT OF TIME BOUNDS ALERT */}
              {isStoreLive && product?.is_time_bound && !isTimeValid && (
                <div className="p-3 bg-amber-900/60 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    The {product.menu_section} menu is currently closed. 
                    Available from {formatTime(product.available_from)} to {formatTime(product.available_to)}.
                  </span>
                </div>
              )}

              {/* VALIDATION ERROR */}
              {validationError && (
                <div className="p-3 bg-red-900/60 border border-red-500/50 rounded-xl text-red-200 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* =================================================
                  CUSTOMIZATION OPTIONS
              ================================================== */}
              {Array.isArray(product.customization_options) && product.customization_options.length > 0 && (
                <div className="space-y-4">
                  {product.customization_options.map((group: OptionGroup, gIdx: number) => {
                    const isStandalone = isStandaloneGroup(group)

                    return (
                      <div key={gIdx} className={`p-4 rounded-2xl border transition-all space-y-3 ${isUnavailable ? 'bg-[#041a11] border-white/5 opacity-60 pointer-events-none' : 'bg-[#0A3B27] border-white/10 shadow-xs'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{group.name}:</span>
                          {group.is_required ? (
                            <span className="text-[10px] bg-emerald-900/70 text-emerald-200 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium">Optional</span>
                          )}
                        </div>

                        {/* RADIO OPTIONS */}
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
                                      isSelected ? 'bg-[#EAA823] text-[#072d1d] border-[#EAA823] shadow-sm' : 'bg-[#072d1d] text-gray-200 border-white/10 hover:border-[#EAA823]/50'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full gap-2">
                                      <span className="text-xs font-bold flex items-center gap-1.5">
                                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#072d1d]" />}
                                        {opt.name}
                                      </span>
                                      {opt.price_modifier > 0 && (
                                        <span className={`text-[10px] font-black ${isSelected ? 'text-[#072d1d]' : 'text-[#EAA823]'}`}>
                                          {isStandalone ? `₦${opt.price_modifier.toLocaleString()}` : `+₦${opt.price_modifier.toLocaleString()}`}
                                        </span>
                                      )}
                                    </div>
                                    {opt.description && (
                                      <span className={`text-[10px] mt-1 block leading-tight ${isSelected ? 'text-[#072d1d]/70' : 'text-gray-400'}`}>
                                        {opt.description}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>

                            {/* CUT SELECTION */}
                            {(() => {
                              const activeOpt = selectedRadioOptions[group.name]
                              if (!activeOpt || activeOpt.has_cuts_selection !== true || !Array.isArray(activeOpt.allowed_cuts) || activeOpt.allowed_cuts.length === 0) {
                                return null
                              }
                              const minSelect = activeOpt.min_cuts_selection ?? 1
                              const maxSelect = activeOpt.max_cuts_selection || 1
                              const currentChosen = selectedCuts[activeOpt.name] || []
                              const meetsMin = currentChosen.length >= minSelect

                              return (
                                <div className="bg-[#072d1d] p-3.5 rounded-xl border border-[#EAA823]/40 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                      <Fish className="w-4 h-4 text-[#EAA823]" /> Choose Preferred Cuts:
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${meetsMin ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {currentChosen.length} / {maxSelect}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {activeOpt.allowed_cuts.map((cut) => {
                                      const isCutSelected = currentChosen.includes(cut)
                                      return (
                                        <button
                                          key={cut}
                                          type="button"
                                          onClick={() => toggleCut(activeOpt.name, cut, maxSelect)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            isCutSelected ? 'bg-[#EAA823] text-[#072d1d] border border-[#EAA823] shadow-sm font-black scale-105' : 'bg-[#0A3B27] text-gray-200 border border-white/10 hover:border-[#EAA823]'
                                          }`}
                                        >
                                          {isCutSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                          <span>{cut}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )}

                        {/* COUNTER */}
                        {selectedRadioOptions[group.name]?.has_counter && (
                          <div className="flex items-center justify-between bg-[#072d1d] p-3 rounded-xl border border-white/10 mt-2">
                            <div>
                              <span className="text-xs font-bold text-white">Quantity Count:</span>
                              <span className="text-[10px] text-gray-400 block">
                                ₦{(selectedRadioOptions[group.name]?.unit_price || selectedRadioOptions[group.name]?.price_modifier || 2000).toLocaleString()} per unit
                              </span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#0A3B27] border border-white/10 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentOpt = selectedRadioOptions[group.name]
                                  if (currentOpt) {
                                    const current = unitCounters[currentOpt.name] || 1
                                    setUnitCounters({ ...unitCounters, [currentOpt.name]: Math.max(1, current - 1) })
                                  }
                                }}
                                className="p-1 hover:bg-white/10 rounded text-white cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-xs w-6 text-center text-white">
                                {selectedRadioOptions[group.name] ? unitCounters[selectedRadioOptions[group.name]!.name] || 1 : 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentOpt = selectedRadioOptions[group.name]
                                  if (currentOpt) {
                                    const current = unitCounters[currentOpt.name] || 1
                                    setUnitCounters({ ...unitCounters, [currentOpt.name]: current + 1 })
                                  }
                                }}
                                className="p-1 hover:bg-white/10 rounded text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CHECKBOX OPTIONS */}
                        {group.type === 'checkbox' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {group.options.map((opt: Option) => {
                              const isChecked = !!selectedCheckboxOptions[opt.name]
                              return (
                                <button
                                  key={opt.name}
                                  type="button"
                                  onClick={() => setSelectedCheckboxOptions({ ...selectedCheckboxOptions, [opt.name]: !isChecked })}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                                    isChecked ? 'bg-[#EAA823] text-[#072d1d] border-[#EAA823] shadow-sm' : 'bg-[#072d1d] text-gray-200 border-white/10 hover:border-[#EAA823]/50'
                                  }`}
                                >
                                  <div>
                                    <span className="text-xs font-bold block">{opt.name}</span>
                                    {opt.description && (
                                      <span className={`text-[10px] block ${isChecked ? 'text-[#072d1d]/70' : 'text-gray-400'}`}>
                                        {opt.description}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-black ${isChecked ? 'text-[#072d1d]' : 'text-[#EAA823]'}`}>
                                    +₦{opt.price_modifier.toLocaleString()}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* =================================================
                BOTTOM ACTION BAR
            ================================================== */}

            <div className="p-4 bg-[#041a11] border-t border-emerald-700/40 flex items-center justify-between gap-3">
              {/* QUANTITY SELECTOR */}
              <div className="flex flex-col items-center gap-1">
                <div className={`flex items-center gap-2 bg-[#072d1d] border border-white/20 rounded-xl p-1 ${isUnavailable ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer active:scale-90 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs w-7 text-center text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer active:scale-90 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {minimumQuantity > 1 && (
                  <span className="text-[7px] font-black text-amber-400 uppercase tracking-wide whitespace-nowrap">
                    Min: {minimumQuantity}
                  </span>
                )}
              </div>

              {/* ADD TO CART / PRE-ORDER BUTTON */}
              <Button
                onClick={handleAddToCart}
                disabled={isUnavailable}
                className={`flex-1 font-black text-xs sm:text-sm py-5 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                  isUnavailable 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'
                    : 'bg-[#EAA823] hover:bg-white text-[#072d1d] cursor-pointer'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isUnavailable 
                    ? 'Currently Unavailable' 
                    : !isStoreLive 
                      ? `Pre-Order • ₦${calculateTotal().toLocaleString()}`
                      : `Add to Cart • ₦${calculateTotal().toLocaleString()}`
                  }
                </span>
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}