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
  Users,
  ShieldAlert,
  Loader2,
  Upload,
  Image as ImageIcon
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
}

interface OptionGroup {
  name: string
  is_required: boolean
  type?: 'radio' | 'checkbox'
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
  cake_details?: CakeConfig | null
  customization_options?: OptionGroup[] | null
  ingredients?: string[] | null
  allergens?: string[] | null
  preparation_time_minutes?: number | null
  servings?: number | null
  storage_instructions?: string | null
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
      name: 'Mini Cakeloaf Add-on',
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
  'Catfish Pepper Soup': [
    {
      name: 'Portion Size',
      is_required: true,
      type: 'radio',
      options: [
        { name: 'Full Catfish Bowl (1 Liter)', price_modifier: 16000, is_available: true, description: 'Prepared fresh with aromatic native Ehuru, Uda & Scent leaf herbs' },
        { name: 'Standard Medium Portion', price_modifier: 9000, is_available: true, description: 'Half portion freshly prepared' },
      ]
    }
  ]
}

export default function StoreInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Basic Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'Rice Dishes',
    in_stock: true,
    stock_quantity: '10',
  })
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')

  // Upload & Drag-and-drop state
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Customization & Specs State
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [ingredients, setIngredients] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [prepTime, setPrepTime] = useState<string | number>(20)
  const [servings, setServings] = useState<string | number>(1)
  const [storageInstructions, setStorageInstructions] = useState('')

  // Tag inputs
  const [newIngredient, setNewIngredient] = useState('')
  const [newAllergen, setNewAllergen] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'customization' | 'cake_tiers'>('basic')

  // Cake Customization State
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
      category: isStandardCat ? product.category : '__custom__',
      in_stock: product.in_stock ?? true,
      stock_quantity: (product.stock_quantity || 0).toString(),
    })
    setIsCustomCategory(!isStandardCat)
    setCustomCategoryInput(!isStandardCat ? product.category : '')

    setOptionGroups(Array.isArray(product.customization_options) ? product.customization_options : [])
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

  const handleSizeChange = (newSize: '6 inches' | '7 inches') => {
    setCakeSize(newSize)
    if (newSize === '6 inches') {
      setCakeTiers(DEFAULT_6INCH_TIERS)
      if (!formData.price || formData.price === '26000') setFormData(prev => ({ ...prev, price: '20000' }))
    } else {
      setCakeTiers(DEFAULT_7INCH_TIERS)
      if (!formData.price || formData.price === '20000') setFormData(prev => ({ ...prev, price: '26000' }))
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

  // Upload handling with Drag & Drop
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
        // Fallback to local base64 preview if bucket upload throws restriction
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  // Preset Applier
  const applyPreset = (presetKey: string) => {
    const preset = WAITLIST_PRESETS[presetKey]
    if (preset) {
      setOptionGroups(JSON.parse(JSON.stringify(preset)))
    }
  }

  // Option Groups helper methods
  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, { name: '', is_required: true, type: 'radio', options: [] }])
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
    updated[groupIndex].options.push({ name: '', price_modifier: 0, is_available: true, description: '' })
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

  // Master Save Handler
  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
        customization_options: optionGroups,
        ingredients: ingredients,
        allergens: allergens,
        preparation_time_minutes: parseInt(String(prepTime), 10) || 20,
        servings: parseInt(String(servings), 10) || 1,
        storage_instructions: storageInstructions,
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
        alert('Product, customizations, and culinary details updated successfully!')
      } else {
        const { data: newProd, error } = await supabase
          .from('store_products')
          .insert([payload])
          .select()
          .single()

        if (error) throw error
        setEditingId(newProd.id)
        alert('New product and all interactive options published live to storefront!')
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
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="bg-[#0A2E1D] text-white p-6 border-b border-[#12422C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Package className="w-7 h-7 text-[#EAA823]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold">Store Inventory &amp; Customization Admin</h1>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm mt-1">
              Configure food products, waitlist-style option groups (Shawarma sizes, Noodles with turkey counters, Parfaits), cake matrices, and ingredients.
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="secondary" className="gap-2 bg-[#12422C] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] border border-[#EAA823]/30 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                resetForm()
                setFormData(prev => ({ ...prev, category: 'Cakes', price: '20000', name: '6" Classic Vanilla Cake' }))
                setShowForm(true)
              }}
              className="gap-2 bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold cursor-pointer shadow-md"
            >
              <Cake className="w-4 h-4" />
              Add Cake Product
            </Button>

            <Button
              onClick={() => {
                resetForm()
                setFormData(prev => ({ ...prev, category: 'Rice Dishes', price: '3000', name: 'Smokey Jollof Rice' }))
                setShowForm(true)
              }}
              variant="outline"
              className="gap-2 font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Meal / Street Food
            </Button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/" target="_blank" className="text-[#0A2E1D] hover:underline flex items-center gap-1">
              Storefront Preview <Eye className="w-3.5 h-3.5 text-[#EAA823]" />
            </Link>
            <Link href="/cakes" target="_blank" className="text-[#0A2E1D] hover:underline flex items-center gap-1">
              Cakes Preview <Sparkles className="w-3.5 h-3.5 text-[#EAA823]" />
            </Link>
          </div>
        </div>

        {/* Product / Customization Form Drawer */}
        {showForm && (
          <div className="bg-card border border-border rounded-3xl p-6 mb-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure basic info, interactive waitlist choices, ingredients, and pricing.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-border overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'basic'
                    ? 'border-[#0A2E1D] text-[#0A2E1D]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings2 className="w-4 h-4 text-emerald-700" />
                2. Custom Options ({optionGroups.length}) &amp; Specs
              </button>

              {isCurrentCategoryCake && (
                <button
                  type="button"
                  onClick={() => setActiveTab('cake_tiers')}
                  className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'cake_tiers'
                      ? 'border-[#EAA823] text-[#0A2E1D] bg-[#EAA823]/10 rounded-t-xl'
                      : 'border-transparent text-[#0A2E1D] hover:text-[#EAA823]'
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#EAA823]" />
                  3. Cake Layer Pricing Matrix
                </button>
              )}
            </div>

            {/* TAB 1: Basic Info & Category */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Product Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Jumbo Shawarma, Smokey Jollof Rice, Classic Parfait, Red Velvet Cake"
                      className="rounded-xl border-gray-300 font-bold"
                    />
                  </div>

                  {/* Base Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Base Price (₦ Naira) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                      <Input
                        type="number"
                        required
                        step="any"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="3000"
                        className="pl-8 rounded-xl border-gray-300 font-black text-base text-[#0A2E1D]"
                      />
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                        Store Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(!isCustomCategory)
                          if (!isCustomCategory) setCustomCategoryInput('')
                        }}
                        className="text-[11px] text-[#0A2E1D] font-bold underline cursor-pointer"
                      >
                        {isCustomCategory ? 'Select from list' : '+ Add custom category'}
                      </button>
                    </div>

                    {!isCustomCategory ? (
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true)
                          } else {
                            setFormData({ ...formData, category: e.target.value })
                          }
                        }}
                        className="w-full bg-white border border-gray-300 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0A2E1D] text-[#0A2E1D]"
                      >
                        {STORE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__custom__">+ Enter Custom Category...</option>
                      </select>
                    ) : (
                      <Input
                        type="text"
                        placeholder="Type custom category name..."
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        className="rounded-xl border-gray-300 font-semibold"
                      />
                    )}
                  </div>

                  {/* Stock Quantity */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Stock Units Available
                    </label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="10"
                      className="rounded-xl border-gray-300 font-bold"
                    />
                  </div>

                  {/* Image Upload Area with Drag & Drop */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Product Picture (Upload, Drag or Enter Path)
                    </label>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
                        isDragging
                          ? 'border-[#EAA823] bg-amber-50/50'
                          : 'border-gray-300 bg-[#FDFBF7] hover:border-[#0A2E1D]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0])
                          }
                        }}
                      />

                      {formData.image_url ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white flex-shrink-0">
                              <img
                                src={formData.image_url}
                                alt="Product Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-left space-y-1">
                              <span className="text-xs font-bold text-[#0A2E1D] block">Image Attached</span>
                              <span className="text-[11px] text-gray-500 line-clamp-1 max-w-sm font-mono">
                                {formData.image_url}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingImage}
                              onClick={() => fileInputRef.current?.click()}
                              className="rounded-xl text-xs font-bold border-gray-300"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1 text-[#EAA823]" />
                              Replace Picture
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, image_url: '' })}
                              className="text-red-500 hover:bg-red-50 rounded-xl p-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer space-y-2 flex flex-col items-center justify-center py-2"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-[#EAA823] flex items-center justify-center shadow-xs">
                            {uploadingImage ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <Upload className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#0A2E1D] block">
                              Click to choose image or drag picture here
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Supports JPG, PNG, WEBP (Max 5MB)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual Image Path Input */}
                    <div className="pt-1">
                      <Input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Or enter image URL/path (e.g. /shawarma.jpeg, /jollof.jpeg, /parfait.jpeg)"
                        className="rounded-xl border-gray-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Short Storefront Description
                    </label>
                    <Textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief summary displayed on food cards..."
                      className="rounded-xl border-gray-300 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Stock Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-2xl border border-gray-200">
                  <div>
                    <span className="text-sm font-bold text-[#0A2E1D] block">In Stock &amp; Visible to Customers</span>
                    <span className="text-xs text-gray-500">Uncheck to mark this product as sold out.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                    className="w-5 h-5 accent-[#0A2E1D] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Custom Options, Ingredients, Allergens (Harmonized Color Theme) */}
            {activeTab === 'customization' && (
              <div className="space-y-6 bg-[#FDFBF7] text-[#0A2E1D] p-5 sm:p-7 rounded-3xl border border-gray-200 shadow-sm">
                
                {/* 1-Click Presets */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2.5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A2E1D] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#EAA823]" />
                    1-Click Waitlist Presets (Click to Auto-Fill Options):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(WAITLIST_PRESETS).map((presetKey) => (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => applyPreset(presetKey)}
                        className="text-xs bg-[#FDFBF7] border border-gray-200 hover:border-[#0A2E1D] hover:text-[#0A2E1D] px-3 py-1.5 rounded-xl text-gray-700 transition font-medium cursor-pointer shadow-xs"
                      >
                        + {presetKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option Groups Header */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-[#0A2E1D] uppercase tracking-wider">
                    Interactive Option Groups ({optionGroups.length})
                  </span>
                  <Button
                    type="button"
                    onClick={addOptionGroup}
                    className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-extrabold text-xs rounded-xl gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option Group
                  </Button>
                </div>

                {optionGroups.length === 0 ? (
                  <div className="text-center py-8 bg-white border border-dashed border-gray-300 rounded-2xl space-y-2">
                    <p className="text-sm font-semibold text-gray-700">No option groups added yet.</p>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Click a 1-click preset above (e.g. Shawarma sizes, Noodles with turkey counters, Rice styles, Parfait tiers) or tap &quot;Add Option Group&quot; to configure custom options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {optionGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                            <Input
                              placeholder="Group Name (e.g., Shawarma Size, Protein Choice, Rice Style)"
                              value={group.name}
                              onChange={(e) => updateOptionGroup(groupIndex, 'name', e.target.value)}
                              className="bg-[#FDFBF7] border-gray-300 text-[#0A2E1D] font-bold text-xs sm:text-sm rounded-xl"
                            />

                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={group.is_required}
                                  onChange={(e) => updateOptionGroup(groupIndex, 'is_required', e.target.checked)}
                                  className="w-4 h-4 rounded text-[#0A2E1D] focus:ring-[#0A2E1D]"
                                />
                                Required
                              </label>

                              <select
                                value={group.type || 'radio'}
                                onChange={(e) => updateOptionGroup(groupIndex, 'type', e.target.value)}
                                className="bg-[#FDFBF7] border border-gray-300 text-[#0A2E1D] text-xs p-2 rounded-xl outline-none font-medium"
                              >
                                <option value="radio">Single Choice (Radio)</option>
                                <option value="checkbox">Multi-Choice (Checkbox)</option>
                              </select>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOptionGroup(groupIndex)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-xl self-end sm:self-auto cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Options List */}
                        <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-[#0A2E1D]/20">
                          {group.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="bg-[#FDFBF7] p-3 rounded-xl border border-gray-200 space-y-2">
                              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                                <Input
                                  placeholder="Option title (e.g., Medium size, Full Turkey, Jollof)"
                                  value={option.name}
                                  onChange={(e) => updateOption(groupIndex, optionIndex, 'name', e.target.value)}
                                  className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl flex-1 min-w-[140px]"
                                />

                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-[#0A2E1D] font-mono font-bold">₦</span>
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="Price"
                                    value={option.price_modifier}
                                    onChange={(e) => updateOption(groupIndex, optionIndex, 'price_modifier', parseFloat(e.target.value) || 0)}
                                    className="w-28 bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl font-bold"
                                  />
                                </div>

                                <label className="flex items-center gap-1 text-[11px] text-gray-700 whitespace-nowrap cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={option.is_available}
                                    onChange={(e) => updateOption(groupIndex, optionIndex, 'is_available', e.target.checked)}
                                    className="w-3.5 h-3.5 rounded text-[#0A2E1D]"
                                  />
                                  Available
                                </label>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(groupIndex, optionIndex)}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center pt-1">
                                <Input
                                  placeholder="Subtitle (e.g. 'Classic single roll', 'Wok-tossed with sweet corn')"
                                  value={option.description || ''}
                                  onChange={(e) => updateOption(groupIndex, optionIndex, 'description', e.target.value)}
                                  className="bg-white border-gray-300 text-gray-600 text-[11px] rounded-lg flex-1"
                                />

                                <label className="flex items-center gap-1.5 text-[10px] text-[#0A2E1D] font-semibold whitespace-nowrap cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!option.has_counter}
                                    onChange={(e) => updateOption(groupIndex, optionIndex, 'has_counter', e.target.checked)}
                                    className="w-3.5 h-3.5 rounded text-[#0A2E1D]"
                                  />
                                  Has Multiplier Counter (e.g. ₦2,000/cube)
                                </label>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(groupIndex)}
                            className="w-full mt-2 border-dashed border-gray-300 text-gray-700 hover:text-[#0A2E1D] hover:border-[#0A2E1D] text-xs font-semibold rounded-xl cursor-pointer bg-white"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Choice to &quot;{group.name || 'Group'}&quot;
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Culinary Specs, Prep Time, Servings */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <span className="text-xs font-bold text-[#0A2E1D] uppercase tracking-wider block">
                    Culinary Specs &amp; Health Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#EAA823]" />
                        Prep Time (minutes)
                      </label>
                      <Input
                        type="number"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        placeholder="20"
                        className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#EAA823]" />
                        Servings Count
                      </label>
                      <Input
                        type="number"
                        value={servings}
                        onChange={(e) => setServings(e.target.value)}
                        placeholder="1"
                        className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      Storage Instructions
                    </label>
                    <Input
                      value={storageInstructions}
                      onChange={(e) => setStorageInstructions(e.target.value)}
                      placeholder="e.g. Best consumed warm or refrigerated at 4°C within 48 hours."
                      className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl"
                    />
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Fresh Ingredients
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        placeholder="e.g. Long-grain Rice, Plum Tomatoes, Scent Leaf, Greek Yogurt"
                        className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addIngredient()
                          }
                        }}
                      />
                      <Button type="button" onClick={addIngredient} className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold text-xs rounded-xl cursor-pointer">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {ingredients.map((item, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-800 shadow-xs">
                          <span>{item}</span>
                          <button type="button" onClick={() => removeIngredient(index)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <label className="block text-xs font-bold text-red-600 uppercase flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Allergens Notice
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newAllergen}
                        onChange={(e) => setNewAllergen(e.target.value)}
                        placeholder="e.g. Dairy, Cashews, Peanuts, Gluten"
                        className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addAllergen()
                          }
                        }}
                      />
                      <Button type="button" onClick={addAllergen} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {allergens.map((item, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs text-red-700 shadow-xs">
                          <span>{item}</span>
                          <button type="button" onClick={() => removeAllergen(index)} className="text-red-400 hover:text-red-600 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: Cake Tiers & Flavors Matrix */}
            {activeTab === 'cake_tiers' && isCurrentCategoryCake && (
              <div className="space-y-6 bg-[#FDFBF7] p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#0A2E1D]">Cake Customization Matrix</h3>
                    <p className="text-xs text-gray-500">Configure default diameter size, flavor, and layer pricing presets.</p>
                  </div>
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced with Live Storefront
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Size Preset */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-600">Default Cake Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['6 inches', '7 inches'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSizeChange(s)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            cakeSize === s
                              ? 'bg-[#0A2E1D] text-[#EAA823] border-[#0A2E1D] shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {s} Round
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Flavor */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-600">Default Flavor Profile</label>
                    <select
                      value={cakeFlavor}
                      onChange={(e) => setCakeFlavor(e.target.value as any)}
                      className="w-full bg-white border border-gray-200 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:border-[#0A2E1D]"
                    >
                      <option value="Vanilla">Vanilla Sponge</option>
                      <option value="Chocolate">Rich Cocoa Chocolate Fudge</option>
                      <option value="Red Velvet">Signature Crimson Red Velvet</option>
                      <option value="Multi-Flavor Combo">Multi-Flavor Mix Combo</option>
                    </select>
                  </div>
                </div>

                {/* Tier Pricing Configuration */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <label className="text-xs font-bold uppercase text-gray-600 block">Layer Pricing Presets (₦ Naira)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {cakeTiers.map((tier, idx) => (
                      <div key={tier.layers} className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#0A2E1D]">{tier.layers} Layer{tier.layers > 1 ? 's' : ''}</span>
                          <span className="text-[10px] text-gray-400">Tier #{idx + 1}</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                          <Input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handleTierPriceChange(idx, Number(e.target.value))}
                            className="pl-7 font-bold text-sm text-[#0A2E1D]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Inscription Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div>
                    <span className="text-sm font-bold text-[#0A2E1D] block">Allow Custom Inscription / Message</span>
                    <span className="text-xs text-gray-500">Permits customers to input personalized lettering at checkout</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowInscription}
                    onChange={(e) => setAllowInscription(e.target.checked)}
                    className="w-5 h-5 accent-[#0A2E1D] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Sticky Save Action Bar */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                All basic info, option groups, and culinary specs will be saved together.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="rounded-xl font-bold px-6"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveProduct}
                  disabled={submitting}
                  className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black px-8 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Catalog Item...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingId ? 'Save & Update All Details' : 'Publish Product to Live Store'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        )}

        {/* Products Catalog Table */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#0A2E1D] border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-sm">Fetching catalog from database...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
            <p className="mb-4 text-gray-500 font-medium">No products registered in store inventory yet.</p>
            <Button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="gap-2 bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-border rounded-3xl shadow-sm">
            <table className="w-full">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Product</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Category</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Base Price</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Interactive Customizations</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Status</th>
                  <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const isCake = product.category?.toLowerCase() === 'cakes' || product.name.toLowerCase().includes('cake')
                  const hasCustomOptions = Array.isArray(product.customization_options) && product.customization_options.length > 0

                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-xs" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                              FOOD
                            </div>
                          )}
                          <div>
                            <span className="text-foreground font-bold text-sm block">{product.name}</span>
                            {product.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{product.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          isCake ? 'bg-[#0A2E1D] text-[#EAA823]' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isCake ? <Cake className="w-3 h-3" /> : <Utensils className="w-3 h-3 text-[#0A2E1D]" />}
                          {product.category || 'Meals'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-foreground font-black text-sm">
                        ₦{Number(product.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        {isCake ? (
                          <div className="text-xs space-y-0.5">
                            <span className="font-bold text-[#0A2E1D] block">1, 2 &amp; 3 Tier Layer Matrix</span>
                            <span className="text-[11px] text-gray-500">Vanilla, Chocolate, Red Velvet</span>
                          </div>
                        ) : hasCustomOptions ? (
                          <div className="text-xs space-y-0.5">
                            <span className="font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {product.customization_options!.length} Option Group{product.customization_options!.length > 1 ? 's' : ''} Configured
                            </span>
                            <span className="text-[10px] text-gray-500 truncate block max-w-xs">
                              {product.customization_options!.map(g => g.name).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Standard Meal (No Add-ons)</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="text-[#0A2E1D] hover:bg-[#0A2E1D]/10 rounded-lg cursor-pointer"
                            title="Edit Product & Customizations"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}