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
  AlertCircle
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

export function ProductDetailModal({ productId, isOpen, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart()
  const supabase = createClient()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Selected State
  const [selectedRadioOptions, setSelectedRadioOptions] = useState<Record<string, Option | null>>({})
  const [selectedCheckboxOptions, setSelectedCheckboxOptions] = useState<Record<string, boolean>>({})
  const [unitCounters, setUnitCounters] = useState<Record<string, number>>({})
  const [selectedCuts, setSelectedCuts] = useState<Record<string, string[]>>({})

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
        setQuantity(1)

        const defaults: Record<string, Option | null> = {}
        const counters: Record<string, number> = {}
        const cuts: Record<string, string[]> = {}

        if (Array.isArray(data.customization_options)) {
          data.customization_options.forEach((group: OptionGroup) => {
            // ONLY pre-select defaults if the group is marked as required
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

  if (!isOpen) return null

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
      [group.name]: opt
    })

    if (opt.has_counter && !unitCounters[opt.name]) {
      setUnitCounters({ ...unitCounters, [opt.name]: 1 })
    }

    if (opt.has_cuts_selection === true && opt.allowed_cuts && opt.allowed_cuts.length > 0) {
      if (!selectedCuts[opt.name] || selectedCuts[opt.name].length === 0) {
        const minCount = opt.min_cuts_selection ?? 1
        setSelectedCuts({ ...selectedCuts, [opt.name]: opt.allowed_cuts.slice(0, Math.max(1, minCount)) })
      }
    }
  }

  const toggleCut = (optionName: string, cutName: string, maxSelect: number = 1) => {
    setValidationError(null)
    const current = selectedCuts[optionName] || []
    if (current.includes(cutName)) {
      setSelectedCuts({ ...selectedCuts, [optionName]: current.filter(c => c !== cutName) })
    } else {
      if (maxSelect === 1) {
        setSelectedCuts({ ...selectedCuts, [optionName]: [cutName] })
      } else {
        if (current.length < maxSelect) {
          setSelectedCuts({ ...selectedCuts, [optionName]: [...current, cutName] })
        } else {
          setSelectedCuts({ ...selectedCuts, [optionName]: [...current.slice(1), cutName] })
        }
      }
    }
  }

  const calculateTotal = () => {
    if (!product) return 0

    let base = Number(product.price) || 0

    if (Array.isArray(product.customization_options)) {
      // 1. Standalone Overrides
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

      // 2. Addons
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

  const handleAddToCart = () => {
    if (!product) return
    setValidationError(null)

    // Validate Required Options and Min Cuts Selection
    if (Array.isArray(product.customization_options)) {
      for (const group of product.customization_options) {
        if (group.is_required && (!group.type || group.type === 'radio')) {
          const opt = selectedRadioOptions[group.name]
          if (!opt) {
            setValidationError(`Please select an option for "${group.name}".`)
            return
          }
        }

        // Check cuts minimum selection
        if (!group.type || group.type === 'radio') {
          const opt = selectedRadioOptions[group.name]
          if (opt && opt.has_cuts_selection === true) {
            const minAllowed = opt.min_cuts_selection ?? 1
            const currentChosen = selectedCuts[opt.name] || []
            if (currentChosen.length < minAllowed) {
              setValidationError(
                `Please select at least ${minAllowed} piece cut${minAllowed > 1 ? 's' : ''} for "${opt.name}".`
              )
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
      final_price: calculatedUnitPrice
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#072d1d] text-white rounded-3xl overflow-hidden shadow-2xl border border-[#EAA823]/30 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
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
            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 space-y-5 p-5 sm:p-6 no-scrollbar">
              
              {/* Product Hero Image & Badges */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-[#072d1d] to-[#041a11] border border-white/10 shadow-md">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover filter brightness-95"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Utensils className="w-10 h-10 text-emerald-700" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                <span className="absolute top-3 left-3 bg-[#EAA823] text-[#072d1d] font-black text-[10px] px-2.5 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" />
                  {product.category || 'Kitchen Special'}
                </span>

                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#072d1d]/85 backdrop-blur-md border border-[#EAA823]/40 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-200 shadow-md">
                  <Truck className="w-3 h-3 text-[#EAA823]" />
                  <span>Woji Dispatch</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  {product.description || 'Prepared fresh with premium ingredients from the De-echoi kitchen.'}
                </p>

                {/* Specs */}
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
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="p-3 bg-red-900/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Dynamic Option Groups */}
              {Array.isArray(product.customization_options) && product.customization_options.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  {product.customization_options.map((group: OptionGroup, gIdx: number) => {
                    const isStandalone = isStandaloneGroup(group)

                    return (
                      <div key={gIdx} className="bg-[#041a11] p-3.5 rounded-2xl border border-emerald-700/30 space-y-2.5">
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                            {group.name}:
                          </span>
                          {group.is_required ? (
                            <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/40 font-bold">
                              Required
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-400 font-medium">
                              Optional (Click to unselect)
                            </span>
                          )}
                        </div>

                        {/* Radio Selection Mode */}
                        {(!group.type || group.type === 'radio') && (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {group.options.map((opt: Option) => {
                                const isSelected = selectedRadioOptions[group.name]?.name === opt.name

                                return (
                                  <button
                                    key={opt.name}
                                    type="button"
                                    onClick={() => handleRadioClick(group, opt)}
                                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                      isSelected
                                        ? 'bg-[#0a3a26] text-white border-[#EAA823] shadow-sm'
                                        : 'bg-[#072d1d] text-gray-300 border-white/10 hover:border-white/25'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full gap-2">
                                      <span className="text-xs font-bold flex items-center gap-1.5">
                                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#EAA823]" />}
                                        {opt.name}
                                      </span>
                                      {opt.price_modifier > 0 && (
                                        <span className={`text-[10px] font-black ${isSelected ? 'text-[#EAA823]' : 'text-amber-300'}`}>
                                          {isStandalone ? `₦${opt.price_modifier.toLocaleString()}` : `+₦${opt.price_modifier.toLocaleString()}`}
                                        </span>
                                      )}
                                    </div>
                                    {opt.description && (
                                      <span className="text-[10px] text-gray-400 mt-0.5 block leading-tight">
                                        {opt.description}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>

                            {/* Sub-Cuts Selection with Min & Max Constraints */}
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
                                <div className="bg-[#072d1d] p-3 rounded-xl border border-amber-400/30 space-y-2 animate-in fade-in duration-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                      <Fish className="w-3.5 h-3.5 text-[#EAA823]" />
                                      Choose Preferred Cuts ({minSelect === maxSelect ? `Pick ${minSelect}` : `Min ${minSelect}, Max ${maxSelect}`}):
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${meetsMin ? 'text-emerald-300' : 'text-amber-300 animate-pulse'}`}>
                                      {currentChosen.length} / {maxSelect} picked {currentChosen.length < minSelect ? `(need ${minSelect - currentChosen.length} more)` : ''}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {activeOpt.allowed_cuts.map((cut) => {
                                      const isCutSelected = currentChosen.includes(cut)
                                      return (
                                        <button
                                          key={cut}
                                          type="button"
                                          onClick={() => toggleCut(activeOpt.name, cut, maxSelect)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                            isCutSelected
                                              ? 'bg-[#EAA823] text-[#072d1d] shadow-sm font-black'
                                              : 'bg-[#041a11] text-gray-300 border border-white/10 hover:border-amber-400/50'
                                          }`}
                                        >
                                          {isCutSelected && <Check className="w-3 h-3 stroke-[3]" />}
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

                        {/* Multiplier Counter */}
                        {selectedRadioOptions[group.name]?.has_counter && (
                          <div className="flex items-center justify-between bg-[#072d1d] p-2.5 rounded-xl border border-white/10 mt-1.5">
                            <div>
                              <span className="text-xs font-bold text-white">Quantity Count:</span>
                              <span className="text-[10px] text-gray-400 block">
                                ₦{(selectedRadioOptions[group.name]?.unit_price || selectedRadioOptions[group.name]?.price_modifier || 2000).toLocaleString()} per unit
                              </span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#041a11] border border-white/20 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentOpt = selectedRadioOptions[group.name]
                                  if (currentOpt) {
                                    const current = unitCounters[currentOpt.name] || 1
                                    setUnitCounters({
                                      ...unitCounters,
                                      [currentOpt.name]: Math.max(1, current - 1)
                                    })
                                  }
                                }}
                                className="p-1 hover:bg-white/10 rounded text-gray-300 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-xs w-5 text-center text-amber-300">
                                {selectedRadioOptions[group.name] ? (unitCounters[selectedRadioOptions[group.name]!.name] || 1) : 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentOpt = selectedRadioOptions[group.name]
                                  if (currentOpt) {
                                    const current = unitCounters[currentOpt.name] || 1
                                    setUnitCounters({
                                      ...unitCounters,
                                      [currentOpt.name]: current + 1
                                    })
                                  }
                                }}
                                className="p-1 hover:bg-white/10 rounded text-gray-300 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Checkbox Mode */}
                        {group.type === 'checkbox' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.options.map((opt: Option) => {
                              const isChecked = !!selectedCheckboxOptions[opt.name]
                              return (
                                <button
                                  key={opt.name}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCheckboxOptions({
                                      ...selectedCheckboxOptions,
                                      [opt.name]: !isChecked
                                    })
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                                    isChecked
                                      ? 'bg-[#0a3a26] text-white border-[#EAA823] shadow-sm'
                                      : 'bg-[#072d1d] text-gray-300 border-white/10 hover:border-white/25'
                                  }`}
                                >
                                  <div>
                                    <span className="text-xs font-bold block">{opt.name}</span>
                                    {opt.description && (
                                      <span className="text-[10px] text-gray-400 block">{opt.description}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-black text-[#EAA823]">
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

              {/* Ingredients & Allergens */}
              {((product.ingredients && product.ingredients.length > 0) || (product.allergens && product.allergens.length > 0)) && (
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-gray-300">
                  {product.ingredients && product.ingredients.length > 0 && (
                    <div>
                      <span className="text-amber-400 font-bold block mb-1">Ingredients:</span>
                      <p className="text-emerald-100/70 text-[11px] leading-relaxed">
                        {product.ingredients.join(', ')}
                      </p>
                    </div>
                  )}
                  {product.allergens && product.allergens.length > 0 && (
                    <div className="pt-1">
                      <span className="text-red-400 font-bold block mb-1">Allergen Notice:</span>
                      <p className="text-red-200/80 text-[11px]">
                        Contains: {product.allergens.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Bottom Add-to-Cart Bar */}
            <div className="p-4 bg-[#041a11] border-t border-emerald-700/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-[#072d1d] border border-white/20 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs w-6 text-center text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs sm:text-sm py-5 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart &bull; ₦{calculateTotal().toLocaleString()}</span>
              </Button>
            </div>
          </>
        ) : null}

      </div>
    </div>
  )
}

export default ProductDetailModal