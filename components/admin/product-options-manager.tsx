'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Sparkles, Cake, Utensils, CheckCircle2, Loader2, Save } from 'lucide-react'

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

const CATEGORY_PRESETS: Record<string, OptionGroup[]> = {
  'Rice & Meals': [
    {
      name: 'Portion Size',
      is_required: true,
      options: [
        { name: '1 Portion', price_modifier: 0, is_available: true },
        { name: '2 Portions', price_modifier: 1500, is_available: true },
        { name: 'Family Size (4 Portions)', price_modifier: 4500, is_available: true },
      ],
    },
    {
      name: 'Choice of Protein',
      is_required: true,
      options: [
        { name: 'Fried Chicken', price_modifier: 0, is_available: true },
        { name: 'Grilled Fish', price_modifier: 500, is_available: true },
        { name: 'Beef Cut', price_modifier: 0, is_available: true },
        { name: 'Assorted Meat', price_modifier: 700, is_available: true },
        { name: 'Turkey / Jumbo Chicken', price_modifier: 1200, is_available: true },
      ],
    },
    {
      name: 'Sides & Extras',
      is_required: false,
      options: [
        { name: 'Extra Fried Plantain (Dodo)', price_modifier: 800, is_available: true },
        { name: 'Moi-Moi', price_modifier: 1000, is_available: true },
        { name: 'Coleslaw Salad', price_modifier: 700, is_available: true },
        { name: 'Extra Sauce', price_modifier: 500, is_available: true },
      ],
    },
  ],
  'Shawarma': [
    {
      name: 'Shawarma Size',
      is_required: true,
      options: [
        { name: 'Regular Size', price_modifier: 0, is_available: true },
        { name: 'Jumbo Size', price_modifier: 1000, is_available: true },
      ],
    },
    {
      name: 'Sausage / Hotdog Option',
      is_required: true,
      options: [
        { name: 'Single Sausage', price_modifier: 0, is_available: true },
        { name: 'Double Sausage', price_modifier: 500, is_available: true },
        { name: 'No Sausage (Pure Meat)', price_modifier: 0, is_available: true },
      ],
    },
    {
      name: 'Pepper & Spice Level',
      is_required: true,
      options: [
        { name: 'Mild', price_modifier: 0, is_available: true },
        { name: 'Medium Spicy', price_modifier: 0, is_available: true },
        { name: 'Extra Hot & Spicy', price_modifier: 0, is_available: true },
      ],
    },
    {
      name: 'Add-on Fillings',
      is_required: false,
      options: [
        { name: 'Extra Mozzarella Cheese', price_modifier: 1000, is_available: true },
        { name: 'Extra Creamy Mayo', price_modifier: 400, is_available: true },
      ],
    },
  ],
  'Pasta & Noodles': [
    {
      name: 'Serving Size',
      is_required: true,
      options: [
        { name: 'Single Pack', price_modifier: 0, is_available: true },
        { name: 'Double Combo Pack', price_modifier: 2000, is_available: true },
      ],
    },
    {
      name: 'Protein Choice',
      is_required: true,
      options: [
        { name: 'Fried Egg & Sausage', price_modifier: 0, is_available: true },
        { name: 'Chicken Wings', price_modifier: 1200, is_available: true },
        { name: 'Seafood (Prawns & Calamari)', price_modifier: 2500, is_available: true },
      ],
    },
  ],
  'Drinks & Beverages': [
    {
      name: 'Bottle Size',
      is_required: true,
      options: [
        { name: '500ml Bottle', price_modifier: 0, is_available: true },
        { name: '1 Liter Bottle', price_modifier: 1200, is_available: true },
        { name: '2 Liters Family Pack', price_modifier: 2800, is_available: true },
      ],
    },
    {
      name: 'Sweetener Level',
      is_required: false,
      options: [
        { name: 'Unsweetened (Pure Natural)', price_modifier: 0, is_available: true },
        { name: 'Natural Honey Infused', price_modifier: 300, is_available: true },
      ],
    },
  ],
}

