'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Cake, 
  Utensils, 
  Save, 
  Loader2, 
  X, 
  Clock, 
  Users, 
  ShieldAlert, 
  Layers,
  ChevronDown,
  Info
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
  type?: 'radio' | 'counter' | 'checkbox'
  options: Option[]
}

interface ProductDetails {
  description: string
  ingredients: string[]
  allergens: string[]
  preparation_time_minutes: number | string
  servings: number | string
  storage_instructions: string
}

// 1-Click Presets identical to your Waitlist & Storefront specials
const WAITLIST_PRESETS: Record<string, OptionGroup[]> = {
  'Shawarma Customization': [
    {
      name: 'Shawarma Size',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Medium size', price_modifier: 5000, is_available: true, description: 'Classic single sausage roll' },
        { name: 'Jumbo size', price_modifier: 12000, is_available: true, description: 'Double sausage + extra meat' },
      ],
    },
    {
      name: 'Spice & Pepper Level',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Mild', price_modifier: 0, is_available: true },
        { name: 'Medium Spicy', price_modifier: 0, is_available: true },
        { name: 'Extra Hot & Spicy', price_modifier: 0, is_available: true },
      ],
    },
    {
      name: 'Add-on Extras',
      is_required: false,
      type: 'checkbox',
      options: [
        { name: 'Extra Mozzarella Cheese', price_modifier: 1000, is_available: true },
        { name: 'Extra Creamy Mayo', price_modifier: 400, is_available: true },
      ],
    }
  ],
  'Stir-Fried Noodles & Turkey': [
    {
      name: 'Choice of Protein',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Full Turkey', price_modifier: 6000, is_available: true, description: 'Crispy fried large turkey cut' },
        { name: 'Turkey Cubes', price_modifier: 2000, is_available: true, description: 'Tender diced turkey chunks', has_counter: true, unit_price: 2000 },
      ],
    },
    {
      name: 'Spice Level',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Standard Pepper', price_modifier: 0, is_available: true },
        { name: 'Extra Spiced Pepper', price_modifier: 0, is_available: true },
        { name: 'Mild', price_modifier: 0, is_available: true },
      ],
    }
  ],
  'Rice Preparations (Jollof & Fried)': [
    {
      name: 'Rice Preparation Style',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Smokey Jollof Rice', price_modifier: 3000, is_available: true, description: 'Authentic firewood-style reduction' },
        { name: 'Signature Fried Rice', price_modifier: 3000, is_available: true, description: 'Wok-tossed sweet corn & garden veggies' },
        { name: 'Mixed Fried & Jollof Rice', price_modifier: 3500, is_available: true, description: 'Split combo platter' },
      ],
    },
    {
      name: 'Protein Add-on',
      is_required: false,
      type: 'radio',
      options: [
        { name: 'Fried Chicken Cut', price_modifier: 2000, is_available: true },
        { name: 'Grilled Fish', price_modifier: 2500, is_available: true },
        { name: 'Full Turkey Cut', price_modifier: 6000, is_available: true },
        { name: 'Assorted Meat', price_modifier: 1500, is_available: true },
      ],
    },
    {
      name: 'Side Dishes',
      is_required: false,
      type: 'checkbox',
      options: [
        { name: 'Fried Plantain (Dodo)', price_modifier: 800, is_available: true },
        { name: 'Coleslaw Salad', price_modifier: 700, is_available: true },
        { name: 'Moi-Moi', price_modifier: 1000, is_available: true },
      ]
    }
  ],
  'Parfait & Cakeloaves': [
    {
      name: 'Parfait Category',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Classic Parfait (350ml)', price_modifier: 5500, is_available: true, description: 'Yogurt, apples, grapes, granola, coconut flakes & cashew' },
        { name: 'Classic Parfait (1 Liter)', price_modifier: 13000, is_available: true, description: '1L Family Tub with full fruit & nut layers' },
        { name: 'Tropical Parfait (350ml)', price_modifier: 6500, is_available: true, description: 'Greek yogurt, apple/grape slices, roasted coconut, cashew & almonds' },
        { name: 'Tropical Parfait (1 Liter)', price_modifier: 14000, is_available: true, description: '1L Tropical Greek Yogurt Tub' },
        { name: 'Nutty Essence (350ml)', price_modifier: 6500, is_available: true, description: 'Granola, coconut flakes, cashews & almonds with minimal fruit' },
        { name: 'Cake Parfait (350ml)', price_modifier: 6000, is_available: true, description: 'Vanilla, chocolate & red velvet sponge layers with caramel' },
        { name: 'Cake Parfait (1 Liter)', price_modifier: 14000, is_available: true, description: '1L High-Profile Cake Parfait Bowl' },
      ],
    },
    {
      name: 'Mini Cakeloaf Add-on (Whipped Cream & Luxury Toppings)',
      is_required: false,
      type: 'checkbox',
      options: [
        { name: 'Chocolate Cakeloaf', price_modifier: 4000, is_available: true },
        { name: 'Vanilla Cakeloaf', price_modifier: 4300, is_available: true },
        { name: 'Red Velvet Cakeloaf', price_modifier: 4500, is_available: true },
        { name: '2 Mixed Flavours Cakeloaf', price_modifier: 4600, is_available: true },
      ]
    }
  ],
  'Fresh Catfish Pepper Soup': [
    {
      name: 'Portion Size & Fish Cut',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Full Catfish Bowl (1 Liter)', price_modifier: 16000, is_available: true, description: 'Prepared fresh with aromatic native Ehuru, Uda & Scent leaf herbs' },
        { name: 'Standard Medium Portion', price_modifier: 9000, is_available: true, description: 'Half portion freshly prepared' },
      ]
    },
    {
      name: 'Spice & Pepper Level',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Traditional Hot & Spicy', price_modifier: 0, is_available: true },
        { name: 'Medium Heat', price_modifier: 0, is_available: true },
      ]
    }
  ]
}

