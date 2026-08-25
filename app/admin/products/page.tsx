'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Trash2,
  Edit2,
  Plus,
  X,
  ChevronLeft,
  Cake,
  Layers,
  Sparkles,
  Save,
  Utensils,
  Eye,
  CheckCircle2,
  Settings2,
  Package,
  Clock,
  Loader2,
  Upload,
  Fish
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const STORE_CATEGORIES = [
  'Rice Dishes',
  'Shawarma',
  'Pasta',
  'Noodles',
  'Corndogs',
  'Puff & Cream',
  'Milky Doughnut',
  'Fresh Juice',
  'Zobo',
  'Food Kombos',
  'Parfait',
  'Cakeloaf',
  'Cakes',
  'Meals',
  'Soups',
  'Swallow',
  'Proteins',
  'Sides',
  'Beverages',
]

interface Option {
  name: string
  price_modifier: number
  is_available: boolean
  description?: string
  has_counter?: boolean
  unit_price?: number
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

interface CakeTierPrice {
  layers: number
  price: number
  label?: string
}

interface CakeConfig {
  size: '6 inches' | '7 inches'
  primaryFlavor: 'Vanilla' | 'Chocolate' | 'Red Velvet' | 'Multi-Flavor Combo'
  tiers: CakeTierPrice[]
  allowCustomInscription: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category: string
  in_stock: boolean
  stock_quantity: number
  min_order_quantity?: number
  cake_details?: CakeConfig | null
  customization_options?: OptionGroup[] | null
  ingredients?: string[] | null
  allergens?: string[] | null
  preparation_time_minutes?: number | null
  servings?: number | null
  storage_instructions?: string | null
  is_time_bound?: boolean
  available_from?: string | null
  available_to?: string | null
  menu_section?: string | null
}

const DEFAULT_6INCH_TIERS: CakeTierPrice[] = [
  { layers: 1, price: 20000, label: '1 Layer' },
  { layers: 2, price: 38500, label: '2 Layers' },
  { layers: 3, price: 52000, label: '3 Layers' },
]

const DEFAULT_7INCH_TIERS: CakeTierPrice[] = [
  { layers: 1, price: 26000, label: '1 Layer' },
  { layers: 2, price: 46000, label: '2 Layers' },
  { layers: 3, price: 55000, label: '3 Layers' },
]

const DEFAULT_FISH_CUTS = ['Head Piece', 'Middle Cut', 'Tail Piece']

const WAITLIST_PRESETS: Record<string, OptionGroup[]> = {
  'Catfish Pepper Soup (Portions & Cuts)': [
    {
      name: 'Portion Size & Cuts',
      is_required: true,
      type: 'radio',
      price_mode: 'standalone',
      options: [
        {
          name: 'Full Catfish Bowl (1 Liter)',
          price_modifier: 16000,
          is_available: true,
          description: 'Full fresh fish with native Ehuru, Uda & Scent leaf herbs',
          has_cuts_selection: true,
          cut_selection_title: 'Select Preferred Fish Cut / Parts',
          allowed_cuts: ['Full Fish (All Parts)', 'Extra Head + Middle', 'Middle Cuts Only', 'Tail + Middle'],
          min_cuts_selection: 1,
          max_cuts_selection: 1
        },
        {
          name: 'Catfish Cuts (Piece Selection)',
          price_modifier: 9000,
          is_available: true,
          description: 'Pick your preferred cuts from fresh daily catch',
          has_cuts_selection: true,
          cut_selection_title: 'Select Preferred Fish Cut / Parts',
          allowed_cuts: ['Head Piece', 'Middle Cut', 'Tail Piece'],
          min_cuts_selection: 1,
          max_cuts_selection: 2
        },
      ]
    },
    {
      name: 'Spice & Pepper Level',
      is_required: true,
      type: 'radio',
      price_mode: 'addon',
      options: [
        { name: 'Medium Native Spice', price_modifier: 0, is_available: true },
        { name: 'Extra Hot & Peppery', price_modifier: 0, is_available: true },
        { name: 'Mild Pepper', price_modifier: 0, is_available: true },
      ]
    }
  ],
  'Shawarma Customization': [
    {
      name: 'Shawarma Size',
      is_required: true,
      type: 'radio',
      price_mode: 'standalone',
      options: [
        { name: 'Medium size', price_modifier: 5000, is_available: true, description: 'Classic single sausage roll' },
        { name: 'Jumbo size', price_modifier: 12000, is_available: true, description: 'Double sausage + extra meat' },
      ],
    },
    {
      name: 'Spice & Pepper Level',
      is_required: true,
      type: 'radio',
      price_mode: 'addon',
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
      price_mode: 'addon',
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
      price_mode: 'standalone',
      options: [
        {
          name: 'Full Turkey Cut',
          price_modifier: 6000,
          is_available: true,
          description: 'Crispy fried large turkey cut',
          has_cuts_selection: true,
          cut_selection_title: 'Select Preferred Turkey Cut',
          allowed_cuts: ['Turkey Wing', 'Turkey Lap / Drumstick', 'Turkey Breast'],
          min_cuts_selection: 1,
          max_cuts_selection: 1
        },
        { name: 'Turkey Cubes', price_modifier: 2000, is_available: true, description: 'Tender diced turkey chunks', has_counter: true, unit_price: 2000, min_multiplier_count: 1 },
      ],
    },
    {
      name: 'Spice Level',
      is_required: true,
      type: 'radio',
      price_mode: 'addon',
      options: [
        { name: 'Standard Pepper', price_modifier: 0, is_available: true },
        { name: 'Extra Spiced Pepper', price_modifier: 0, is_available: true },
        { name: 'Mild', price_modifier: 0, is_available: true },
      ],
    }
  ]
}

export default function StoreInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'Rice Dishes',
    in_stock: true,
    stock_quantity: '10',
    min_order_quantity: '1',
    is_time_bound: false,
    available_from: '',
    available_to: '',
    menu_section: 'standard',
  })

  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [ingredients, setIngredients] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [prepTime, setPrepTime] = useState<string | number>(20)
  const [servings, setServings] = useState<string | number>(1)
  const [storageInstructions, setStorageInstructions] = useState('')

  const [newCutInput, setNewCutInput] = useState<Record<string, string>>({})
  const [newIngredient, setNewIngredient] = useState('')
  const [newAllergen, setNewAllergen] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [activeTab, setActiveTab] = useState<'basic' | 'customization' | 'cake_tiers'>('basic')
  const [cakeSize, setCakeSize] = useState<'6 inches' | '7 inches'>('6 inches')
  const [cakeFlavor, setCakeFlavor] = useState<'Vanilla' | 'Chocolate' | 'Red Velvet' | 'Multi-Flavor Combo'>('Vanilla')
  const [cakeTiers, setCakeTiers] = useState<CakeTierPrice[]>(DEFAULT_6INCH_TIERS)
  const [allowInscription, setAllowInscription] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      alert('Failed to load products from database.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: 'Rice Dishes',
      in_stock: true,
      stock_quantity: '10',
      min_order_quantity: '1',
      is_time_bound: false,
      available_from: '',
      available_to: '',
      menu_section: 'standard',
    })
    setIsCustomCategory(false)
    setCustomCategoryInput('')
    setOptionGroups([])
    setIngredients([])
    setAllergens([])
    setPrepTime(20)
    setServings(1)
    setStorageInstructions('')
    setCakeSize('6 inches')
    setCakeFlavor('Vanilla')
    setCakeTiers(DEFAULT_6INCH_TIERS)
    setAllowInscription(true)
    setEditingId(null)
    setActiveTab('basic')
  }

  const handleEdit = (product: Product) => {
    const isStandardCat = STORE_CATEGORIES.includes(product.category)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price ? product.price.toString() : '0',
      image_url: product.image_url || '',
      category: isStandardCat ? product.category : 'custom',
      in_stock: product.in_stock ?? true,
      stock_quantity: (product.stock_quantity || 0).toString(),
      min_order_quantity: (product.min_order_quantity || 1).toString(),
      is_time_bound: product.is_time_bound ?? false,
      available_from: product.available_from || '',
      available_to: product.available_to || '',
      menu_section: product.menu_section || 'standard',
    })
    setIsCustomCategory(!isStandardCat)
    setCustomCategoryInput(!isStandardCat ? product.category : '')

    const normalizedGroups = (Array.isArray(product.customization_options) ? product.customization_options : []).map(g => ({
      ...g,
      price_mode: g.price_mode || (g.type === 'checkbox' ? 'addon' : 'standalone'),
      options: (g.options || []).map(opt => ({
        ...opt,
        min_multiplier_count: opt.min_multiplier_count ?? 1,
        cut_selection_title: opt.cut_selection_title || 'Select Preferred Cut / Parts',
        allowed_cuts: opt.allowed_cuts || (opt.has_cuts_selection ? DEFAULT_FISH_CUTS : []),
        min_cuts_selection: opt.min_cuts_selection ?? (opt.has_cuts_selection ? 1 : 0),
        max_cuts_selection: opt.max_cuts_selection || 1,
      }))
    }))

    setOptionGroups(normalizedGroups)
    setIngredients(Array.isArray(product.ingredients) ? product.ingredients : [])
    setAllergens(Array.isArray(product.allergens) ? product.allergens : [])
    setPrepTime(product.preparation_time_minutes || 20)
    setServings(product.servings || 1)
    setStorageInstructions(product.storage_instructions || '')

    setEditingId(product.id)

    const isCake = product.category?.toLowerCase() === 'cakes' || product.name.toLowerCase().includes('cake')
    if (isCake || product.cake_details) {
      const isSeven = product.name.includes('7') || (product.description && product.description.includes('7'))
      const details = product.cake_details || {
        size: isSeven ? '7 inches' : '6 inches',
        primaryFlavor: product.name.includes('Chocolate') ? 'Chocolate' : product.name.includes('Red Velvet') ? 'Red Velvet' : 'Vanilla',
        tiers: isSeven ? DEFAULT_7INCH_TIERS : DEFAULT_6INCH_TIERS,
        allowCustomInscription: true,
      }

      setCakeSize(details.size)
      setCakeFlavor(details.primaryFlavor as any)
      setCakeTiers(details.tiers || (details.size === '7 inches' ? DEFAULT_7INCH_TIERS : DEFAULT_6INCH_TIERS))
      setAllowInscription(details.allowCustomInscription ?? true)
    }

    setShowForm(true)
  }

  const handleAddTimeBound = (type: 'breakfast' | 'lunch' | 'dinner') => {
    resetForm()
    let start = ''
    let end = ''
    
    if (type === 'breakfast') { 
      start = '07:30'
      end = '09:00' 
    }
    if (type === 'lunch') { 
      start = '12:00'
      end = '16:00' 
    }
    if (type === 'dinner') { 
      start = '16:00'
      end = '21:00' 
    }
    
    setFormData(prev => ({
      ...prev,
      category: 'Meals',
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Special`,
      is_time_bound: true,
      available_from: start,
      available_to: end,
      menu_section: type
    }))
    setShowForm(true)
  }

  const handleMenuSectionChange = (section: string) => {
    let start = formData.available_from
    let end = formData.available_to
    
    if (section === 'breakfast') { 
      start = '07:30'
      end = '09:00' 
    }
    if (section === 'lunch') { 
      start = '12:00'
      end = '16:00' 
    }
    if (section === 'dinner') { 
      start = '16:00'
      end = '21:00' 
    }
    
    setFormData({ 
      ...formData, 
      menu_section: section, 
      available_from: start, 
      available_to: end 
    })
  }

  const handleSizeChange = (newSize: '6 inches' | '7 inches') => {
    setCakeSize(newSize)
    if (newSize === '6 inches') {
      setCakeTiers(DEFAULT_6INCH_TIERS)
      if (!formData.price || formData.price === '26000') {
        setFormData(prev => ({ ...prev, price: '20000' }))
      }
    } else {
      setCakeTiers(DEFAULT_7INCH_TIERS)
      if (!formData.price || formData.price === '20000') {
        setFormData(prev => ({ ...prev, price: '26000' }))
      }
    }
  }

  const handleTierPriceChange = (index: number, newPrice: number) => {
    const updated = [...cakeTiers]
    updated[index].price = newPrice
    setCakeTiers(updated)
    if (index === 0) {
      setFormData(prev => ({ ...prev, price: newPrice.toString() }))
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).')
      return
    }
    
    setUploadingImage(true)
    
    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('store-products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFormData(prev => ({ ...prev, image_url: e.target?.result as string }))
        }
        reader.readAsDataURL(file)
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('store-products')
          .getPublicUrl(data.path)

        setFormData(prev => ({ ...prev, image_url: publicUrlData?.publicUrl || data.path }))
      }
    } catch (err: any) {
      console.warn('Image storage warning:', err)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, image_url: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
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
      { name: '', is_required: true, type: 'radio', price_mode: 'standalone', options: [] }
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
      description: '',
      has_counter: false,
      unit_price: 0,
      min_multiplier_count: 1,
      has_cuts_selection: false,
      cut_selection_title: 'Select Preferred Cut / Parts',
      allowed_cuts: [],
      min_cuts_selection: 1,
      max_cuts_selection: 1
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

  const addCutToOption = (groupIndex: number, optionIndex: number) => {
    const key = `${groupIndex}-${optionIndex}`
    const cutName = (newCutInput[key] || '').trim()
    if (!cutName) return

    const updated = [...optionGroups]
    const currentCuts = updated[groupIndex].options[optionIndex].allowed_cuts || []

    if (!currentCuts.includes(cutName)) {
      updated[groupIndex].options[optionIndex].allowed_cuts = [...currentCuts, cutName]
      setOptionGroups(updated)
    }
    setNewCutInput({ ...newCutInput, [key]: '' })
  }

  const removeCutFromOption = (groupIndex: number, optionIndex: number, cutIndex: number) => {
    const updated = [...optionGroups]
    const currentCuts = updated[groupIndex].options[optionIndex].allowed_cuts || []
    updated[groupIndex].options[optionIndex].allowed_cuts = currentCuts.filter((_, idx) => idx !== cutIndex)
    setOptionGroups(updated)
  }

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()])
      setNewIngredient('')
    }
  }

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx))
  }

  const addAllergen = () => {
    if (newAllergen.trim()) {
      setAllergens([...allergens, newAllergen.trim()])
      setNewAllergen('')
    }
  }

  const removeAllergen = (idx: number) => {
    setAllergens(allergens.filter((_, i) => i !== idx))
  }

  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!formData.name.trim() || !formData.price) {
      alert('Please fill in product name and base price.')
      return
    }

    try {
      setSubmitting(true)

      const finalCategory = isCustomCategory ? customCategoryInput.trim() || 'Meals' : formData.category
      const isCake = finalCategory.toLowerCase() === 'cakes' || formData.name.toLowerCase().includes('cake')

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description || '',
        price: parseFloat(formData.price) || 0,
        image_url: formData.image_url || (isCake ? '/cakes.jpg' : '/Recipe2.jpg'),
        category: finalCategory,
        in_stock: formData.in_stock ?? true,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        min_order_quantity: parseInt(formData.min_order_quantity, 10) || 1,
        customization_options: optionGroups,
        ingredients: ingredients,
        allergens: allergens,
        preparation_time_minutes: parseInt(String(prepTime), 10) || 20,
        servings: parseInt(String(servings), 10) || 1,
        storage_instructions: storageInstructions,
        is_time_bound: formData.is_time_bound,
        available_from: formData.is_time_bound ? formData.available_from : null,
        available_to: formData.is_time_bound ? formData.available_to : null,
        menu_section: formData.is_time_bound ? formData.menu_section : 'standard',
        updated_at: new Date().toISOString()
      }

      if (isCake) {
        payload.cake_details = {
          size: cakeSize,
          primaryFlavor: cakeFlavor,
          tiers: cakeTiers,
          allowCustomInscription: allowInscription,
        }
      }

      if (editingId) {
        const { error } = await supabase
          .from('store_products')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
        alert('Product saved successfully!')
      } else {
        const { data: newProd, error } = await supabase
          .from('store_products')
          .insert([payload])
          .select()
          .single()

        if (error) throw error
        setEditingId(newProd.id)
        alert('New product published live to storefront!')
      }

      fetchProducts()
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert(error.message || 'Failed to save product.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This will remove it from the customer storefront.')) return
    try {
      const { error } = await supabase
        .from('store_products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      alert('Product deleted successfully.')
      fetchProducts()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete product.')
    }
  }

  const isCurrentCategoryCake =
    formData.category?.toLowerCase() === 'cakes' ||
    (isCustomCategory && customCategoryInput.toLowerCase().includes('cake')) ||
    formData.name.toLowerCase().includes('cake')

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* RESTORED: Standard Header with Back to Dashboard Button */}
      <div className="bg-white border-b border-gray-200 p-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-[#EAA823]" />
              Store Inventory & Customization Admin
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              Configure food products, independent portion pricing, part cut options, min/max limits, cake matrices, and time-bound section menus (Breakfast, Lunch, Dinner).
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="gap-2 font-bold border-gray-300 text-gray-700 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                resetForm()
                setFormData(prev => ({ ...prev, category: 'Cakes', price: '20000', name: '6" Classic Vanilla Cake' }))
                setShowForm(true)
              }}
              className="gap-2 bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold cursor-pointer shadow-md border border-[#EAA823]/50"
            >
              <Cake className="w-4 h-4" /> Add Cake Product
            </Button>

            <Button
              onClick={() => {
                resetForm()
                setFormData(prev => ({ ...prev, category: 'Rice Dishes', price: '3000', name: 'Smokey Jollof Rice' }))
                setShowForm(true)
              }}
              variant="outline"
              className="gap-2 font-bold cursor-pointer border-gray-300 text-gray-700 bg-white"
            >
              <Plus className="w-4 h-4" /> Add Meal / Street Food
            </Button>

            <Button
              onClick={() => handleAddTimeBound('breakfast')}
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700 font-bold cursor-pointer shadow-md"
            >
              <Clock className="w-4 h-4" /> Add Time-Bound Menu
            </Button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/" target="_blank" className="text-[#0A2E1D] hover:underline flex items-center gap-1">
              Storefront Preview <Eye className="w-3.5 h-3.5 text-[#EAA823]" />
            </Link>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                  {editingId ? 'Edit Product & Customizations' : 'Create Product Catalog Item'}
                  {isCurrentCategoryCake ? (
                    <span className="text-xs bg-[#EAA823] text-[#0A2E1D] font-bold px-2.5 py-0.5 rounded-full">
                      Cake Matrix Active
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
                      Interactive Options Mode
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure basic info, custom portion prices, time-bound visibility, add-ons, and specs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'basic'
                    ? 'border-[#0A2E1D] text-[#0A2E1D]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                1. Basic Info &amp; Category
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('customization')}
                className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'customization'
                    ? 'border-[#0A2E1D] text-[#0A2E1D] bg-emerald-50 rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Settings2 className="w-4 h-4 text-emerald-700" />
                2. Custom Options, Cuts &amp; Specs ({optionGroups.length})
              </button>

              {isCurrentCategoryCake && (
                <button
                  type="button"
                  onClick={() => setActiveTab('cake_tiers')}
                  className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'cake_tiers'
                      ? 'border-[#EAA823] text-[#0A2E1D] bg-[#EAA823]/10 rounded-t-xl'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#EAA823]" />
                  3. Cake Layer Pricing Matrix
                </button>
              )}
            </div>

            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Product Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Catfish Pepper Soup, Jumbo Shawarma"
                      className="rounded-xl border-gray-300 font-bold bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                        Base / Starting Price (₦ Naira) *
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                      <Input
                        type="number"
                        required
                        step="any"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g. 3000"
                        className="pl-8 rounded-xl border-gray-300 font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Category *
                    </label>
                    <select
                      value={isCustomCategory ? '__custom__' : formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true)
                          setFormData({ ...formData, category: '__custom__' })
                        } else {
                          setIsCustomCategory(false)
                          setFormData({ ...formData, category: e.target.value })
                        }
                      }}
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                    >
                      {STORE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom__">+ Custom Category...</option>
                    </select>

                    {isCustomCategory && (
                      <Input
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Enter new custom category name"
                        className="mt-2 rounded-xl border-gray-300 font-bold bg-white"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Stock Quantity
                    </label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="rounded-xl border-gray-300 font-bold bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Minimum Order Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.min_order_quantity}
                      onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                      className="rounded-xl border-gray-300 font-bold bg-white"
                    />
                  </div>
                </div>

                {/* TIME-BOUND SETTINGS SECTION */}
                <div className="space-y-4 bg-amber-50/50 p-5 rounded-2xl border border-amber-200/60 mt-6 shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#0A2E1D] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#EAA823]" /> Time-Bound Menu Configuration
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Restrict ordering for this item to specific times (e.g., Breakfast from 07:30 to 09:00).</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm hover:bg-amber-50 transition">
                      <input 
                        type="checkbox" 
                        checked={formData.is_time_bound} 
                        onChange={(e) => setFormData({ ...formData, is_time_bound: e.target.checked })} 
                        className="w-4 h-4 accent-[#0A2E1D] rounded cursor-pointer" 
                      />
                      <span className="text-xs font-bold text-amber-900">Enable Time Rules</span>
                    </label>
                  </div>

                  {formData.is_time_bound && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-amber-200/60">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Menu Section</label>
                        <select
                          value={formData.menu_section}
                          onChange={(e) => handleMenuSectionChange(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:border-[#EAA823] outline-none"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="standard">Custom Time Segment</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Available From</label>
                        <Input 
                          type="time" 
                          value={formData.available_from} 
                          onChange={(e) => setFormData({ ...formData, available_from: e.target.value })} 
                          className="bg-white text-xs font-bold rounded-xl h-10" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Order Cut-off Time</label>
                        <Input 
                          type="time" 
                          value={formData.available_to} 
                          onChange={(e) => setFormData({ ...formData, available_to: e.target.value })} 
                          className="bg-white text-xs font-bold rounded-xl h-10 border-red-300 focus:border-red-500" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Product Description
                  </label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details about ingredients, flavors, packaging, etc."
                    className="rounded-xl border-gray-300 font-medium bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Product Image
                  </label>
                  <div
                    onDragOver={(e) => { 
                      e.preventDefault()
                      setIsDragging(true) 
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragging ? 'border-[#0A2E1D] bg-emerald-50/50' : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0])
                        }
                      }}
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D] mb-2" />
                        <p className="text-xs font-bold text-gray-600">Uploading product image...</p>
                      </div>
                    ) : formData.image_url ? (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-xl shadow-md border"
                        />
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Image uploaded successfully. Click or drag to change.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 space-y-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm font-bold text-gray-700">Drag &amp; Drop product photo here or <span className="text-[#0A2E1D] underline">Browse</span></p>
                        <p className="text-xs text-gray-500">Supports PNG, JPG, JPEG, WEBP</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <Input
                      type="text"
                      placeholder="Or paste image URL directly (e.g. /catfish.jpg or https://...)"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="rounded-xl border-gray-300 text-xs font-medium bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="in_stock"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                    className="w-5 h-5 accent-[#0A2E1D] rounded cursor-pointer"
                  />
                  <label htmlFor="in_stock" className="text-sm font-bold text-gray-800 cursor-pointer">
                    Product is In Stock &amp; Available for Storefront Ordering
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'customization' && (
              <div className="space-y-8">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#0A2E1D] font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-[#EAA823]" />
                    <span>Quick Load Customization Preset</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(WAITLIST_PRESETS).map((presetKey) => (
                      <Button
                        key={presetKey}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(presetKey)}
                        className="bg-white text-xs font-bold hover:bg-[#0A2E1D] hover:text-white border-emerald-300"
                      >
                        {presetKey}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-[#0A2E1D]" /> Option Groups &amp; Piece Cuts
                      </h3>
                      <p className="text-xs text-gray-500">
                        Add groups like "Portion Size &amp; Cuts", "Spice Level", or "Add-on Extras". Set specific prices per option and enforce cut selection rules.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={addOptionGroup}
                      className="gap-1.5 bg-[#0A2E1D] text-white hover:bg-[#12422C] font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" /> Add Option Group
                    </Button>
                  </div>

                  {optionGroups.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 border border-dashed rounded-2xl">
                      <p className="text-sm text-gray-500 font-medium">No custom option groups configured yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Add Option Group" or select a preset above.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {optionGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
                            
                            <div className="flex-1 space-y-3 w-full">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
                                <div className="sm:col-span-5">
                                  <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-1">Group Title</label>
                                  <Input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => updateOptionGroup(groupIdx, 'name', e.target.value)}
                                    placeholder="e.g. Portion Size & Cuts"
                                    className="font-bold text-sm rounded-xl"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-1">Selection Mode</label>
                                  <select
                                    value={group.type || 'radio'}
                                    onChange={(e) => updateOptionGroup(groupIdx, 'type', e.target.value)}
                                    className="w-full h-10 px-2 py-1 bg-white border border-gray-300 rounded-xl text-xs font-bold"
                                  >
                                    <option value="radio">Single Select (Radio)</option>
                                    <option value="checkbox">Multi Select (Checkbox)</option>
                                  </select>
                                </div>

                                <div className="sm:col-span-4">
                                  <label className="text-[10px] font-extrabold uppercase text-gray-500 block mb-1">Price Calculation Mode</label>
                                  <select
                                    value={group.price_mode || 'standalone'}
                                    onChange={(e) => updateOptionGroup(groupIdx, 'price_mode', e.target.value)}
                                    className="w-full h-10 px-2 py-1 bg-white border border-gray-300 rounded-xl text-xs font-bold"
                                  >
                                    <option value="standalone">Standalone (Option Sets Full Price)</option>
                                    <option value="addon">Add-on (Adds to Base Price)</option>
                                  </select>
                                </div>
                              </div>
                              
                              {/* REQUIRED TOGGLE RESTORED */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`req-${groupIdx}`}
                                  checked={group.is_required}
                                  onChange={(e) => updateOptionGroup(groupIdx, 'is_required', e.target.checked)}
                                  className="w-4 h-4 accent-[#0A2E1D] rounded cursor-pointer"
                                />
                                <label htmlFor={`req-${groupIdx}`} className="text-xs font-bold text-gray-700 cursor-pointer">
                                  Customer MUST select from this group (Required Option)
                                </label>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeOptionGroup(groupIdx)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer self-end sm:self-start"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-extrabold uppercase text-gray-600">Group Options ({group.options.length})</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addOption(groupIdx)}
                                className="gap-1 text-xs font-bold border-gray-300"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Choice Option
                              </Button>
                            </div>

                            {group.options.map((option, optIdx) => (
                              <div key={optIdx} className="bg-gray-50/70 border border-gray-200 rounded-xl p-3 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                  <div className="sm:col-span-4">
                                    <Input
                                      type="text"
                                      value={option.name}
                                      onChange={(e) => updateOption(groupIdx, optIdx, 'name', e.target.value)}
                                      placeholder="Option Name (e.g. Full Catfish Bowl)"
                                      className="bg-white text-xs font-bold rounded-lg"
                                    />
                                  </div>

                                  <div className="sm:col-span-3">
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₦</span>
                                      <Input
                                        type="number"
                                        step="any"
                                        value={option.price_modifier}
                                        onChange={(e) => updateOption(groupIdx, optIdx, 'price_modifier', parseFloat(e.target.value) || 0)}
                                        placeholder="Price (₦)"
                                        className="pl-6 bg-white text-xs font-bold rounded-lg"
                                      />
                                    </div>
                                  </div>

                                  <div className="sm:col-span-4 flex items-center gap-2">
                                    <Input
                                      type="text"
                                      value={option.description || ''}
                                      onChange={(e) => updateOption(groupIdx, optIdx, 'description', e.target.value)}
                                      placeholder="Short description (optional)"
                                      className="bg-white text-xs rounded-lg"
                                    />
                                  </div>

                                  <div className="sm:col-span-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removeOption(groupIdx, optIdx)}
                                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-200/60 text-xs">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={option.has_cuts_selection || false}
                                      onChange={(e) => updateOption(groupIdx, optIdx, 'has_cuts_selection', e.target.checked)}
                                      className="w-4 h-4 accent-[#0A2E1D] rounded cursor-pointer"
                                    />
                                    <span className="font-bold text-gray-700 flex items-center gap-1">
                                      <Fish className="w-3.5 h-3.5 text-emerald-700" /> Has Piece / Cuts Selection
                                    </span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={option.has_counter || false}
                                      onChange={(e) => updateOption(groupIdx, optIdx, 'has_counter', e.target.checked)}
                                      className="w-4 h-4 accent-[#0A2E1D] rounded cursor-pointer"
                                    />
                                    <span className="font-bold text-gray-700">Has Multiplier Counter</span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={option.is_available ?? true}
                                      onChange={(e) => updateOption(groupIdx, optIdx, 'is_available', e.target.checked)}
                                      className="w-4 h-4 accent-[#0A2E1D] rounded cursor-pointer"
                                    />
                                    <span className="font-medium text-gray-600">In Stock</span>
                                  </label>
                                </div>

                                {option.has_counter && (
                                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 space-y-3 mt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-extrabold uppercase text-amber-900 block">
                                          Unit Price per Count (₦)
                                        </label>
                                        <div className="relative">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₦</span>
                                          <Input
                                            type="number"
                                            value={option.unit_price || option.price_modifier || 0}
                                            onChange={(e) => updateOption(groupIdx, optIdx, 'unit_price', parseFloat(e.target.value) || 0)}
                                            placeholder="Unit Price (e.g. 2000)"
                                            className="pl-6 bg-white text-xs font-bold rounded-lg border-amber-300"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] font-extrabold uppercase text-amber-900 block">
                                          Minimum Multiplier Count
                                        </label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={option.min_multiplier_count ?? 1}
                                          onChange={(e) => updateOption(groupIdx, optIdx, 'min_multiplier_count', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                          placeholder="e.g. 10"
                                          className="bg-white text-xs font-bold rounded-lg border-amber-300"
                                        />
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-amber-800 font-medium">
                                      Storefront customers will start ordering from a minimum count of {option.min_multiplier_count ?? 1} unit(s).
                                    </p>
                                  </div>
                                )}

                                {option.has_cuts_selection && (
                                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 space-y-3 mt-2">
                                    
                                    {/* CUSTOM DISPLAY TITLE INPUT */}
                                    <div>
                                      <label className="text-[10px] font-extrabold uppercase text-emerald-900 block mb-1">
                                        Storefront Prompt / Heading Text (Customer UI)
                                      </label>
                                      <Input
                                        type="text"
                                        value={option.cut_selection_title || 'Select Preferred Cut / Parts'}
                                        onChange={(e) => updateOption(groupIdx, optIdx, 'cut_selection_title', e.target.value)}
                                        placeholder="e.g. Select Preferred Fish Cut / Parts"
                                        className="bg-white text-xs font-bold rounded-lg border-emerald-300"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-[10px] font-extrabold uppercase text-emerald-900 block mb-1">
                                          Min Cuts Selection Allowed
                                        </label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={option.min_cuts_selection ?? 1}
                                          onChange={(e) => updateOption(groupIdx, optIdx, 'min_cuts_selection', parseInt(e.target.value, 10) || 0)}
                                          className="bg-white text-xs font-bold rounded-lg"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[10px] font-extrabold uppercase text-emerald-900 block mb-1">
                                          Max Cuts Selection Allowed
                                        </label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={option.max_cuts_selection ?? 1}
                                          onChange={(e) => updateOption(groupIdx, optIdx, 'max_cuts_selection', parseInt(e.target.value, 10) || 1)}
                                          className="bg-white text-xs font-bold rounded-lg"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-extrabold uppercase text-emerald-900 block mb-1">
                                        Allowed Piece/Cut Names (e.g. Head Piece, Middle Cut, Tail Piece)
                                      </label>

                                      <div className="flex flex-wrap gap-1.5 mb-2">
                                        {(option.allowed_cuts || []).map((cut, cutIdx) => (
                                          <span
                                            key={cutIdx}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold"
                                          >
                                            {cut}
                                            <button
                                              type="button"
                                              onClick={() => removeCutFromOption(groupIdx, optIdx, cutIdx)}
                                              className="text-emerald-700 hover:text-red-500"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>

                                      <div className="flex gap-2">
                                        <Input
                                          type="text"
                                          value={newCutInput[`${groupIdx}-${optIdx}`] || ''}
                                          onChange={(e) => setNewCutInput({ ...newCutInput, [`${groupIdx}-${optIdx}`]: e.target.value })}
                                          placeholder="Type cut name & click Add (e.g. Head Piece)"
                                          className="bg-white text-xs rounded-lg flex-1"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              addCutToOption(groupIdx, optIdx)
                                            }
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => addCutToOption(groupIdx, optIdx)}
                                          className="bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-bold"
                                        >
                                          Add Cut
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-6">
                  <h3 className="text-md font-bold text-gray-900">Recipe Specs &amp; Storage Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-700 block">Preparation Time (Minutes)</label>
                      <Input
                        type="number"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        className="rounded-xl border-gray-300 font-bold bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-700 block">Estimated Servings</label>
                      <Input
                        type="number"
                        value={servings}
                        onChange={(e) => setServings(e.target.value)}
                        className="rounded-xl border-gray-300 font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-700 block">Key Ingredients</label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="text"
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          placeholder="e.g. Fresh Catfish, Ehuru, Scent Leaf"
                          className="rounded-xl text-xs bg-white"
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') { 
                              e.preventDefault()
                              addIngredient()
                            } 
                          }}
                        />
                        <Button type="button" onClick={addIngredient} size="sm" className="bg-[#0A2E1D] text-white font-bold">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ingredients.map((ing, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border text-gray-800 rounded-lg text-xs font-medium">
                            {ing}
                            <button type="button" onClick={() => removeIngredient(idx)} className="text-gray-500 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-700 block">Allergens</label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="text"
                          value={newAllergen}
                          onChange={(e) => setNewAllergen(e.target.value)}
                          placeholder="e.g. Fish, Seafood, Soy, Dairy"
                          className="rounded-xl text-xs bg-white"
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') { 
                              e.preventDefault() 
                              addAllergen()
                            } 
                          }}
                        />
                        <Button type="button" onClick={addAllergen} size="sm" className="bg-red-700 text-white font-bold">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {allergens.map((all, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                            {all}
                            <button type="button" onClick={() => removeAllergen(idx)} className="text-red-500 hover:text-red-700">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-700 block">Storage Instructions</label>
                    <Textarea
                      rows={2}
                      value={storageInstructions}
                      onChange={(e) => setStorageInstructions(e.target.value)}
                      placeholder="e.g. Keep refrigerated below 4°C. Best consumed within 24 hours."
                      className="rounded-xl border-gray-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cake_tiers' && isCurrentCategoryCake && (
              <div className="space-y-6">
                <div className="bg-[#EAA823]/10 border border-[#EAA823]/40 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#0A2E1D] font-black text-sm">
                    <Cake className="w-5 h-5 text-[#EAA823]" />
                    <span>Cake Layer Matrix Configuration</span>
                  </div>
                  <p className="text-xs text-gray-700">
                    Define sizes, primary flavors, and tier layer prices (1 Layer, 2 Layers, 3 Layers).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Cake Size *
                    </label>
                    <select
                      value={cakeSize}
                      onChange={(e) => handleSizeChange(e.target.value as any)}
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold"
                    >
                      <option value="6 inches">6 Inches</option>
                      <option value="7 inches">7 Inches</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Primary Flavor *
                    </label>
                    <select
                      value={cakeFlavor}
                      onChange={(e) => setCakeFlavor(e.target.value as any)}
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold"
                    >
                      <option value="Vanilla">Vanilla</option>
                      <option value="Chocolate">Chocolate</option>
                      <option value="Red Velvet">Red Velvet</option>
                      <option value="Multi-Flavor Combo">Multi-Flavor Combo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Layer Tier Pricing ({cakeSize})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {cakeTiers.map((tier, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                          <span>{tier.label || `${tier.layers} Layer`}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            {tier.layers} Layer{tier.layers > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                          <Input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handleTierPriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="pl-7 font-bold text-sm bg-white rounded-lg border-gray-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="allow_inscription"
                    checked={allowInscription}
                    onChange={(e) => setAllowInscription(e.target.checked)}
                    className="w-5 h-5 accent-[#0A2E1D] rounded cursor-pointer"
                  />
                  <label htmlFor="allow_inscription" className="text-sm font-bold text-gray-800 cursor-pointer">
                    Allow Custom Cake Inscription / Message on Board
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="font-bold cursor-pointer bg-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSaveProduct(e)}
                disabled={submitting}
                className="gap-2 bg-[#0A2E1D] text-white hover:bg-[#12422C] font-extrabold px-6 cursor-pointer shadow-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#EAA823]" /> Save Product &amp; Options Live
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* LIST/TABLE PRODUCT LAYOUT WITH FULL COLUMNS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Catalog Items ({products.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0A2E1D]" />
              <p className="text-xs font-bold text-gray-500 mt-2">Loading store catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-3xl">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-[#0A2E1D] font-bold">No products found in database.</p>
              <p className="text-xs text-gray-500 mt-1">Click "Add Meal / Street Food" above to publish your first item.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="hidden lg:grid grid-cols-12 gap-4 p-5 bg-gray-50 border-b border-gray-200 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Starting Price</div>
                <div className="col-span-2">Portion & Cut Customizations</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {products.map((prod) => (
                  <div key={prod.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 p-5 items-center hover:bg-gray-50/50 transition-colors">
                    
                    {/* PRODUCT COLUMN */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden relative">
                        <img src={prod.image_url || '/Recipe2.jpg'} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm text-[#0A2E1D] truncate">{prod.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{prod.description || 'No description provided.'}</p>
                      </div>
                    </div>

                    {/* CATEGORY COLUMN */}
                    <div className="col-span-1 lg:col-span-2 flex flex-col items-start gap-1">
                      <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200">
                        {prod.category}
                      </span>
                      {prod.is_time_bound && (
                        <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> {prod.menu_section}
                        </span>
                      )}
                    </div>

                    {/* STARTING PRICE COLUMN */}
                    <div className="col-span-1 lg:col-span-2">
                      <span className="font-black text-sm text-[#0A2E1D]">₦{prod.price?.toLocaleString()}</span>
                    </div>

                    {/* PORTION & CUT CUSTOMIZATIONS COLUMN */}
                    <div className="col-span-1 lg:col-span-2">
                      {prod.customization_options && prod.customization_options.length > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-md border border-emerald-200">
                          {prod.customization_options.length} Custom Group{prod.customization_options.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">None configured</span>
                      )}
                    </div>

                    {/* STATUS COLUMN */}
                    <div className="col-span-1 lg:col-span-1">
                      {prod.in_stock ? (
                        <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm">
                          In Stock ({prod.stock_quantity})
                        </span>
                      ) : (
                        <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* ACTIONS COLUMN */}
                    <div className="col-span-1 lg:col-span-1 flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleEdit(prod)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs font-bold border-gray-300 text-gray-700 hover:bg-[#0A2E1D] hover:text-white hover:border-[#0A2E1D] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(prod.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}