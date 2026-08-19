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
  Utensils
} from 'lucide-react'

interface Option {
  name: string
  price_modifier: number
  is_available: boolean
  description?: string
  has_counter?: boolean
  unit_price?: number
}

interface OptionGroup {
  name: string
  is_required: boolean
  type?: 'radio' | 'checkbox'
  options: Option[]
}

interface SelectedOptionItem {
  groupName: string
  optionName: string
  priceModifier: number
}

interface ProductDetailModalProps {
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

  // Selected State
  const [selectedRadioOptions, setSelectedRadioOptions] = useState<Record<string, Option>>({})
  const [selectedCheckboxOptions, setSelectedCheckboxOptions] = useState<Record<string, boolean>>({})
  const [unitCounters, setUnitCounters] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isOpen && productId) {
      loadProduct()
    }
  }, [isOpen, productId])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      if (data) {
        setProduct(data)
        setQuantity(1)

        // Initialize default selections for required radio groups
        const defaults: Record<string, Option> = {}
        const counters: Record<string, number> = {}

        if (Array.isArray(data.customization_options)) {
          data.customization_options.forEach((group: OptionGroup) => {
            if ((!group.type || group.type === 'radio') && group.options.length > 0) {
              defaults[group.name] = group.options[0]
              if (group.options[0].has_counter) {
                counters[group.options[0].name] = 1
              }
            }
          })
        }

        setSelectedRadioOptions(defaults)
        setSelectedCheckboxOptions({})
        setUnitCounters(counters)
      }
    } catch (err) {
      console.error('Error fetching product details modal:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Calculate live price including base price and modifier extras
  const calculateTotal = () => {
    if (!product) return 0

    let base = Number(product.price) || 0

    // 1. Radio Options
    Object.entries(selectedRadioOptions).forEach(([_, opt]) => {
      if (opt) {
        if (opt.has_counter) {
          const count = unitCounters[opt.name] || 1
          base += (opt.unit_price || opt.price_modifier) * count
        } else {
          base += opt.price_modifier || 0
        }
      }
    })

    // 2. Checkbox Options
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

    // Construct the strongly typed selected_options array expected by CartItem
    const selectedOptionsList: SelectedOptionItem[] = []

    // 1. Add Radio / Single-Select Options
    Object.entries(selectedRadioOptions).forEach(([groupName, opt]) => {
      if (opt) {
        let modifier = opt.price_modifier || 0
        let optDisplayName = opt.name

        if (opt.has_counter) {
          const count = unitCounters[opt.name] || 1
          modifier = (opt.unit_price || opt.price_modifier) * count
          optDisplayName = `${opt.name} (${count} units)`
        }

        selectedOptionsList.push({
          groupName,
          optionName: optDisplayName,
          priceModifier: modifier,
        })
      }
    })

    // 2. Add Checkbox / Multi-Select Options
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
      product_name: '',
      unit_price: 0,
      final_price: 0
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#072d1d] text-white rounded-3xl overflow-hidden shadow-2xl border border-[#EAA823]/30 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition cursor-pointer"
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
            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto flex-1 space-y-5 p-5 sm:p-6 no-scrollbar">
              
              {/* Product Hero Image & Badge */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-[#041a11] border border-white/10 shadow-md">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Utensils className="w-10 h-10 text-emerald-700" />
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-[#EAA823] text-[#072d1d] font-black text-[10px] px-2.5 py-1 rounded-full uppercase shadow-md">
                  {product.category || 'Kitchen Special'}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  {product.description || 'Prepared fresh with premium ingredients from the De-echoi kitchen.'}
                </p>

                {/* Specs Ribbon */}
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

              {/* DYNAMIC CUSTOMIZATION GROUPS */}
              {Array.isArray(product.customization_options) && product.customization_options.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  {product.customization_options.map((group: OptionGroup, gIdx: number) => (
                    <div key={gIdx} className="bg-[#041a11] p-3.5 rounded-2xl border border-emerald-700/30 space-y-2.5">
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                          {group.name}:
                        </span>
                        {group.is_required && (
                          <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/40">
                            Required
                          </span>
                        )}
                      </div>

                      {/* Radio Selection Mode */}
                      {(!group.type || group.type === 'radio') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.options.map((opt: Option) => {
                            const isSelected = selectedRadioOptions[group.name]?.name === opt.name
                            return (
                              <button
                                key={opt.name}
                                type="button"
                                onClick={() => {
                                  setSelectedRadioOptions({
                                    ...selectedRadioOptions,
                                    [group.name]: opt
                                  })
                                  if (opt.has_counter && !unitCounters[opt.name]) {
                                    setUnitCounters({ ...unitCounters, [opt.name]: 1 })
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-[#0a3a26] text-white border-[#EAA823] shadow-sm'
                                    : 'bg-[#072d1d] text-gray-300 border-white/10 hover:border-white/25'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-xs font-bold">{opt.name}</span>
                                  {opt.price_modifier > 0 && (
                                    <span className="text-[10px] font-black text-[#EAA823]">
                                      +₦{opt.price_modifier.toLocaleString()}
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
                      )}

                      {/* Counter Sub-Control for options with quantity multiplier */}
                      {selectedRadioOptions[group.name]?.has_counter && (
                        <div className="flex items-center justify-between bg-[#072d1d] p-2.5 rounded-xl border border-white/10 mt-1.5">
                          <div>
                            <span className="text-xs font-bold text-white">Quantity Count:</span>
                            <span className="text-[10px] text-gray-400 block">
                              ₦{(selectedRadioOptions[group.name]?.unit_price || 2000).toLocaleString()} per unit
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-[#041a11] border border-white/20 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => {
                                const current = unitCounters[selectedRadioOptions[group.name].name] || 1
                                setUnitCounters({
                                  ...unitCounters,
                                  [selectedRadioOptions[group.name].name]: Math.max(1, current - 1)
                                })
                              }}
                              className="p-1 hover:bg-white/10 rounded text-gray-300 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs w-5 text-center text-amber-300">
                              {unitCounters[selectedRadioOptions[group.name].name] || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = unitCounters[selectedRadioOptions[group.name].name] || 1
                                setUnitCounters({
                                  ...unitCounters,
                                  [selectedRadioOptions[group.name].name]: current + 1
                                })
                              }}
                              className="p-1 hover:bg-white/10 rounded text-gray-300 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Checkbox Multi-Selection Mode */}
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
                  ))}
                </div>
              )}

              {/* Ingredients & Allergens List */}
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

            {/* Sticky Bottom Add-to-Cart Action Bar */}
            <div className="p-4 bg-[#041a11] border-t border-emerald-700/40 flex items-center justify-between gap-3">
              
              {/* Quantity Counter */}
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

              {/* Add to Cart Button with Live Calculated Total */}
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