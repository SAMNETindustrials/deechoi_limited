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
  Cake,
  Layers,
  Sparkles,
  Save,
  Utensils,
  Eye,
  CheckCircle2,
  Settings2,
  Clock,
  Users,
  ShieldAlert,
  Loader2,
  Upload,
  Fish,
  Tag
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
  min_quantity?: number
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
        {
          name: 'Medium size',
          price_modifier: 5000,
          is_available: true,
          description: 'Classic single sausage roll'
        },
        {
          name: 'Jumbo size',
          price_modifier: 12000,
          is_available: true,
          description: 'Double sausage + extra meat'
        },
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
          allowed_cuts: ['Turkey Wing', 'Turkey Lap / Drumstick', 'Turkey Breast'],
          min_cuts_selection: 1,
          max_cuts_selection: 1
        },
        {
          name: 'Turkey Cubes',
          price_modifier: 2000,
          is_available: true,
          description: 'Tender diced turkey chunks',
          has_counter: true,
          unit_price: 2000,
          min_quantity: 1
        },
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
  ],

  'Rice Preparations (Jollof & Fried)': [
    {
      name: 'Rice Preparation Style',
      is_required: true,
      type: 'radio',
      price_mode: 'standalone',
      options: [
        {
          name: 'Smokey Jollof Rice',
          price_modifier: 3000,
          is_available: true,
          description: 'Authentic firewood-style reduction'
        },
        {
          name: 'Signature Fried Rice',
          price_modifier: 3000,
          is_available: true,
          description: 'Wok-tossed sweet corn & garden veggies'
        },
        {
          name: 'Mixed Fried & Jollof Rice',
          price_modifier: 3500,
          is_available: true,
          description: 'Split combo platter'
        },
      ],
    },
    {
      name: 'Protein Add-on',
      is_required: false,
      type: 'radio',
      price_mode: 'addon',
      options: [
        {
          name: 'Fried Chicken Cut',
          price_modifier: 2000,
          is_available: true,
          has_cuts_selection: true,
          allowed_cuts: ['Chicken Lap / Drumstick', 'Chicken Breast', 'Chicken Wings'],
          min_cuts_selection: 1,
          max_cuts_selection: 1
        },
        {
          name: 'Grilled Fish Cut',
          price_modifier: 2500,
          is_available: true,
          has_cuts_selection: true,
          allowed_cuts: ['Fish Head', 'Middle Cut', 'Fish Tail'],
          min_cuts_selection: 1,
          max_cuts_selection: 1
        },
        { name: 'Full Turkey Cut', price_modifier: 6000, is_available: true },
        { name: 'Assorted Meat', price_modifier: 1500, is_available: true },
      ],
    },
    {
      name: 'Side Dishes',
      is_required: false,
      type: 'checkbox',
      price_mode: 'addon',
      options: [
        { name: 'Fried Plantain (Dodo)', price_modifier: 800, is_available: true },
        { name: 'Coleslaw Salad', price_modifier: 700, is_available: true },
        { name: 'Moi-Moi', price_modifier: 1000, is_available: true },
      ]
    }
  ],

  'Parfait & Cakeloaves': [
    {
      name: 'Parfait Size & Variation',
      is_required: true,
      type: 'radio',
      price_mode: 'standalone',
      options: [
        {
          name: 'Classic Parfait (350ml)',
          price_modifier: 5500,
          is_available: true,
          description: 'Yogurt, apples, grapes, granola, coconut flakes & cashew'
        },
        {
          name: 'Classic Parfait (1 Liter)',
          price_modifier: 13000,
          is_available: true,
          description: '1L Family Tub with full fruit & nut layers'
        },
        {
          name: 'Tropical Parfait (350ml)',
          price_modifier: 6500,
          is_available: true,
          description: 'Greek yogurt, apple/grape slices, roasted coconut, cashew & almonds'
        },
        {
          name: 'Tropical Parfait (1 Liter)',
          price_modifier: 14000,
          is_available: true,
          description: '1L Tropical Greek Yogurt Tub'
        },
        {
          name: 'Nutty Essence (350ml)',
          price_modifier: 6500,
          is_available: true,
          description: 'Granola, coconut flakes, cashews & almonds with minimal fruit'
        },
        {
          name: 'Cake Parfait (350ml)',
          price_modifier: 6000,
          is_available: true,
          description: 'Vanilla, chocolate & red velvet sponge layers with caramel'
        },
        {
          name: 'Cake Parfait (1 Liter)',
          price_modifier: 14000,
          is_available: true,
          description: '1L High-Profile Cake Parfait Bowl'
        },
      ],
    },
    {
      name: 'Mini Cakeloaf Add-on',
      is_required: false,
      type: 'checkbox',
      price_mode: 'addon',
      options: [
        { name: 'Chocolate Cakeloaf', price_modifier: 4000, is_available: true },
        { name: 'Vanilla Cakeloaf', price_modifier: 4300, is_available: true },
        { name: 'Red Velvet Cakeloaf', price_modifier: 4500, is_available: true },
        { name: '2 Mixed Flavours Cakeloaf', price_modifier: 4600, is_available: true },
      ]
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
  const [cakeFlavor, setCakeFlavor] = useState<
    'Vanilla' | 'Chocolate' | 'Red Velvet' | 'Multi-Flavor Combo'
  >('Vanilla')
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
    setNewCutInput({})
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
      min_order_quantity: (product.min_order_quantity || 1).toString(),
    })

    setIsCustomCategory(!isStandardCat)
    setCustomCategoryInput(!isStandardCat ? product.category : '')

    const normalizedGroups = (
      Array.isArray(product.customization_options)
        ? product.customization_options
        : []
    ).map(group => ({
      ...group,
      price_mode:
        group.price_mode ||
        (group.type === 'checkbox' ? 'addon' : 'standalone'),

      options: (group.options || []).map(option => ({
        ...option,

        // Multiplier Counter defaults to minimum quantity 1
        // when the option already has a counter enabled.
        has_counter: !!option.has_counter,
        min_quantity: option.has_counter
          ? Math.max(1, Number(option.min_quantity) || 1)
          : option.min_quantity,

        unit_price: option.has_counter
          ? Number(option.unit_price ?? option.price_modifier ?? 0)
          : option.unit_price,

        allowed_cuts:
          option.allowed_cuts ||
          (option.has_cuts_selection ? DEFAULT_FISH_CUTS : []),

        min_cuts_selection:
          option.min_cuts_selection ??
          (option.has_cuts_selection ? 1 : 0),

        max_cuts_selection:
          option.max_cuts_selection || 1,
      }))
    }))

    setOptionGroups(normalizedGroups)

    setIngredients(
      Array.isArray(product.ingredients)
        ? product.ingredients
        : []
    )

    setAllergens(
      Array.isArray(product.allergens)
        ? product.allergens
        : []
    )

    setPrepTime(product.preparation_time_minutes || 20)
    setServings(product.servings || 1)
    setStorageInstructions(product.storage_instructions || '')

    setEditingId(product.id)

    const isCake =
      product.category?.toLowerCase() === 'cakes' ||
      product.name.toLowerCase().includes('cake')

    if (isCake || product.cake_details) {
      const isSeven =
        product.name.includes('7') ||
        (product.description && product.description.includes('7'))

      const details = product.cake_details || {
        size: isSeven ? '7 inches' : '6 inches',
        primaryFlavor: product.name.includes('Chocolate')
          ? 'Chocolate'
          : product.name.includes('Red Velvet')
            ? 'Red Velvet'
            : 'Vanilla',
        tiers: isSeven
          ? DEFAULT_7INCH_TIERS
          : DEFAULT_6INCH_TIERS,
        allowCustomInscription: true,
      }

      setCakeSize(details.size)
      setCakeFlavor(details.primaryFlavor as any)
      setCakeTiers(
        details.tiers ||
        (details.size === '7 inches'
          ? DEFAULT_7INCH_TIERS
          : DEFAULT_6INCH_TIERS)
      )
      setAllowInscription(
        details.allowCustomInscription ?? true
      )
    }

    setShowForm(true)
  }

  const handleSizeChange = (
    newSize: '6 inches' | '7 inches'
  ) => {
    setCakeSize(newSize)

    if (newSize === '6 inches') {
      setCakeTiers(DEFAULT_6INCH_TIERS)

      if (
        !formData.price ||
        formData.price === '26000'
      ) {
        setFormData(prev => ({
          ...prev,
          price: '20000'
        }))
      }
    } else {
      setCakeTiers(DEFAULT_7INCH_TIERS)

      if (
        !formData.price ||
        formData.price === '20000'
      ) {
        setFormData(prev => ({
          ...prev,
          price: '26000'
        }))
      }
    }
  }

  const handleTierPriceChange = (
    index: number,
    newPrice: number
  ) => {
    const updated = [...cakeTiers]
    updated[index].price = newPrice

    setCakeTiers(updated)

    if (index === 0) {
      setFormData(prev => ({
        ...prev,
        price: newPrice.toString()
      }))
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(
        'Please upload a valid image file (PNG, JPG, JPEG, WEBP).'
      )
      return
    }

    setUploadingImage(true)

    try {
      const fileExt =
        file.name.split('.').pop() || 'png'

      const fileName =
        `product-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}.${fileExt}`

      const { data, error } =
        await supabase.storage
          .from('store-products')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

      if (error) {
        const reader = new FileReader()

        reader.onload = e => {
          setFormData(prev => ({
            ...prev,
            image_url: e.target?.result as string
          }))
        }

        reader.readAsDataURL(file)
      } else {
        const { data: publicUrlData } =
          supabase.storage
            .from('store-products')
            .getPublicUrl(data.path)

        setFormData(prev => ({
          ...prev,
          image_url:
            publicUrlData?.publicUrl ||
            data.path
        }))
      }
    } catch (err: any) {
      console.warn(
        'Image storage warning:',
        err
      )

      const reader = new FileReader()

      reader.onload = e => {
        setFormData(prev => ({
          ...prev,
          image_url: e.target?.result as string
        }))
      }

      reader.readAsDataURL(file)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault()
    setIsDragging(false)

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0]
    ) {
      handleFileUpload(
        e.dataTransfer.files[0]
      )
    }
  }

  const applyPreset = (
    presetKey: string
  ) => {
    const preset =
      WAITLIST_PRESETS[presetKey]

    if (preset) {
      const clonedPreset =
        JSON.parse(
          JSON.stringify(preset)
        )

      const normalizedPreset =
        clonedPreset.map(
          (group: OptionGroup) => ({
            ...group,
            options: group.options.map(
              (option: Option) => ({
                ...option,

                has_counter:
                  !!option.has_counter,

                min_quantity:
                  option.has_counter
                    ? Math.max(
                        1,
                        Number(
                          option.min_quantity
                        ) || 1
                      )
                    : option.min_quantity,

                unit_price:
                  option.has_counter
                    ? Number(
                        option.unit_price ??
                        option.price_modifier ??
                        0
                      )
                    : option.unit_price,
              })
            )
          })
        )

      setOptionGroups(normalizedPreset)
    }
  }

  const addOptionGroup = () => {
    setOptionGroups([
      ...optionGroups,
      {
        name: '',
        is_required: true,
        type: 'radio',
        price_mode: 'standalone',
        options: []
      }
    ])
  }

  const removeOptionGroup = (
    index: number
  ) => {
    setOptionGroups(
      optionGroups.filter(
        (_, i) => i !== index
      )
    )
  }

  const updateOptionGroup = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...optionGroups]

    updated[index] = {
      ...updated[index],
      [field]: value
    }

    setOptionGroups(updated)
  }

  const addOption = (
    groupIndex: number
  ) => {
    const updated = [...optionGroups]

    updated[groupIndex].options.push({
      name: '',
      price_modifier: 0,
      is_available: true,
      description: '',
      has_counter: false,
      unit_price: 0,
      min_quantity: 1,
      has_cuts_selection: false,
      allowed_cuts: [],
      min_cuts_selection: 1,
      max_cuts_selection: 1
    })

    setOptionGroups(updated)
  }

  const removeOption = (
    groupIndex: number,
    optionIndex: number
  ) => {
    const updated = [...optionGroups]

    updated[groupIndex].options.splice(
      optionIndex,
      1
    )

    setOptionGroups(updated)
  }

  const updateOption = (
    groupIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...optionGroups]

    const currentOption =
      updated[groupIndex].options[
        optionIndex
      ]

    updated[groupIndex].options[
      optionIndex
    ] = {
      ...currentOption,
      [field]: value
    }

    setOptionGroups(updated)
  }

  const toggleMultiplierCounter = (
    groupIndex: number,
    optionIndex: number,
    enabled: boolean
  ) => {
    const updated = [...optionGroups]

    const option =
      updated[groupIndex].options[
        optionIndex
      ]

    updated[groupIndex].options[
      optionIndex
    ] = {
      ...option,

      has_counter: enabled,

      // When enabled, the admin must have
      // a minimum quantity value.
      min_quantity: enabled
        ? Math.max(
            1,
            Number(option.min_quantity) || 1
          )
        : option.min_quantity,

      // Multiplier price is based on the
      // option's unit price.
      unit_price: enabled
        ? Number(
            option.unit_price ??
            option.price_modifier ??
            0
          )
        : option.unit_price
    }

    setOptionGroups(updated)
  }

  const updateMinimumMultiplierQuantity = (
    groupIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const parsed =
      parseInt(value, 10)

    const minimumQuantity =
      Number.isFinite(parsed) &&
      parsed > 0
        ? parsed
        : 1

    updateOption(
      groupIndex,
      optionIndex,
      'min_quantity',
      minimumQuantity
    )
  }

  const addCutToOption = (
    groupIndex: number,
    optionIndex: number
  ) => {
    const key =
      `${groupIndex}-${optionIndex}`

    const cutName =
      (
        newCutInput[key] || ''
      ).trim()

    if (!cutName) return

    const updated =
      [...optionGroups]

    const currentCuts =
      updated[groupIndex]
        .options[optionIndex]
        .allowed_cuts || []

    if (!currentCuts.includes(cutName)) {
      updated[groupIndex].options[
        optionIndex
      ].allowed_cuts = [
        ...currentCuts,
        cutName
      ]

      setOptionGroups(updated)
    }

    setNewCutInput({
      ...newCutInput,
      [key]: ''
    })
  }

  const removeCutFromOption = (
    groupIndex: number,
    optionIndex: number,
    cutIndex: number
  ) => {
    const updated =
      [...optionGroups]

    const currentCuts =
      updated[groupIndex]
        .options[optionIndex]
        .allowed_cuts || []

    updated[groupIndex].options[
      optionIndex
    ].allowed_cuts =
      currentCuts.filter(
        (_, idx) =>
          idx !== cutIndex
      )

    setOptionGroups(updated)
  }

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([
        ...ingredients,
        newIngredient.trim()
      ])

      setNewIngredient('')
    }
  }

  const removeIngredient = (
    idx: number
  ) => {
    setIngredients(
      ingredients.filter(
        (_, i) => i !== idx
      )
    )
  }

  const addAllergen = () => {
    if (newAllergen.trim()) {
      setAllergens([
        ...allergens,
        newAllergen.trim()
      ])

      setNewAllergen('')
    }
  }

  const removeAllergen = (
    idx: number
  ) => {
    setAllergens(
      allergens.filter(
        (_, i) => i !== idx
      )
    )
  }

  const handleSaveProduct = async (
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault()

    if (
      !formData.name.trim() ||
      !formData.price
    ) {
      alert(
        'Please fill in product name and base price.'
      )
      return
    }

    try {
      setSubmitting(true)

      const finalCategory =
        isCustomCategory
          ? customCategoryInput.trim() ||
            'Meals'
          : formData.category

      const isCake =
        finalCategory.toLowerCase() ===
          'cakes' ||
        formData.name
          .toLowerCase()
          .includes('cake')

      /*
       * Normalize multiplier options before saving.
       *
       * Any option with has_counter enabled
       * MUST have a minimum quantity of at least 1.
       */
      const sanitizedOptionGroups =
        optionGroups.map(group => ({
          ...group,

          options:
            group.options.map(
              option => {
                const hasCounter =
                  !!option.has_counter

                if (hasCounter) {
                  const minimumQuantity =
                    Math.max(
                      1,
                      Number(
                        option.min_quantity
                      ) || 1
                    )

                  const unitPrice =
                    Number(
                      option.unit_price ??
                      option.price_modifier ??
                      0
                    )

                  return {
                    ...option,
                    has_counter: true,
                    min_quantity:
                      minimumQuantity,
                    unit_price:
                      unitPrice
                  }
                }

                return {
                  ...option,
                  has_counter: false
                }
              }
            )
        }))

      const payload: any = {
        name:
          formData.name.trim(),

        description:
          formData.description || '',

        price:
          parseFloat(formData.price) || 0,

        image_url:
          formData.image_url ||
          (isCake
            ? '/cakes.jpg'
            : '/Recipe2.jpg'),

        category:
          finalCategory,

        in_stock:
          formData.in_stock ?? true,

        stock_quantity:
          parseInt(
            formData.stock_quantity,
            10
          ) || 0,

        min_order_quantity:
          parseInt(
            formData.min_order_quantity,
            10
          ) || 1,

        customization_options:
          sanitizedOptionGroups,

        ingredients:
          ingredients,

        allergens:
          allergens,

        preparation_time_minutes:
          parseInt(
            String(prepTime),
            10
          ) || 20,

        servings:
          parseInt(
            String(servings),
            10
          ) || 1,

        storage_instructions:
          storageInstructions,

        updated_at:
          new Date().toISOString()
      }

      if (isCake) {
        payload.cake_details = {
          size: cakeSize,
          primaryFlavor:
            cakeFlavor,
          tiers: cakeTiers,
          allowCustomInscription:
            allowInscription
        }
      }

      if (editingId) {
        const { error } =
          await supabase
            .from(
              'store_products'
            )
            .update(payload)
            .eq(
              'id',
              editingId
            )

        if (error) throw error

        alert(
          'Product, portion prices, multiplier quantities, and cut limits saved successfully!'
        )
      } else {
        const {
          data: newProd,
          error
        } = await supabase
          .from(
            'store_products'
          )
          .insert([payload])
          .select()
          .single()

        if (error) throw error

        setEditingId(
          newProd.id
        )

        alert(
          'New product, custom portion prices, multiplier quantities, and cut limits published live to storefront!'
        )
      }

      fetchProducts()
    } catch (error: any) {
      console.error(
        'Error saving product:',
        error
      )

      alert(
        error.message ||
        'Failed to save product.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (
    productId: string
  ) => {
    if (
      !confirm(
        'Are you sure you want to delete this product? This will remove it from the customer storefront.'
      )
    ) {
      return
    }

    try {
      const { error } =
        await supabase
          .from(
            'store_products'
          )
          .delete()
          .eq(
            'id',
            productId
          )

      if (error) throw error

      alert(
        'Product deleted successfully.'
      )

      fetchProducts()
    } catch (error) {
      console.error(
        'Delete error:',
        error
      )

      alert(
        'Failed to delete product.'
      )
    }
  }

  const isCurrentCategoryCake =
    formData.category?.toLowerCase() ===
      'cakes' ||
    (isCustomCategory &&
      customCategoryInput
        .toLowerCase()
        .includes('cake')) ||
    formData.name
      .toLowerCase()
      .includes('cake')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

          <div className="flex items-center gap-3">

            <Button
              onClick={() => {
                resetForm()

                setFormData(
                  prev => ({
                    ...prev,
                    category:
                      'Cakes',
                    price:
                      '20000',
                    name:
                      '6" Classic Vanilla Cake'
                  })
                )

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

                setFormData(
                  prev => ({
                    ...prev,
                    category:
                      'Rice Dishes',
                    price:
                      '3000',
                    name:
                      'Smokey Jollof Rice'
                  })
                )

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

            <Link
              href="/"
              target="_blank"
              className="text-[#0A2E1D] hover:underline flex items-center gap-1"
            >
              Storefront Preview
              <Eye className="w-3.5 h-3.5 text-[#EAA823]" />
            </Link>

            <Link
              href="/cakes"
              target="_blank"
              className="text-[#0A2E1D] hover:underline flex items-center gap-1"
            >
              Cakes Preview
              <Sparkles className="w-3.5 h-3.5 text-[#EAA823]" />
            </Link>

          </div>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-3xl p-6 mb-8 shadow-2xl space-y-6">

            <div className="flex justify-between items-center pb-4 border-b border-border">

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                  {editingId
                    ? 'Edit Product & Customizations'
                    : 'Create Product Catalog Item'}

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
                  Configure basic info, custom portion prices, multiplier counters, minimum multiplier quantities, piece cuts, min/max selection bounds, add-ons, and specs.
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

            <div className="flex gap-2 border-b border-border overflow-x-auto">

              <button
                type="button"
                onClick={() =>
                  setActiveTab('basic')
                }
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
                onClick={() =>
                  setActiveTab(
                    'customization'
                  )
                }
                className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab ===
                  'customization'
                    ? 'border-[#0A2E1D] text-[#0A2E1D] bg-emerald-50 rounded-t-xl'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings2 className="w-4 h-4 text-emerald-700" />
                2. Custom Options, Cuts &amp; Specs ({optionGroups.length})
              </button>

              {isCurrentCategoryCake && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      'cake_tiers'
                    )
                  }
                  className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab ===
                    'cake_tiers'
                      ? 'border-[#EAA823] text-[#0A2E1D] bg-[#EAA823]/10 rounded-t-xl'
                      : 'border-transparent text-[#0A2E1D] hover:text-[#EAA823]'
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
                      value={
                        formData.name
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          name:
                            e.target
                              .value
                        })
                      }
                      placeholder="e.g. Catfish Pepper Soup, Jumbo Shawarma, Classic Parfait"
                      className="rounded-xl border-gray-300 font-bold"
                    />
                  </div>

                  <div className="space-y-2">

                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Base / Starting Price (₦ Naira) *
                    </label>

                    <div className="relative">

                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                        ₦
                      </span>

                      <Input
                        type="number"
                        required
                        step="any"
                        value={
                          formData.price
                        }
                        onChange={e =>
                          setFormData({
                            ...formData,
                            price:
                              e.target
                                .value
                          })
                        }
                        placeholder="9000"
                        className="pl-8 rounded-xl border-gray-300 font-black text-base text-[#0A2E1D]"
                      />

                    </div>
                  </div>

                  <div className="space-y-2">

                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Minimum Order Level (MOQ)
                    </label>

                    <Input
                      type="number"
                      min="1"
                      value={
                        formData.min_order_quantity
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          min_order_quantity:
                            e.target
                              .value
                        })
                      }
                      placeholder="1"
                      className="rounded-xl border-gray-300 font-bold"
                    />

                  </div>

                  <div className="space-y-2">

                    <div className="flex justify-between items-center">

                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                        Store Category *
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(
                            !isCustomCategory
                          )

                          if (
                            !isCustomCategory
                          ) {
                            setCustomCategoryInput(
                              ''
                            )
                          }
                        }}
                        className="text-[11px] text-[#0A2E1D] font-bold underline cursor-pointer"
                      >
                        {isCustomCategory
                          ? 'Select from list'
                          : '+ Add custom category'}
                      </button>

                    </div>

                    {!isCustomCategory ? (
                      <select
                        value={
                          formData.category
                        }
                        onChange={e => {
                          if (
                            e.target
                              .value ===
                            '__custom__'
                          ) {
                            setIsCustomCategory(
                              true
                            )
                          } else {
                            setFormData({
                              ...formData,
                              category:
                                e.target
                                  .value
                            })
                          }
                        }}
                        className="w-full bg-white border border-gray-300 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0A2E1D] text-[#0A2E1D]"
                      >
                        {STORE_CATEGORIES.map(
                          cat => (
                            <option
                              key={cat}
                              value={cat}
                            >
                              {cat}
                            </option>
                          )
                        )}

                        <option value="__custom__">
                          + Enter Custom Category...
                        </option>
                      </select>
                    ) : (
                      <Input
                        type="text"
                        placeholder="Type custom category name..."
                        value={
                          customCategoryInput
                        }
                        onChange={e =>
                          setCustomCategoryInput(
                            e.target
                              .value
                          )
                        }
                        className="rounded-xl border-gray-300 font-semibold"
                      />
                    )}

                  </div>

                  <div className="space-y-2">

                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Stock Units Available
                    </label>

                    <Input
                      type="number"
                      value={
                        formData.stock_quantity
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          stock_quantity:
                            e.target
                              .value
                        })
                      }
                      placeholder="10"
                      className="rounded-xl border-gray-300 font-bold"
                    />

                  </div>

                  <div className="space-y-2 md:col-span-2">

                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Product Picture (Upload, Drag or Enter Path)
                    </label>

                    <div
                      onDragOver={e => {
                        e.preventDefault()
                        setIsDragging(
                          true
                        )
                      }}
                      onDragLeave={() =>
                        setIsDragging(
                          false
                        )
                      }
                      onDrop={
                        handleDrop
                      }
                      className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
                        isDragging
                          ? 'border-[#EAA823] bg-amber-50/50'
                          : 'border-gray-300 bg-[#FDFBF7] hover:border-[#0A2E1D]'
                      }`}
                    >

                      <input
                        ref={
                          fileInputRef
                        }
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={e => {
                          if (
                            e.target
                              .files &&
                            e.target
                              .files[0]
                          ) {
                            handleFileUpload(
                              e.target
                                .files[0]
                            )
                          }
                        }}
                      />

                      {formData.image_url ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                          <div className="flex items-center gap-4">

                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white flex-shrink-0">

                              <img
                                src={
                                  formData.image_url
                                }
                                alt="Product Preview"
                                className="w-full h-full object-cover"
                              />

                            </div>

                            <div className="text-left space-y-1">

                              <span className="text-xs font-bold text-[#0A2E1D] block">
                                Image Attached
                              </span>

                              <span className="text-[11px] text-gray-500 line-clamp-1 max-w-sm font-mono">
                                {
                                  formData.image_url
                                }
                              </span>

                            </div>

                          </div>

                          <div className="flex items-center gap-2">

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                uploadingImage
                              }
                              onClick={() =>
                                fileInputRef.current?.click()
                              }
                              className="rounded-xl text-xs font-bold border-gray-300"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1 text-[#EAA823]" />
                              Replace Picture
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  image_url:
                                    ''
                                })
                              }
                              className="text-red-500 hover:bg-red-50 rounded-xl p-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>

                          </div>

                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
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

                    <div className="pt-1">

                      <Input
                        type="text"
                        value={
                          formData.image_url
                        }
                        onChange={e =>
                          setFormData({
                            ...formData,
                            image_url:
                              e.target
                                .value
                          })
                        }
                        placeholder="Or enter image URL/path"
                        className="rounded-xl border-gray-200 text-xs bg-white"
                      />

                    </div>

                  </div>

                  <div className="space-y-2 md:col-span-2">

                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                      Short Storefront Description
                    </label>

                    <Textarea
                      rows={2}
                      value={
                        formData.description
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          description:
                            e.target
                              .value
                        })
                      }
                      placeholder="Brief summary displayed on food cards..."
                      className="rounded-xl border-gray-300 text-xs bg-white"
                    />

                  </div>

                </div>

                <div className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-2xl border border-gray-200">

                  <div>

                    <span className="text-sm font-bold text-[#0A2E1D] block">
                      In Stock &amp; Visible to Customers
                    </span>

                    <span className="text-xs text-gray-500">
                      Uncheck to mark this product as sold out.
                    </span>

                  </div>

                  <input
                    type="checkbox"
                    checked={
                      formData.in_stock
                    }
                    onChange={e =>
                      setFormData({
                        ...formData,
                        in_stock:
                          e.target
                            .checked
                      })
                    }
                    className="w-5 h-5 accent-[#0A2E1D] rounded cursor-pointer"
                  />

                </div>

              </div>
            )}

            {activeTab === 'customization' && (
              <div className="space-y-6 bg-[#FDFBF7] text-[#0A2E1D] p-5 sm:p-7 rounded-3xl border border-gray-200 shadow-sm">

                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2.5 shadow-xs">

                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A2E1D] flex items-center gap-1.5">

                    <Sparkles className="w-3.5 h-3.5 text-[#EAA823]" />

                    1-Click Presets with Cuts &amp; Sizes (Click to Auto-Fill):

                  </span>

                  <div className="flex flex-wrap gap-2">

                    {Object.keys(
                      WAITLIST_PRESETS
                    ).map(
                      presetKey => (
                        <button
                          key={
                            presetKey
                          }
                          type="button"
                          onClick={() =>
                            applyPreset(
                              presetKey
                            )
                          }
                          className="text-xs bg-[#FDFBF7] border border-gray-200 hover:border-[#0A2E1D] hover:text-[#0A2E1D] px-3 py-1.5 rounded-xl text-gray-700 transition font-medium cursor-pointer shadow-xs"
                        >
                          +{' '}
                          {
                            presetKey
                          }
                        </button>
                      )
                    )}

                  </div>

                </div>

                <div className="flex items-center justify-between pt-1">

                  <div>

                    <span className="text-xs font-bold text-[#0A2E1D] uppercase tracking-wider block">
                      Interactive Option Groups ({optionGroups.length})
                    </span>

                    <span className="text-[11px] text-gray-500">
                      Configure <b>Exact Portion Prices</b>, <b>Add-on Fees</b>, <b>Multiplier Minimum Quantities</b>, and <b>Min/Max Cuts</b>.
                    </span>

                  </div>

                  <Button
                    type="button"
                    onClick={
                      addOptionGroup
                    }
                    className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-extrabold text-xs rounded-xl gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option Group
                  </Button>

                </div>

                {optionGroups.length === 0 ? (
                  <div className="text-center py-8 bg-white border border-dashed border-gray-300 rounded-2xl space-y-2">

                    <p className="text-sm font-semibold text-gray-700">
                      No option groups added yet.
                    </p>

                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Click a 1-click preset above or tap &quot;Add Option Group&quot; to configure custom options.
                    </p>

                  </div>
                ) : (
                  <div className="space-y-4">

                    {optionGroups.map(
                      (
                        group,
                        groupIndex
                      ) => {

                        const isStandalone =
                          (
                            group.price_mode ||
                            'standalone'
                          ) ===
                          'standalone'

                        return (
                          <div
                            key={
                              groupIndex
                            }
                            className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
                          >

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">

                              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">

                                <Input
                                  placeholder="Group Name"
                                  value={
                                    group.name
                                  }
                                  onChange={e =>
                                    updateOptionGroup(
                                      groupIndex,
                                      'name',
                                      e.target
                                        .value
                                    )
                                  }
                                  className="bg-[#FDFBF7] border-gray-300 text-[#0A2E1D] font-bold text-xs sm:text-sm rounded-xl flex-1"
                                />

                                <div className="flex items-center gap-2">

                                  <label className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap">
                                    Pricing Type:
                                  </label>

                                  <select
                                    value={
                                      group.price_mode ||
                                      'standalone'
                                    }
                                    onChange={e =>
                                      updateOptionGroup(
                                        groupIndex,
                                        'price_mode',
                                        e.target
                                          .value
                                      )
                                    }
                                    className={`text-xs font-bold p-2 rounded-xl border outline-none cursor-pointer ${
                                      isStandalone
                                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                                        : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    }`}
                                  >
                                    <option value="standalone">
                                      Exact Portion Price (Overrides Base)
                                    </option>

                                    <option value="addon">
                                      + Add-on Fee (Adds to Base)
                                    </option>
                                  </select>

                                </div>

                                <div className="flex items-center gap-3">

                                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer whitespace-nowrap">

                                    <input
                                      type="checkbox"
                                      checked={
                                        group.is_required
                                      }
                                      onChange={e =>
                                        updateOptionGroup(
                                          groupIndex,
                                          'is_required',
                                          e.target
                                            .checked
                                        )
                                      }
                                      className="w-4 h-4 rounded text-[#0A2E1D]"
                                    />

                                    Required

                                  </label>

                                  <select
                                    value={
                                      group.type ||
                                      'radio'
                                    }
                                    onChange={e =>
                                      updateOptionGroup(
                                        groupIndex,
                                        'type',
                                        e.target
                                          .value
                                      )
                                    }
                                    className="bg-[#FDFBF7] border border-gray-300 text-[#0A2E1D] text-xs p-2 rounded-xl outline-none font-medium"
                                  >
                                    <option value="radio">
                                      Single Choice (Radio)
                                    </option>

                                    <option value="checkbox">
                                      Multi-Choice (Checkbox)
                                    </option>
                                  </select>

                                </div>

                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeOptionGroup(
                                    groupIndex
                                  )
                                }
                                className="text-red-500 hover:bg-red-50 p-2 rounded-xl self-end lg:self-auto cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>

                            </div>

                            <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-[#0A2E1D]/20">

                              {group.options.map(
                                (
                                  option,
                                  optionIndex
                                ) => {

                                  const cutInputKey =
                                    `${groupIndex}-${optionIndex}`

                                  return (
                                    <div
                                      key={
                                        optionIndex
                                      }
                                      className="bg-[#FDFBF7] p-3.5 rounded-xl border border-gray-200 space-y-2.5"
                                    >

                                      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">

                                        <Input
                                          placeholder="Option Title"
                                          value={
                                            option.name
                                          }
                                          onChange={e =>
                                            updateOption(
                                              groupIndex,
                                              optionIndex,
                                              'name',
                                              e.target
                                                .value
                                            )
                                          }
                                          className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl flex-1 min-w-[150px] font-semibold"
                                        />

                                        <div className="flex items-center gap-1">

                                          <span className="text-xs text-[#0A2E1D] font-mono font-bold">
                                            {isStandalone
                                              ? '₦'
                                              : '+₦'}
                                          </span>

                                          <Input
                                            type="number"
                                            step="any"
                                            placeholder={
                                              isStandalone
                                                ? 'Exact Price'
                                                : 'Extra Fee'
                                            }
                                            value={
                                              option.price_modifier
                                            }
                                            onChange={e =>
                                              updateOption(
                                                groupIndex,
                                                optionIndex,
                                                'price_modifier',
                                                parseFloat(
                                                  e.target
                                                    .value
                                                ) || 0
                                              )
                                            }
                                            className="w-32 bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl font-bold"
                                          />

                                          <span className="text-[10px] text-gray-400 font-bold hidden sm:inline">
                                            {isStandalone
                                              ? '(Exact)'
                                              : '(Add)'}
                                          </span>

                                        </div>

                                        <label className="flex items-center gap-1 text-[11px] text-gray-700 whitespace-nowrap cursor-pointer">

                                          <input
                                            type="checkbox"
                                            checked={
                                              option.is_available
                                            }
                                            onChange={e =>
                                              updateOption(
                                                groupIndex,
                                                optionIndex,
                                                'is_available',
                                                e.target
                                                  .checked
                                              )
                                            }
                                            className="w-3.5 h-3.5 rounded text-[#0A2E1D]"
                                          />

                                          Available

                                        </label>

                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeOption(
                                              groupIndex,
                                              optionIndex
                                            )
                                          }
                                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>

                                      </div>

                                      <div className="flex flex-wrap gap-3 items-center pt-1">

                                        <Input
                                          placeholder="Subtitle"
                                          value={
                                            option.description ||
                                            ''
                                          }
                                          onChange={e =>
                                            updateOption(
                                              groupIndex,
                                              optionIndex,
                                              'description',
                                              e.target
                                                .value
                                            )
                                          }
                                          className="bg-white border-gray-300 text-gray-600 text-[11px] rounded-lg flex-1 min-w-[200px]"
                                        />

                                        <label className="flex items-center gap-1.5 text-[10px] text-[#0A2E1D] font-semibold whitespace-nowrap cursor-pointer">

                                          <input
                                            type="checkbox"
                                            checked={
                                              !!option.has_counter
                                            }
                                            onChange={e =>
                                              toggleMultiplierCounter(
                                                groupIndex,
                                                optionIndex,
                                                e.target
                                                  .checked
                                              )
                                            }
                                            className="w-3.5 h-3.5 rounded text-[#0A2E1D]"
                                          />

                                          Has Multiplier Counter (e.g. ₦2,000/cube)

                                        </label>

                                      </div>

                                      {option.has_counter && (
                                        <div className="mt-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/70">

                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                                            <div>

                                              <span className="text-xs font-black text-emerald-900 block">
                                                Multiplier Quantity Settings
                                              </span>

                                              <span className="text-[10px] text-emerald-700">
                                                Customer quantity cannot go below the minimum quantity specified here.
                                              </span>

                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">

                                              <div className="flex items-center gap-2">

                                                <label className="text-[11px] font-bold text-emerald-900 whitespace-nowrap">
                                                  Unit Price:
                                                </label>

                                                <div className="relative">

                                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700">
                                                    ₦
                                                  </span>

                                                  <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={
                                                      option.unit_price ??
                                                      option.price_modifier ??
                                                      0
                                                    }
                                                    onChange={e =>
                                                      updateOption(
                                                        groupIndex,
                                                        optionIndex,
                                                        'unit_price',
                                                        Math.max(
                                                          0,
                                                          parseFloat(
                                                            e.target
                                                              .value
                                                          ) || 0
                                                        )
                                                      )
                                                    }
                                                    className="w-28 h-8 pl-6 text-xs font-black bg-white border-emerald-200 text-[#0A2E1D]"
                                                  />

                                                </div>

                                              </div>

                                              <div className="flex items-center gap-2">

                                                <label className="text-[11px] font-black text-emerald-900 whitespace-nowrap">
                                                  Minimum Quantity:
                                                </label>

                                                <Input
                                                  type="number"
                                                  min="1"
                                                  step="1"
                                                  value={
                                                    option.min_quantity ??
                                                    1
                                                  }
                                                  onChange={e =>
                                                    updateMinimumMultiplierQuantity(
                                                      groupIndex,
                                                      optionIndex,
                                                      e.target
                                                        .value
                                                    )
                                                  }
                                                  className="w-20 h-8 text-center text-xs font-black bg-white border-emerald-300 text-[#0A2E1D]"
                                                />

                                              </div>

                                            </div>

                                          </div>

                                          <div className="mt-2 text-[10px] font-semibold text-emerald-800">

                                            Example:{' '}
                                            <span className="font-black">
                                              ₦
                                              {Number(
                                                option.unit_price ??
                                                option.price_modifier ??
                                                0
                                              ).toLocaleString()}
                                              /unit
                                            </span>{' '}
                                            × minimum{' '}
                                            <span className="font-black">
                                              {option.min_quantity ??
                                                1}
                                            </span>{' '}
                                            quantity.

                                          </div>

                                        </div>
                                      )}

                                      <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2.5 mt-2">

                                        <div className="flex flex-wrap items-center justify-between gap-3">

                                          <label className="flex items-center gap-2 text-xs font-bold text-[#0A2E1D] cursor-pointer">

                                            <input
                                              type="checkbox"
                                              checked={
                                                !!option.has_cuts_selection
                                              }
                                              onChange={e => {
                                                const checked =
                                                  e.target
                                                    .checked

                                                updateOption(
                                                  groupIndex,
                                                  optionIndex,
                                                  'has_cuts_selection',
                                                  checked
                                                )

                                                if (
                                                  checked &&
                                                  (
                                                    !option.allowed_cuts ||
                                                    option.allowed_cuts.length ===
                                                      0
                                                  )
                                                ) {
                                                  updateOption(
                                                    groupIndex,
                                                    optionIndex,
                                                    'allowed_cuts',
                                                    DEFAULT_FISH_CUTS
                                                  )
                                                }

                                                if (
                                                  checked &&
                                                  (
                                                    option.min_cuts_selection ===
                                                      undefined ||
                                                    option.min_cuts_selection ===
                                                      null
                                                  )
                                                ) {
                                                  updateOption(
                                                    groupIndex,
                                                    optionIndex,
                                                    'min_cuts_selection',
                                                    1
                                                  )
                                                }
                                              }}
                                              className="w-4 h-4 rounded text-[#0A2E1D] focus:ring-[#0A2E1D]"
                                            />

                                            <Fish className="w-3.5 h-3.5 text-[#EAA823]" />

                                            <span>
                                              Allow Customers to Pick Specific Cuts (Head, Middle, Tail, Wings, etc.)
                                            </span>

                                          </label>

                                          {option.has_cuts_selection && (
                                            <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-600">

                                              <div className="flex items-center gap-1.5">

                                                <span>
                                                  Min cuts:
                                                </span>

                                                <Input
                                                  type="number"
                                                  min="0"
                                                  value={
                                                    option.min_cuts_selection ??
                                                    1
                                                  }
                                                  onChange={e => {
                                                    const val =
                                                      Math.max(
                                                        0,
                                                        parseInt(
                                                          e.target
                                                            .value,
                                                          10
                                                        ) || 0
                                                      )

                                                    updateOption(
                                                      groupIndex,
                                                      optionIndex,
                                                      'min_cuts_selection',
                                                      val
                                                    )
                                                  }}
                                                  className="w-14 h-7 text-center font-bold text-xs bg-[#FDFBF7] border-gray-300"
                                                />

                                              </div>

                                              <div className="flex items-center gap-1.5">

                                                <span>
                                                  Max cuts:
                                                </span>

                                                <Input
                                                  type="number"
                                                  min="1"
                                                  value={
                                                    option.max_cuts_selection ||
                                                    1
                                                  }
                                                  onChange={e => {
                                                    const val =
                                                      Math.max(
                                                        1,
                                                        parseInt(
                                                          e.target
                                                            .value,
                                                          10
                                                        ) || 1
                                                      )

                                                    updateOption(
                                                      groupIndex,
                                                      optionIndex,
                                                      'max_cuts_selection',
                                                      val
                                                    )
                                                  }}
                                                  className="w-14 h-7 text-center font-bold text-xs bg-[#FDFBF7] border-gray-300"
                                                />

                                              </div>

                                            </div>
                                          )}

                                        </div>

                                        {option.has_cuts_selection && (
                                          <div className="space-y-2 pt-1 border-t border-gray-100">

                                            <div className="flex gap-2">

                                              <Input
                                                type="text"
                                                placeholder="Add cut part"
                                                value={
                                                  newCutInput[
                                                    cutInputKey
                                                  ] || ''
                                                }
                                                onChange={e =>
                                                  setNewCutInput({
                                                    ...newCutInput,
                                                    [cutInputKey]:
                                                      e.target
                                                        .value
                                                  })
                                                }
                                                className="bg-[#FDFBF7] border-gray-200 text-xs rounded-lg flex-1"
                                                onKeyDown={e => {
                                                  if (
                                                    e.key ===
                                                    'Enter'
                                                  ) {
                                                    e.preventDefault()

                                                    addCutToOption(
                                                      groupIndex,
                                                      optionIndex
                                                    )
                                                  }
                                                }}
                                              />

                                              <Button
                                                type="button"
                                                size="sm"
                                                onClick={() =>
                                                  addCutToOption(
                                                    groupIndex,
                                                    optionIndex
                                                  )
                                                }
                                                className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white text-xs font-bold rounded-lg cursor-pointer"
                                              >
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                Add Cut
                                              </Button>

                                            </div>

                                            <div className="flex flex-wrap gap-1.5 pt-1">

                                              {(
                                                option.allowed_cuts ||
                                                []
                                              ).map(
                                                (
                                                  cut,
                                                  cutIdx
                                                ) => (
                                                  <span
                                                    key={
                                                      cutIdx
                                                    }
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium"
                                                  >

                                                    <Tag className="w-3 h-3 text-[#EAA823]" />

                                                    <span>
                                                      {cut}
                                                    </span>

                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        removeCutFromOption(
                                                          groupIndex,
                                                          optionIndex,
                                                          cutIdx
                                                        )
                                                      }
                                                      className="text-gray-400 hover:text-red-500 cursor-pointer ml-0.5"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>

                                                  </span>
                                                )
                                              )}

                                            </div>

                                          </div>
                                        )}

                                      </div>

                                    </div>
                                  )
                                }
                              )}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  addOption(
                                    groupIndex
                                  )
                                }
                                className="w-full mt-2 border-dashed border-gray-300 text-gray-700 hover:text-[#0A2E1D] hover:border-[#0A2E1D] text-xs font-semibold rounded-xl cursor-pointer bg-white"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Portion / Choice to &quot;
                                {group.name ||
                                  'Group'}
                                &quot;
                              </Button>

                            </div>

                          </div>
                        )
                      }
                    )}

                  </div>
                )}

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
                        value={
                          prepTime
                        }
                        onChange={e =>
                          setPrepTime(
                            e.target
                              .value
                          )
                        }
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
                        value={
                          servings
                        }
                        onChange={e =>
                          setServings(
                            e.target
                              .value
                          )
                        }
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
                      value={
                        storageInstructions
                      }
                      onChange={e =>
                        setStorageInstructions(
                          e.target
                            .value
                        )
                      }
                      placeholder="e.g. Best consumed warm or refrigerated at 4°C within 48 hours."
                      className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl"
                    />

                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-200">

                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Fresh Ingredients
                    </label>

                    <div className="flex gap-2">

                      <Input
                        type="text"
                        value={
                          newIngredient
                        }
                        onChange={e =>
                          setNewIngredient(
                            e.target
                              .value
                          )
                        }
                        placeholder="e.g. Fresh Catfish, Ehuru, Uda, Scent Leaf, Long-grain Rice"
                        className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl"
                        onKeyDown={e => {
                          if (
                            e.key ===
                            'Enter'
                          ) {
                            e.preventDefault()
                            addIngredient()
                          }
                        }}
                      />

                      <Button
                        type="button"
                        onClick={
                          addIngredient
                        }
                        className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>

                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">

                      {ingredients.map(
                        (
                          item,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-800 shadow-xs"
                          >
                            <span>
                              {item}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeIngredient(
                                  index
                                )
                              }
                              className="text-gray-400 hover:text-red-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )
                      )}

                    </div>

                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-200">

                    <label className="block text-xs font-bold text-red-600 uppercase flex items-center gap-1">

                      <ShieldAlert className="w-3.5 h-3.5" />

                      Allergens Notice

                    </label>

                    <div className="flex gap-2">

                      <Input
                        type="text"
                        value={
                          newAllergen
                        }
                        onChange={e =>
                          setNewAllergen(
                            e.target
                              .value
                          )
                        }
                        placeholder="e.g. Fish, Dairy, Cashews, Peanuts, Gluten"
                        className="bg-white border-gray-300 text-[#0A2E1D] text-xs rounded-xl"
                        onKeyDown={e => {
                          if (
                            e.key ===
                            'Enter'
                          ) {
                            e.preventDefault()
                            addAllergen()
                          }
                        }}
                      />

                      <Button
                        type="button"
                        onClick={
                          addAllergen
                        }
                        className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>

                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">

                      {allergens.map(
                        (
                          item,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs text-red-700 shadow-xs"
                          >

                            <span>
                              {item}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeAllergen(
                                  index
                                )
                              }
                              className="text-red-400 hover:text-red-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>

                          </span>
                        )
                      )}

                    </div>

                  </div>

                </div>

              </div>
            )}

            {activeTab ===
              'cake_tiers' &&
              isCurrentCategoryCake && (
                <div className="space-y-6 bg-[#FDFBF7] p-6 rounded-2xl border border-gray-200">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="text-lg font-black text-[#0A2E1D]">
                        Cake Customization Matrix
                      </h3>

                      <p className="text-xs text-gray-500">
                        Configure default diameter size, flavor, and layer pricing presets.
                      </p>

                    </div>

                    <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">

                      <CheckCircle2 className="w-3.5 h-3.5" />

                      Synced with Live Storefront

                    </span>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-2">

                      <label className="text-xs font-bold uppercase text-gray-600">
                        Default Cake Size
                      </label>

                      <div className="grid grid-cols-2 gap-3">

                        {(
                          [
                            '6 inches',
                            '7 inches'
                          ] as const
                        ).map(
                          s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                handleSizeChange(
                                  s
                                )
                              }
                              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                cakeSize ===
                                s
                                  ? 'bg-[#0A2E1D] text-[#EAA823] border-[#0A2E1D] shadow-sm'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {s} Round
                            </button>
                          )
                        )}

                      </div>

                    </div>

                    <div className="space-y-2">

                      <label className="text-xs font-bold uppercase text-gray-600">
                        Default Flavor Profile
                      </label>

                      <select
                        value={
                          cakeFlavor
                        }
                        onChange={e =>
                          setCakeFlavor(
                            e.target
                              .value as any
                          )
                        }
                        className="w-full bg-white border border-gray-200 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:border-[#0A2E1D]"
                      >
                        <option value="Vanilla">
                          Vanilla Sponge
                        </option>

                        <option value="Chocolate">
                          Rich Cocoa Chocolate Fudge
                        </option>

                        <option value="Red Velvet">
                          Signature Crimson Red Velvet
                        </option>

                        <option value="Multi-Flavor Combo">
                          Multi-Flavor Mix Combo
                        </option>
                      </select>

                    </div>

                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">

                    <label className="text-xs font-bold uppercase text-gray-600 block">
                      Layer Pricing Presets (₦ Naira)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                      {cakeTiers.map(
                        (
                          tier,
                          idx
                        ) => (
                          <div
                            key={
                              tier.layers
                            }
                            className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 shadow-xs"
                          >

                            <div className="flex justify-between items-center">

                              <span className="text-xs font-bold text-[#0A2E1D]">
                                {
                                  tier.layers
                                }{' '}
                                Layer
                                {tier.layers >
                                1
                                  ? 's'
                                  : ''}
                              </span>

                              <span className="text-[10px] text-gray-400">
                                Tier #
                                {idx +
                                  1}
                              </span>

                            </div>

                            <div className="relative">

                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                ₦
                              </span>

                              <Input
                                type="number"
                                value={
                                  tier.price
                                }
                                onChange={e =>
                                  handleTierPriceChange(
                                    idx,
                                    Number(
                                      e.target
                                        .value
                                    )
                                  )
                                }
                                className="pl-7 font-bold text-sm text-[#0A2E1D]"
                              />

                            </div>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">

                    <div>

                      <span className="text-sm font-bold text-[#0A2E1D] block">
                        Allow Custom Inscription / Message
                      </span>

                      <span className="text-xs text-gray-500">
                        Permits customers to input personalized lettering at checkout
                      </span>

                    </div>

                    <input
                      type="checkbox"
                      checked={
                        allowInscription
                      }
                      onChange={e =>
                        setAllowInscription(
                          e.target
                            .checked
                        )
                      }
                      className="w-5 h-5 accent-[#0A2E1D] rounded cursor-pointer"
                    />

                  </div>

                </div>
              )}

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">

              <span className="text-xs text-muted-foreground">
                All basic info, portion prices, multiplier quantities, cuts selection, and culinary specs will be saved together.
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
                  onClick={
                    handleSaveProduct
                  }
                  disabled={
                    submitting
                  }
                  className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black px-8 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >

                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Saving Catalog Item...
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />

                      <span>
                        {editingId
                          ? 'Save & Update All Details'
                          : 'Publish Product to Live Store'}
                      </span>
                    </>
                  )}

                </Button>

              </div>

            </div>

          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-3">

            <div className="w-8 h-8 border-3 border-[#0A2E1D] border-t-transparent rounded-full animate-spin" />

            <p className="font-semibold text-sm">
              Fetching catalog from database...
            </p>

          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">

            <p className="mb-4 text-gray-500 font-medium">
              No products registered in store inventory yet.
            </p>

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

                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">
                    Product
                  </th>

                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">
                    Category
                  </th>

                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">
                    Starting Price
                  </th>

                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">
                    Portion &amp; Cut Customizations
                  </th>

                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">
                    Status
                  </th>

                  <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-border">

                {products.map(
                  product => {

                    const isCake =
                      product.category
                        ?.toLowerCase() ===
                        'cakes' ||
                      product.name
                        .toLowerCase()
                        .includes(
                          'cake'
                        )

                    const hasCustomOptions =
                      Array.isArray(
                        product.customization_options
                      ) &&
                      product
                        .customization_options
                        .length >
                        0

                    const hasMultiplierOptions =
                      hasCustomOptions &&
                      product
                        .customization_options!
                        .some(
                          group =>
                            group.options?.some(
                              option =>
                                option.has_counter
                            )
                        )

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="hover:bg-muted/30 transition-colors"
                      >

                        <td className="px-4 py-3.5">

                          <div className="flex items-center gap-3">

                            {product.image_url ? (
                              <img
                                src={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                                className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-xs"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                                FOOD
                              </div>
                            )}

                            <div>

                              <span className="text-foreground font-bold text-sm block">
                                {
                                  product.name
                                }
                              </span>

                              {product.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                  {
                                    product.description
                                  }
                                </span>
                              )}

                            </div>

                          </div>

                        </td>

                        <td className="px-4 py-3.5">

                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                              isCake
                                ? 'bg-[#0A2E1D] text-[#EAA823]'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >

                            {isCake ? (
                              <Cake className="w-3 h-3" />
                            ) : (
                              <Utensils className="w-3 h-3 text-[#0A2E1D]" />
                            )}

                            {
                              product.category ||
                              'Meals'
                            }

                          </span>

                        </td>

                        <td className="px-4 py-3.5 text-foreground font-black text-sm">
                          ₦
                          {Number(
                            product.price
                          ).toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5">

                          {isCake ? (
                            <div className="text-xs space-y-0.5">

                              <span className="font-bold text-[#0A2E1D] block">
                                1, 2 &amp; 3 Tier Layer Matrix
                              </span>

                              <span className="text-[11px] text-gray-500">
                                Vanilla, Chocolate, Red Velvet
                              </span>

                            </div>
                          ) : hasCustomOptions ? (
                            <div className="text-xs space-y-0.5">

                              <span className="font-bold text-emerald-800 flex items-center gap-1">

                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />

                                {
                                  product
                                    .customization_options!
                                    .length
                                }{' '}
                                Option Group
                                {product
                                  .customization_options!
                                  .length >
                                1
                                  ? 's'
                                  : ''}{' '}
                                Configured

                              </span>

                              <span className="text-[10px] text-gray-500 truncate block max-w-xs">

                                {product
                                  .customization_options!
                                  .map(
                                    g =>
                                      `${g.name} (${
                                        g.price_mode ===
                                        'addon'
                                          ? 'Add-on'
                                          : 'Portion'
                                      })`
                                  )
                                  .join(
                                    ', '
                                  )}

                              </span>

                              {hasMultiplierOptions && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                                  <Plus className="w-2.5 h-2.5" />
                                  Multiplier Counter Enabled
                                </span>
                              )}

                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Standard Meal (No Add-ons)
                            </span>
                          )}

                        </td>

                        <td className="px-4 py-3.5">

                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              product.in_stock
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.in_stock
                              ? 'In Stock'
                              : 'Out of Stock'}
                          </span>

                        </td>

                        <td className="px-4 py-3.5 text-center">

                          <div className="flex gap-1 justify-center">

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEdit(
                                  product
                                )
                              }
                              className="text-[#0A2E1D] hover:bg-[#0A2E1D]/10 rounded-lg cursor-pointer"
                              title="Edit Product & Customizations"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  product.id
                                )
                              }
                              className="text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                          </div>

                        </td>

                      </tr>
                    )
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>
    </div>
  )
}