export function ProductDetailsManager({ productId, onSaved }: { productId: string; onSaved?: () => void }) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'customization' | 'culinary'>('customization')

  // Product Basic Meta
  const [productName, setProductName] = useState('')
  const [productCategory, setProductCategory] = useState('')

  // Customization Options
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])

  // Culinary Details
  const [details, setDetails] = useState<ProductDetails>({
    description: '',
    ingredients: [],
    allergens: [],
    preparation_time_minutes: '',
    servings: '',
    storage_instructions: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newIngredient, setNewIngredient] = useState('')
  const [newAllergen, setNewAllergen] = useState('')

  useEffect(() => {
    if (productId) {
      loadData()
    }
  }, [productId])

  const loadData = async () => {
    try {
      setLoading(true)

      // 1. Fetch Product from Supabase
      const { data: product, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      if (product) {
        setProductName(product.name || '')
        setProductCategory(product.category || '')
        setDetails({
          description: product.description || '',
          ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
          allergens: Array.isArray(product.allergens) ? product.allergens : [],
          preparation_time_minutes: product.preparation_time_minutes || 20,
          servings: product.servings || 1,
          storage_instructions: product.storage_instructions || ''
        })

        if (Array.isArray(product.customization_options)) {
          setOptionGroups(product.customization_options)
        } else {
          setOptionGroups([])
        }
      }
    } catch (error) {
      console.error('Failed to load product customization data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (presetKey: string) => {
    const preset = WAITLIST_PRESETS[presetKey]
    if (preset) {
      setOptionGroups(JSON.parse(JSON.stringify(preset)))
    }
  }

  const addOptionGroup = () => {
    setOptionGroups([
      ...optionGroups, 
      { name: '', is_required: true, type: 'radio', options: [] }
    ])
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
    updated[groupIndex].options.push({
      name: '',
      price_modifier: 0,
      is_available: true,
      description: ''
    })
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

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setDetails({
        ...details,
        ingredients: [...details.ingredients, newIngredient.trim()]
      })
      setNewIngredient('')
    }
  }

  const removeIngredient = (index: number) => {
    setDetails({
      ...details,
      ingredients: details.ingredients.filter((_, i) => i !== index)
    })
  }

  const addAllergen = () => {
    if (newAllergen.trim()) {
      setDetails({
        ...details,
        allergens: [...details.allergens, newAllergen.trim()]
      })
      setNewAllergen('')
    }
  }

  const removeAllergen = (index: number) => {
    setDetails({
      ...details,
      allergens: details.allergens.filter((_, i) => i !== index)
    })
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)

      const payload = {
        description: details.description,
        ingredients: details.ingredients,
        allergens: details.allergens,
        preparation_time_minutes: parseInt(String(details.preparation_time_minutes), 10) || 20,
        servings: parseInt(String(details.servings), 10) || 1,
        storage_instructions: details.storage_instructions,
        customization_options: optionGroups,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('store_products')
        .update(payload)
        .eq('id', productId)

      if (error) throw error

      alert('Product details and live customization options saved successfully!')
      onSaved?.()
    } catch (error: any) {
      console.error('Save error:', error)
      alert(`Error saving product customization: ${error.message || 'Check database connectivity.'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#EAA823]" />
        <span className="text-xs">Loading product customization data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-[#0a121d] text-white p-5 sm:p-7 rounded-3xl border border-[#EAA823]/30 shadow-2xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#EAA823]" />
            <h3 className="text-base sm:text-lg font-black text-white">
              Product Customization & Details Manager
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Configuring: <strong className="text-[#EAA823]">{productName}</strong> ({productCategory || 'Store Meal'})
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#121c2c] p-1 rounded-xl border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('customization')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'customization' 
                ? 'bg-[#EAA823] text-[#0A2E1D] shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Interactive Options ({optionGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('culinary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'culinary' 
                ? 'bg-[#EAA823] text-[#0A2E1D] shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Culinary Specs &amp; Health
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE CUSTOMIZATION GROUPS (Waitlist Style)                  */}
      {/* ========================================================================= */}
      {activeTab === 'customization' && (
        <div className="space-y-5">
          
          {/* Quick 1-Click Preset Ribbon */}
          <div className="bg-[#121c2c] p-4 rounded-2xl border border-white/10 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EAA823] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Waitlist Presets (Auto-populate groups &amp; prices):
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.keys(WAITLIST_PRESETS).map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => applyPreset(presetKey)}
                  className="text-xs bg-[#1a2638] border border-white/10 hover:border-[#EAA823] hover:text-[#EAA823] px-3 py-1.5 rounded-xl text-gray-300 transition font-medium"
                >
                  + {presetKey}
                </button>
              ))}
            </div>
          </div>

          {/* Option Groups Container */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Configured Option Groups ({optionGroups.length})
            </span>
            <Button
              type="button"
              onClick={addOptionGroup}
              className="bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-extrabold text-xs rounded-xl gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Option Group
            </Button>
          </div>

          {optionGroups.length === 0 ? (
            <div className="text-center py-10 bg-[#121c2c] border border-dashed border-white/10 rounded-2xl space-y-2">
              <p className="text-sm font-semibold text-gray-300">No option groups added yet.</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Click one of the 1-click presets above or tap &quot;Add Option Group&quot; to configure Shawarma sizes, noodle proteins, rice styles, or parfaits.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {optionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-[#121c2c] border border-[#EAA823]/25 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
                  
                  {/* Group Header Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                      <Input
                        placeholder="Group Name (e.g., Shawarma Size, Rice Style, Protein Choice)"
                        value={group.name}
                        onChange={(e) => updateOptionGroup(groupIndex, 'name', e.target.value)}
                        className="bg-[#0a121d] border-white/15 text-white font-bold text-xs sm:text-sm rounded-xl"
                      />

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={group.is_required}
                            onChange={(e) => updateOptionGroup(groupIndex, 'is_required', e.target.checked)}
                            className="w-4 h-4 rounded text-[#EAA823] focus:ring-[#EAA823]"
                          />
                          Required
                        </label>

                        <select
                          value={group.type || 'radio'}
                          onChange={(e) => updateOptionGroup(groupIndex, 'type', e.target.value)}
                          className="bg-[#0a121d] border border-white/15 text-white text-xs p-2 rounded-xl outline-none"
                        >
                          <option value="radio">Single Select (Radio)</option>
                          <option value="checkbox">Multi-Select (Checkbox)</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOptionGroup(groupIndex)}
                      className="text-red-400 hover:bg-red-500/10 p-2 rounded-xl self-end sm:self-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Sub-Options List */}
                  <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-[#EAA823]/40">
                    {group.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="bg-[#0a121d] p-3 rounded-xl border border-white/10 space-y-2">
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                          <Input
                            placeholder="Option title (e.g., Medium size, Full Turkey, Jollof)"
                            value={option.name}
                            onChange={(e) => updateOption(groupIndex, optionIndex, 'name', e.target.value)}
                            className="bg-[#121c2c] border-white/10 text-white text-xs rounded-xl flex-1 min-w-[140px]"
                          />

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#EAA823] font-mono font-bold">₦</span>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Price"
                              value={option.price_modifier}
                              onChange={(e) => updateOption(groupIndex, optionIndex, 'price_modifier', parseFloat(e.target.value) || 0)}
                              className="w-28 bg-[#121c2c] border-white/10 text-white text-xs rounded-xl font-bold"
                            />
                          </div>

                          <label className="flex items-center gap-1 text-[11px] text-gray-300 whitespace-nowrap cursor-pointer">
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
                            className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Optional Sub-description & Unit Counter Toggle */}
                        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center pt-1">
                          <Input
                            placeholder="Description subtitle (e.g. 'Classic single sausage roll', 'Wok-tossed with corn')"
                            value={option.description || ''}
                            onChange={(e) => updateOption(groupIndex, optionIndex, 'description', e.target.value)}
                            className="bg-[#121c2c] border-white/5 text-gray-300 text-[11px] rounded-lg flex-1"
                          />

                          <label className="flex items-center gap-1.5 text-[10px] text-amber-300 whitespace-nowrap cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!option.has_counter}
                              onChange={(e) => updateOption(groupIndex, optionIndex, 'has_counter', e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-[#EAA823]"
                            />
                            Has Unit Quantity Counter (e.g. ₦2,000/cube)
                          </label>
                        </div>
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

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CULINARY SPECS, INGREDIENTS & ALLERGENS                            */}
      {/* ========================================================================= */}
      {activeTab === 'culinary' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">
              Extended Product Description
            </label>
            <Textarea
              value={details.description}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
              placeholder="Provide full culinary, aroma, and textural notes..."
              rows={3}
              className="bg-[#121c2c] border-white/10 text-white text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#EAA823]" />
                Prep Time (minutes)
              </label>
              <Input
                type="number"
                value={details.preparation_time_minutes}
                onChange={(e) => setDetails({ ...details, preparation_time_minutes: e.target.value })}
                placeholder="20"
                className="bg-[#121c2c] border-white/10 text-white text-xs rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#EAA823]" />
                Servings Count
              </label>
              <Input
                type="number"
                value={details.servings}
                onChange={(e) => setDetails({ ...details, servings: e.target.value })}
                placeholder="1"
                className="bg-[#121c2c] border-white/10 text-white text-xs rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">
              Storage Instructions
            </label>
            <Input
              value={details.storage_instructions}
              onChange={(e) => setDetails({ ...details, storage_instructions: e.target.value })}
              placeholder="e.g., Best consumed warm or refrigerated at 4°C within 48 hours."
              className="bg-[#121c2c] border-white/10 text-white text-xs rounded-xl"
            />
          </div>

          {/* Ingredients Tagging */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-gray-300 uppercase">
              Fresh Ingredients
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="e.g. Parboiled Long-grain Rice, Ripe Tomatoes, Scent Leaf"
                className="bg-[#121c2c] border-white/10 text-white text-xs rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addIngredient()
                  }
                }}
              />
              <Button type="button" onClick={addIngredient} className="bg-[#EAA823] text-[#0A2E1D] font-bold text-xs rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {details.ingredients.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121c2c] border border-white/10 text-xs text-gray-200">
                  <span>{item}</span>
                  <button type="button" onClick={() => removeIngredient(index)} className="text-gray-400 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Allergens Tagging */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-red-400 uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Allergens
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newAllergen}
                onChange={(e) => setNewAllergen(e.target.value)}
                placeholder="e.g. Dairy, Peanuts, Gluten, Shellfish"
                className="bg-[#121c2c] border-white/10 text-white text-xs rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAllergen()
                  }
                }}
              />
              <Button type="button" onClick={addAllergen} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {details.allergens.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  <span>{item}</span>
                  <button type="button" onClick={() => removeAllergen(index)} className="text-red-400 hover:text-red-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Save Button */}
      <div className="pt-3 border-t border-white/10">
        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="w-full bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-black text-xs sm:text-sm py-6 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing to Storefront...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save &amp; Update Live Storefront Details</span>
            </>
          )}
        </Button>
      </div>

    </div>
  )
}