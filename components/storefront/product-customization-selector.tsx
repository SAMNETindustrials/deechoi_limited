'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Utensils, Sparkles, Check } from 'lucide-react'

interface Option {
  name: string
  price_modifier: number
  is_available: boolean
}

interface OptionGroup {
  name: string
  is_required: boolean
  options: Option[]
}

interface ProductCustomizationSelectorProps {
  productId: string
  basePrice: number
  onSelectOptions: (selectedOptions: Record<string, string>, totalModifier: number) => void
}

export function ProductCustomizationSelector({
  productId,
  basePrice,
  onSelectOptions,
}: ProductCustomizationSelectorProps) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [selectedChoices, setSelectedChoices] = useState<Record<string, Option>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProductOptions()
  }, [productId])

  const loadProductOptions = async () => {
    try {
      setLoading(true)
      const { data: product } = await supabase
        .from('store_products')
        .select('customization_options')
        .eq('id', productId)
        .single()

      if (product?.customization_options && Array.isArray(product.customization_options)) {
        const groups: OptionGroup[] = product.customization_options
        setOptionGroups(groups)

        // Initialize default selections for required groups
        const initialSelections: Record<string, Option> = {}
        let initialModifier = 0

        groups.forEach((group) => {
          if (group.is_required && group.options.length > 0) {
            const firstAvailable = group.options.find((o) => o.is_available) || group.options[0]
            initialSelections[group.name] = firstAvailable
            initialModifier += Number(firstAvailable.price_modifier || 0)
          }
        })

        setSelectedChoices(initialSelections)

        const simplified = Object.fromEntries(
          Object.entries(initialSelections).map(([k, v]) => [
            k, 
            v.price_modifier > 0 ? `${v.name} (+₦${v.price_modifier.toLocaleString()})` : v.name
          ])
        )
        onSelectOptions(simplified, initialModifier)
      } else {
        setOptionGroups([])
      }
    } catch (err) {
      console.warn('Could not load customization options:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (groupName: string, option: Option) => {
    const updated = { ...selectedChoices, [groupName]: option }
    setSelectedChoices(updated)

    // Calculate total price modifier
    let totalMod = 0
    const formattedSummary: Record<string, string> = {}

    Object.entries(updated).forEach(([gName, opt]) => {
      totalMod += Number(opt.price_modifier || 0)
      formattedSummary[gName] = opt.price_modifier > 0 
        ? `${opt.name} (+₦${Number(opt.price_modifier).toLocaleString()})` 
        : opt.name
    })

    onSelectOptions(formattedSummary, totalMod)
  }

  if (loading || optionGroups.length === 0) return null

  return (
    <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <Sparkles className="w-4 h-4 text-[#EAA823]" />
        <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0A2E1D]">
          Customize Your Meal
        </h4>
      </div>

      <div className="space-y-4">
        {optionGroups.map((group) => (
          <div key={group.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase">
                {group.name} {group.is_required && <span className="text-red-500">*</span>}
              </label>
              {group.is_required && (
                <span className="text-[10px] text-gray-400 font-medium">Required</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.options.map((option) => {
                const isSelected = selectedChoices[group.name]?.name === option.name

                return (
                  <button
                    key={option.name}
                    type="button"
                    disabled={!option.is_available}
                    onClick={() => handleSelectOption(group.name, option)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      !option.is_available
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200'
                        : isSelected
                          ? 'border-[#0A2E1D] bg-[#0A2E1D]/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-[#FDFBF7]'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-[#0A2E1D] bg-[#0A2E1D] text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className="text-xs font-bold text-[#0A2E1D] truncate">
                        {option.name}
                      </span>
                    </div>

                    {option.price_modifier > 0 && (
                      <span className="text-[11px] font-black text-[#EAA823] flex-shrink-0">
                        +₦{Number(option.price_modifier).toLocaleString()}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}