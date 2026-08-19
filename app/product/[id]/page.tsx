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
  ShieldAlert, 
  Sparkles,
  Truck,
  ShieldCheck,
  Zap,
  Flame
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const productId = resolvedParams.id

  const router = useRouter()
  const { addItem } = useCart()
  const supabase = createClient()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  // Customization selection state
  const [selectedRadioOptions, setSelectedRadioOptions] = useState<Record<string, Option>>({})
  const [selectedCheckboxOptions, setSelectedCheckboxOptions] = useState<Record<string, boolean>>({})
  const [unitCounters, setUnitCounters] = useState<Record<string, number>>({})

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

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

        // Initialize defaults for single-select (radio) groups
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
      console.error('Error fetching product detail page:', err)
    } finally {
      setLoading(false)
    }
  }

  // Precise Price Calculation with Standalone Variant Override Check
  const calculateTotal = () => {
    if (!product) return 0

    let base = Number(product.price) || 0

    // Check if the first radio group represents standalone size variants (e.g. Parfait 350ml vs 1L)
    const hasStandalonePriceVariant = Object.values(selectedRadioOptions).some(
      opt => opt && opt.price_modifier >= base && base > 0 && opt.price_modifier > 1000
    )

    if (hasStandalonePriceVariant) {
      const mainVariant = Object.values(selectedRadioOptions).find(
        opt => opt && opt.price_modifier >= base && opt.price_modifier > 1000
      )
      base = mainVariant?.price_modifier || base
    } else {
      // Normal Add-on modifier accumulation
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
    }

    // Add Checkbox Extras
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

    const selectedOptionsList: SelectedOptionItem[] = []

    // 1. Radio Options
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

    // 2. Checkbox Options
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
            <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-28">
      <StorefrontHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Navigation Breadcrumb */}
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
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: HERO IMAGE WITH INTERACTIVE FLOATING CIRCULAR BADGES         */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
            
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-[#072d1d] to-[#041a11] border-2 border-[#EAA823]/30 shadow-2xl group">
              
              {/* Product Background Image */}
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                  <Utensils className="w-16 h-16" />
                </div>
              )}

              {/* Dynamic Overlay Gradient for High Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40 pointer-events-none" />

              {/* Top-Left Category Tag */}
              <div className="absolute top-3.5 left-3.5 z-20">
                <span className="bg-[#EAA823] text-[#072d1d] font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-full uppercase shadow-lg tracking-wider border border-white/20 flex items-center gap-1.5 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 fill-current" />
                  {product.category || 'Specialty'}
                </span>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* INTERACTIVE FLOATING CIRCLE 1: Fast Woji Dispatch (Top-Right)         */}
              {/* --------------------------------------------------------------------- */}
              <div className="absolute top-3.5 right-3.5 z-20 flex items-center group/circle cursor-pointer">
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#072d1d]/85 backdrop-blur-md border border-[#EAA823]/50 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transition-all duration-300 group-hover/circle:scale-110 active:scale-90">
                  
                  {/* Live Pulse Dot */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
                  </span>

                  <Truck className="w-4 h-4 text-[#EAA823] animate-bounce-slow" />
                  <span className="text-[7.5px] font-black text-emerald-100 uppercase tracking-tighter leading-none mt-0.5">
                    Woji
                  </span>
                </div>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* INTERACTIVE FLOATING CIRCLE 2: 100% Fresh Daily (Bottom-Left)          */}
              {/* --------------------------------------------------------------------- */}
              <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center group/circle cursor-pointer">
                <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#072d1d]/85 backdrop-blur-md border border-emerald-400/50 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transition-all duration-300 group-hover/circle:scale-110 active:scale-90">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[7.5px] font-black text-white uppercase tracking-tighter leading-tight mt-0.5">
                    100% Fresh
                  </span>
                </div>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* INTERACTIVE FLOATING CIRCLE 3: Live Prep Time / ~20-60 Mins (Bottom-R) */}
              {/* --------------------------------------------------------------------- */}
              <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center group/circle cursor-pointer">
                <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#072d1d]/85 backdrop-blur-md border border-amber-400/50 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transition-all duration-300 group-hover/circle:scale-110 active:scale-90">
                  <Clock className="w-4 h-4 text-[#EAA823] animate-spin-slow" />
                  <span className="text-[8px] font-black text-amber-300 uppercase tracking-tighter leading-tight mt-0.5">
                    ~{product.preparation_time_minutes || 20}m
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Live Guarantee Strip */}
            <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-gray-500 font-semibold">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#EAA823]" /> Live Express Kitchen
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Cooked Fresh to Order
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> {product.servings || 1} Serving{product.servings > 1 ? 's' : ''}
              </span>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: SPECS, DYNAMIC OPTIONS & LIVE CHECKOUT CALCULATOR           */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Title & Starting Price */}
            <div className="space-y-2 pb-4 border-b border-gray-200">
              <h1 className="text-2xl sm:text-4xl font-black text-[#0A2E1D] leading-tight">
                {product.name}
              </h1>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {product.description || 'Prepared fresh with premium ingredients from the De-echoi kitchen in Woji, Port Harcourt.'}
              </p>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Base Price
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#0A2E1D]">
                  ₦{Number(product.price).toLocaleString()}
                </span>
              </div>
            </div>

            {/* DYNAMIC CUSTOMIZATION GROUPS */}
            {Array.isArray(product.customization_options) && product.customization_options.length > 0 && (
              <div className="space-y-4">
                {product.customization_options.map((group: OptionGroup, gIdx: number) => (
                  <div key={gIdx} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0A2E1D] uppercase tracking-wider">
                        {group.name}:
                      </span>
                      {group.is_required && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Required
                        </span>
                      )}
                    </div>

                    {/* Radio Options Mode */}
                    {(!group.type || group.type === 'radio') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                                  : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-bold">{opt.name}</span>
                                {opt.price_modifier > 0 && (
                                  <span className={`text-[10px] font-black ${isSelected ? 'text-[#EAA823]' : 'text-[#0A2E1D]'}`}>
                                    ₦{opt.price_modifier.toLocaleString()}
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
                    )}

                    {/* Multiplier Quantity Counter (e.g. Turkey Cubes Count) */}
                    {selectedRadioOptions[group.name]?.has_counter && (
                      <div className="flex items-center justify-between bg-[#FDFBF7] p-3 rounded-xl border border-gray-200 mt-2">
                        <div>
                          <span className="text-xs font-bold text-[#0A2E1D]">Quantity Count:</span>
                          <span className="text-[10px] text-gray-500 block">
                            ₦{(selectedRadioOptions[group.name]?.unit_price || selectedRadioOptions[group.name]?.price_modifier || 2000).toLocaleString()} per unit
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => {
                              const current = unitCounters[selectedRadioOptions[group.name].name] || 1
                              setUnitCounters({
                                ...unitCounters,
                                [selectedRadioOptions[group.name].name]: Math.max(1, current - 1)
                              })
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs w-6 text-center text-[#0A2E1D]">
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
                            className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Checkbox Multi-Selection Mode */}
                    {group.type === 'checkbox' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                                isChecked
                                  ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                                  : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div>
                                <span className="text-xs font-bold block">{opt.name}</span>
                                {opt.description && (
                                  <span className={`text-[10px] block ${isChecked ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {opt.description}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] font-black ${isChecked ? 'text-[#EAA823]' : 'text-[#0A2E1D]'}`}>
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

            {/* Ingredients & Allergens Information */}
            {((product.ingredients && product.ingredients.length > 0) || (product.allergens && product.allergens.length > 0)) && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3">
                {product.ingredients && product.ingredients.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-[#0A2E1D] uppercase block mb-1">Fresh Ingredients:</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {product.ingredients.join(', ')}
                    </p>
                  </div>
                )}
                {product.allergens && product.allergens.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-red-600 uppercase flex items-center gap-1 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Allergen Information:
                    </span>
                    <p className="text-xs text-red-700 font-medium">
                      Contains: {product.allergens.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Counter & Add-to-Cart Action Bar */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              
              {/* Quantity */}
              <div className="flex items-center gap-2 bg-[#FDFBF7] border border-gray-300 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg hover:bg-white text-gray-700 cursor-pointer transition active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-sm w-7 text-center text-[#0A2E1D]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg hover:bg-white text-gray-700 cursor-pointer transition active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black text-xs sm:text-sm py-6 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart &bull; ₦{calculateTotal().toLocaleString()}</span>
              </Button>
            </div>

          </div>

        </div>
      </main>

      {/* Global CSS animations for live pulsing badges */}
      <style jsx global>{`
        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </div>
  )
}