export function ProductOptionsManager({ productId }: { productId: string }) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [productCategory, setProductCategory] = useState<string>('')
  const [productName, setProductName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadOptions()
  }, [productId])

  const loadOptions = async () => {
    try {
      setLoading(true)

      const { data: product, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      if (product) {
        setProductCategory(product.category || '')
        setProductName(product.name || '')

        // Load custom option groups if available
        if (product.customization_options && Array.isArray(product.customization_options)) {
          setOptionGroups(product.customization_options)
        } else {
          setOptionGroups([])
        }
      }
    } catch (error) {
      console.error('Error loading product options:', error)
    } finally {
      setLoading(false)
    }
  }

  const isCake = productCategory?.toLowerCase() === 'cakes' || productName?.toLowerCase().includes('cake')

  const applyPreset = (presetName: string) => {
    const preset = CATEGORY_PRESETS[presetName]
    if (preset) {
      setOptionGroups(JSON.parse(JSON.stringify(preset)))
    }
  }

  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, { name: '', is_required: true, options: [] }])
  }

  const removeOptionGroup = (index: number) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== index))
  }

  const updateOptionGroup = (index: number, field: string, value: any) => {
    const updated = [...optionGroups]
    updated[index] = { ...updated[index], [field]: value }
    setOptionGroups(updated)
  }

  const addOption = (groupIndex: number) => {
    const updated = [...optionGroups]
    updated[groupIndex].options.push({ name: '', price_modifier: 0, is_available: true })
    setOptionGroups(updated)
  }

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...optionGroups]
    updated[groupIndex].options.splice(optionIndex, 1)
    setOptionGroups(updated)
  }

  const updateOption = (groupIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...optionGroups]
    updated[groupIndex].options[optionIndex] = {
      ...updated[groupIndex].options[optionIndex],
      [field]: value,
    }
    setOptionGroups(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Direct update to store_products table in Supabase
      const { error } = await supabase
        .from('store_products')
        .update({
          customization_options: optionGroups,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)

      if (error) throw error

      alert('Customization options saved successfully! They are now live on the storefront.')
    } catch (error: any) {
      console.error('Error saving options:', error)
      alert(`Failed to save options: ${error.message || 'Database rejected update.'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 space-x-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#EAA823]" />
        <span className="text-xs">Loading product customizations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-[#1a1f2e] p-6 rounded-2xl border border-[#EAA823]/20 text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            {isCake ? <Cake className="w-5 h-5 text-[#EAA823]" /> : <Utensils className="w-5 h-5 text-[#EAA823]" />}
            <h3 className="text-lg font-bold text-white">
              {isCake ? 'Cake Tier & Custom Inscription Settings' : 'Food & Meal Customization Options'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isCake 
              ? 'Cake dimension matrix, layer selections, and custom inscriptions are enabled automatically.'
              : `Configure portion sizes, protein selections, spice levels, and side dishes for customers.`}
          </p>
        </div>

        <Button
          type="button"
          onClick={addOptionGroup}
          className="bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-bold text-xs rounded-xl gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Option Group
        </Button>
      </div>

      {/* One-Click Presets for Fast Setup */}
      {!isCake && (
        <div className="bg-[#0F1419] p-4 rounded-xl border border-white/5 space-y-2">
          <span className="text-xs font-bold text-[#EAA823] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Quick Presets (Click to Auto-Fill):
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORY_PRESETS).map((presetKey) => (
              <button
                key={presetKey}
                type="button"
                onClick={() => applyPreset(presetKey)}
                className="text-xs bg-[#1a1f2e] border border-white/10 hover:border-[#EAA823] hover:text-[#EAA823] px-3 py-1.5 rounded-lg text-gray-300 transition font-medium"
              >
                + {presetKey}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Option Groups List */}
      {optionGroups.length === 0 ? (
        <div className="text-center py-10 bg-[#0F1419] border border-dashed border-white/10 rounded-xl space-y-2">
          <p className="text-sm font-semibold text-gray-300">No custom option groups configured yet.</p>
          <p className="text-xs text-gray-500">
            Click &quot;Add Option Group&quot; or choose a preset above to let customers customize protein, portions, or extras.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {optionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-[#0F1419] border border-[#EAA823]/20 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Input
                    placeholder="Group title (e.g., Choice of Protein, Portion Size, Spice Level)"
                    value={group.name}
                    onChange={(e) => updateOptionGroup(groupIndex, 'name', e.target.value)}
                    className="bg-[#1a1f2e] border-white/10 text-white font-bold text-xs sm:text-sm rounded-xl"
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={group.is_required}
                      onChange={(e) => updateOptionGroup(groupIndex, 'is_required', e.target.checked)}
                      className="w-4 h-4 rounded text-[#EAA823] focus:ring-[#EAA823]"
                    />
                    Required Selection
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOptionGroup(groupIndex)}
                  className="text-red-400 hover:bg-red-500/10 p-2 h-auto rounded-lg self-end sm:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Sub-Options List */}
              <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-[#EAA823]/30">
                {group.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <Input
                      placeholder="Option name (e.g. Fried Chicken, 2 Portions, Extra Cheese)"
                      value={option.name}
                      onChange={(e) => updateOption(groupIndex, optionIndex, 'name', e.target.value)}
                      className="bg-[#1a1f2e] border-white/10 text-white text-xs rounded-xl flex-1 min-w-[150px]"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 font-mono">+₦</span>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Price Modifier (0 if free)"
                        value={option.price_modifier}
                        onChange={(e) => updateOption(groupIndex, optionIndex, 'price_modifier', parseFloat(e.target.value) || 0)}
                        className="w-28 bg-[#1a1f2e] border-white/10 text-white text-xs rounded-xl"
                      />
                    </div>
                    <label className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={option.is_available}
                        onChange={(e) => updateOption(groupIndex, optionIndex, 'is_available', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#EAA823]"
                      />
                      Available
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(groupIndex, optionIndex)}
                      className="text-red-400 hover:bg-red-500/10 p-1.5 h-auto rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(groupIndex)}
                  className="w-full mt-2 border-dashed border-white/20 text-gray-300 hover:text-white hover:border-[#EAA823] text-xs font-semibold rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Choice to &quot;{group.name || 'Group'}&quot;
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-extrabold text-xs sm:text-sm py-6 rounded-xl shadow-lg border border-[#EAA823]/40 transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Options...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-[#EAA823]" />
              <span>Save Customization Options</span>
            </>
          )}
        </Button>
      </div>

    </div>
  )
}