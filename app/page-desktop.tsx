'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { ProductCard } from '@/components/storefront/product-card'
import { ProductDetailModal } from '@/components/storefront/product-detail-modal'
import { CustomerReviewsSection } from '@/components/storefront/customer-reviews'
import { WaitlistCountdownSection } from '@/components/storefront/waitlist-hero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { 
  Search, 
  Clock, 
  ShieldCheck, 
  Headphones, 
  Leaf, 
  ChefHat, 
  Truck, 
  ArrowRight,
  Heart,
  Utensils,
  Pizza,
  Drumstick,
  ChevronDown,
  Sparkles,
  Send,
  Cake,
  X,
  Loader2,
  MessageCircle,
  ShoppingBag,
  ArrowUpRight,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
  category: string
}

interface SubCategoryItem {
  label: string
  desc?: string
  isCustom?: boolean
}

interface SubCategoryGroup {
  groupTitle?: string
  items: SubCategoryItem[]
}

interface CategoryConfig {
  name: string
  icon: React.ReactNode
  image?: string
  isCakeRoute?: boolean
  groups?: SubCategoryGroup[]
}

const CATEGORIES: CategoryConfig[] = [
  { name: 'All', icon: <Utensils className="w-4 h-4" /> },
  { 
    name: 'Meals', 
    icon: <Utensils className="w-4 h-4" />, 
    image: '/Recipe2.jpg',
    groups: [
      {
        groupTitle: 'Meal Types',
        items: [
          { label: 'Breakfast', desc: 'Light & morning delights' },
          { label: 'Lunch', desc: 'Hearty afternoon meals' },
          { label: 'Dinner', desc: 'Full evening platters' },
          { label: 'On-the-go', desc: 'Quick bite meals' },
        ]
      },
    ]
  },
  { 
    name: 'Cakes', 
    icon: <Cake className="w-4 h-4 text-[#EAA823]" />, 
    image: '/cakes.jpg',
    isCakeRoute: true,
    groups: [
      {
        groupTitle: 'Celebration Cakes',
        items: [
          { label: 'View Cakes Collection', desc: '6" and 7" Tiered Flavors' },
          { label: 'Live Price Estimator', desc: 'Interactive pricing & custom layers' },
        ]
      }
    ]
  },
  { 
    name: 'Shawarma', 
    icon: <span className="text-xs font-bold">🫔</span>, 
    image: '/shawarma.jpeg',
    groups: [
      {
        groupTitle: 'Sizes & Custom Orders',
        items: [
          { label: 'Jumbo Size', desc: 'Extra meat, double sausage' },
          { label: 'Small Size', desc: 'Classic single roll' },
          { label: 'Custom Order', desc: 'Tell us your exact custom mix', isCustom: true },
        ]
      }
    ]
  },
  { 
    name: 'Pasta', 
    icon: <span className="text-xs font-bold">🍝</span>, 
    image: '/pasta.jpeg',
    groups: [
      {
        groupTitle: 'Varieties',
        items: [
          { label: 'Spaghetti Bolognese', desc: 'Savory minced meat sauce' },
          { label: 'Creamy Alfredo', desc: 'Rich parmesan sauce' },
          { label: 'Seafood Pasta', desc: 'Fresh local seafood' },
        ]
      }
    ]
  },
  { 
    name: 'Noodles', 
    icon: <Drumstick className="w-4 h-4" />, 
    image: '/noodles.jpeg',
    groups: [
      {
        groupTitle: 'Options',
        items: [
          { label: 'Stir-Fry Noodles', desc: 'Loaded with veggies & egg' },
          { label: 'Special Seafood Noodles', desc: 'Prawns & calamari' },
        ]
      }
    ]
  },
  { 
    name: 'Corndogs', 
    icon: <Pizza className="w-4 h-4" />, 
    image: '/corndog.webp',
    groups: [
      {
        groupTitle: 'Types',
        items: [
          { label: 'Cheese Corndog', desc: 'Melted mozzarella inside' },
          { label: 'Sausage Corndog', desc: 'Classic beef sausage' },
          { label: 'Half & Half', desc: 'Cheese and sausage mix' },
        ]
      }
    ]
  },
  { 
    name: 'Puff & Cream', 
    icon: <span className="text-xs font-bold">🍝</span>, 
    image: '/puff_cream.jpeg',
    groups: [
      {
        groupTitle: 'Combos',
        items: [
          { label: 'Puff Puff Box', desc: 'Golden sweet dough balls' },
          { label: 'Whipped Cream Topping', desc: 'Sweet cream dip' },
        ]
      }
    ]
  },
  { 
    name: 'Milky Doughnut', 
    icon: <Drumstick className="w-4 h-4" />, 
    image: '/milky_d.jpg.webp',
    groups: [
      {
        groupTitle: 'Types',
        items: [
          { label: 'Milky Cream Filled', desc: 'Rich milk center' },
          { label: 'Glazed Milky Ring', desc: 'Soft & fluffy' },
        ]
      }
    ]
  },
  { 
    name: 'Fresh Juice', 
    icon: <Pizza className="w-4 h-4" />, 
    image: '/fresh_juice.png',
    groups: [
      {
        groupTitle: 'Flavors',
        items: [
          { label: 'Pineapple & Ginger', desc: '100% natural blend' },
          { label: 'Watermelon Burst', desc: 'Hydrating fresh juice' },
          { label: 'Citrus Blast', desc: 'Orange & passionfruit' },
        ]
      }
    ]
  },
  { 
    name: 'Zobo', 
    icon: <span className="text-xs font-bold">🍷</span>, 
    image: '/zobo.jpeg',
    groups: [
      {
        groupTitle: 'Brew Styles',
        items: [
          { label: 'Classic Hibiscus Zobo', desc: 'Brewed with natural spices' },
          { label: 'Pineapple Infused Zobo', desc: 'Sweet fruity blend' },
        ]
      }
    ]
  },
  { 
    name: 'Food Kombos', 
    icon: <Drumstick className="w-4 h-4" />, 
    image: '/kombos.jpeg',
    groups: [
      {
        groupTitle: 'Packs',
        items: [
          { label: 'Family Feast Combo', desc: 'Meals + drinks for 4' },
          { label: 'Solo Snack Kombo', desc: 'Shawarma + Fresh Juice' },
          { label: 'Mega Party Pack', desc: 'Variety box' },
        ]
      }
    ]
  },
]

export default function DesktopHomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Mr. Tell AI State
  const [aiQuery, setAiQuery] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [mrTellAnswer, setMrTellAnswer] = useState<{
    message: string
    action?: string
    questionType?: string
  } | null>(null)
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [activeHoverCategory, setActiveHoverCategory] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [customSubmitted, setCustomSubmitted] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
      filterData(search, selectedCategory, products)
    }
  }, [searchParams])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .neq('category', 'Cakes')
        .order('created_at', { ascending: false })

      if (error) throw error

      const productList = (data || []).filter(
        p => p.category?.toLowerCase() !== 'cakes' && !p.name?.toLowerCase().includes('cake')
      )

      setProducts(productList)
      filterData(searchQuery, selectedCategory, productList)
    } catch (error) {
      console.error('Failed to fetch storefront products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterData = (query: string, category: string, allProducts: Product[]) => {
    let result = [...allProducts]

    if (category !== 'All') {
      result = result.filter(
        (product) => product.category?.toLowerCase() === category.toLowerCase()
      )
    }

    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description?.toLowerCase().includes(lowercaseQuery) ||
          product.category?.toLowerCase().includes(lowercaseQuery)
      )
    }

    setFilteredProducts(result)
  }

  // Mr. Tell AI Search Handler
  const handleAiSmartSearch = async (customPrompt?: string) => {
    const queryToUse = (typeof customPrompt === 'string' ? customPrompt : aiQuery).trim()
    if (!queryToUse) return

    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current)
    }

    try {
      setAiSearching(true)
      setMrTellAnswer(null)

      const res = await fetch('/api/ai/store-order-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToUse }),
      })

      const data = await res.json()
      if (!res.ok || !data.result) {
        throw new Error(data.error || 'Unable to retrieve answer from knowledge base.')
      }

      const result = data.result
      setMrTellAnswer({
        message: result.summaryMessage,
        action: result.action,
        questionType: result.questionType,
      })

      setAiQuery('')

      // 20-Second auto dismiss timer
      autoDismissTimerRef.current = setTimeout(() => {
        setMrTellAnswer(null)
      }, 20000)

      // Catalog Filtering
      if (result.matchedProductIds && result.matchedProductIds.length > 0) {
        const matched = products.filter((p) => result.matchedProductIds.includes(p.id))
        if (matched.length > 0) {
          setFilteredProducts(matched)
          setSelectedCategory('All')
        } else {
          setFilteredProducts(products)
        }
      } else if (result.action === 'filter' && result.keywordFilter) {
        filterData(result.keywordFilter, 'All', products)
      } else {
        setFilteredProducts(products)
      }

      scrollToMenu()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not process query.'
      setMrTellAnswer({
        message: `I encountered an issue retrieving the latest information: "${errorMsg}". Please feel free to search our menu items below or chat with us on WhatsApp!`,
        action: 'general',
      })
      setAiQuery('')
      setFilteredProducts(products)
      scrollToMenu()
    } finally {
      setAiSearching(false)
    }
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    filterData(query, selectedCategory, products)
  }

  const handleCategorySelect = (categoryName: string, subCategoryItem?: string) => {
    if (categoryName.toLowerCase() === 'cakes') {
      router.push('/cakes')
      setActiveHoverCategory(null)
      return
    }

    setSelectedCategory(categoryName)
    const activeSearch = subCategoryItem || searchQuery
    if (subCategoryItem) {
      setSearchQuery(subCategoryItem)
    }
    filterData(activeSearch, categoryName, products)
    setActiveHoverCategory(null)
  }

  const handleMouseEnter = (catName: string) => {
    const elem = buttonRefs.current[catName]
    if (elem) {
      const rect = elem.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 340)
      })
    }
    setActiveHoverCategory(catName)
  }

  const handleMouseLeave = () => {
    setActiveHoverCategory(null)
  }

  const handleCustomSubmit = (categoryName: string) => {
    const note = customInputs[categoryName]
    if (!note || !note.trim()) return

    setCustomSubmitted({ ...customSubmitted, [categoryName]: true })
    setTimeout(() => {
      setCustomSubmitted((prev) => ({ ...prev, [categoryName]: false }))
    }, 3000)

    handleCategorySelect(categoryName, note)
    scrollToMenu()
  }

  const handleViewDetails = (productId: string) => {
    setSelectedProductId(productId)
    setShowModal(true)
  }

  const scrollToMenu = () => {
    const element = document.getElementById('our-menu-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const dismissMrTellAnswer = () => {
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current)
    setMrTellAnswer(null)
  }

  const activeCategoryConfig = CATEGORIES.find((c) => c.name === activeHoverCategory)

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
      <StorefrontHeader />

      {/* ========================================================================= */}
      {/* 1. MR. TELL DESKTOP AI CONCIERGE & KNOWLEDGE SEARCH BAR                   */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-[#041a11] via-[#072d1d] to-[#041a11] border-b border-[#EAA823]/30 py-3 text-white relative z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-[#EAA823] text-[#072d1d] flex items-center justify-center font-black shadow-md">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#EAA823] uppercase tracking-wider">
                  Mr. Tell AI Concierge
                </h4>
                <p className="text-[10px] text-emerald-200/80">
                  Ask opening hours, pickup locations, food advice, and dinner ideas
                </p>
              </div>
            </div>

            {/* Smart Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAiSmartSearch()
              }}
              className="relative flex items-center w-full lg:max-w-xl"
            >
              <div className="absolute left-3.5 flex items-center pointer-events-none text-[#EAA823]">
                {aiSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#EAA823]" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask Mr. Tell anything (e.g. 'Where is pickup?', 'Best dinner meals?')..."
                className="w-full bg-[#0a3a26] text-white placeholder-emerald-200/60 text-xs sm:text-sm pl-10 pr-24 py-2.5 rounded-xl border border-emerald-500/30 focus:border-[#EAA823] focus:ring-1 focus:ring-[#EAA823] outline-none shadow-inner transition"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                {aiQuery && (
                  <button
                    type="button"
                    onClick={() => setAiQuery('')}
                    className="p-1.5 text-gray-400 hover:text-white rounded-full transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={aiSearching || !aiQuery.trim()}
                  className="bg-[#EAA823] hover:bg-white text-[#072d1d] text-xs font-black px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span>Ask Mr. Tell</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick AI Action Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] pt-1">
            <span className="text-[#EAA823] font-bold flex-shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Trending Prompts:</span>
            </span>
            <button
              type="button"
              onClick={() => handleAiSmartSearch('Where are your pickup locations and delivery points in Port Harcourt?')}
              className="bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-1 rounded-full border border-white/10 flex-shrink-0 cursor-pointer whitespace-nowrap transition flex items-center gap-1"
            >
              <Truck className="w-3 h-3 text-[#EAA823]" />
              <span>Pickup &amp; Delivery Locations</span>
            </button>
            <button
              type="button"
              onClick={() => handleAiSmartSearch('When do you open and close?')}
              className="bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-1 rounded-full border border-white/10 flex-shrink-0 cursor-pointer whitespace-nowrap transition flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-[#EAA823]" />
              <span>Opening Hours</span>
            </button>
            <button
              type="button"
              onClick={() => handleAiSmartSearch('What is your best meal recommendation for dinner tonight?')}
              className="bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-1 rounded-full border border-white/10 flex-shrink-0 cursor-pointer whitespace-nowrap transition"
            >
              🍲 Dinner Recommendations
            </button>
            <button
              type="button"
              onClick={() => handleAiSmartSearch('What are the health benefits of Zobo and ginger?')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30 flex-shrink-0 cursor-pointer whitespace-nowrap transition"
            >
              🍷 Health Benefits of Zobo
            </button>
          </div>

        </div>
      </section>

      {/* 2. 10-DAY WAITLIST COUNTDOWN BANNER */}
      <WaitlistCountdownSection />

      {/* 3. Hero Section */}
      <section className="relative overflow-hidden bg-[#0A2E1D] text-white pt-8 pb-16 lg:pb-24 rounded-b-[40px] md:rounded-b-[60px]">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#12422C] text-[#EAA823] px-4 py-2 rounded-full border border-[#EAA823]/20 text-sm font-semibold">
                <Truck className="w-4 h-4 text-[#EAA823]" />
                <span>Fast Delivery Across Port Harcourt</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Fastest <br />
                <span className="text-[#EAA823]">Delivery</span> & <br />
                Easy <span className="text-[#EAA823]">Pickup.</span>
              </h1>

              <p className="text-gray-300 text-lg max-w-lg leading-relaxed">
                Explore our full culinary menu during the 10-day launch countdown. Join the VIP waitlist for exclusive opening vouchers.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button 
                  onClick={scrollToMenu} 
                  className="bg-[#0A2E1D] border-2 border-[#EAA823] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] px-8 py-6 rounded-full font-bold text-base flex items-center gap-3 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  Explore Food Menu
                  <span className="bg-[#EAA823] text-[#0A2E1D] p-1.5 rounded-full">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>

                <Button 
                  onClick={() => router.push('/cakes')}
                  variant="outline"
                  className="bg-white text-[#0A2E1D] hover:bg-gray-100 border-none px-8 py-6 rounded-full font-bold text-base flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Cake className="w-5 h-5 text-[#EAA823]" />
                  Cakes Collection
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#12422C] rounded-full text-[#EAA823]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-200">Lightning Fast Delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#12422C] rounded-full text-[#EAA823]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-200">Safe & Secure Payments</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#12422C] rounded-full text-[#EAA823]">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-200">24/7 Customer Support</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <div className="relative w-full max-w-lg aspect-square">
                <div className="absolute inset-0 bg-[#EAA823] rounded-full opacity-20 filter blur-3xl transform scale-90" />
                <div className="absolute inset-4 border-2 border-dashed border-[#EAA823]/40 rounded-full animate-spin-slow" />
                <img 
                  src="/images/hero-delivery.png" 
                  alt="De-echoi Delivery Rider" 
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src = '/mobile_bike.png'
                  }}
                />

                <div className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-xl border-2 border-[#EAA823] z-20 hover:scale-110 transition-transform">
                  <img src="/Recipe2.jpg" alt="Dish" className="w-20 h-20 rounded-full object-cover" />
                </div>
                <div className="absolute top-1/3 -left-6 bg-white p-2 rounded-full shadow-xl border-2 border-[#EAA823] z-20 hover:scale-110 transition-transform">
                  <img src="/shawarma.jpeg" alt="Shawarma" className="w-16 h-16 rounded-full object-cover" />
                </div>
                <div className="absolute -bottom-2 left-12 bg-white p-2 rounded-full shadow-xl border-2 border-[#EAA823] z-20 hover:scale-110 transition-transform cursor-pointer" onClick={() => router.push('/cakes')}>
                  <img src="/cakes.jpg" alt="Cakes" className="w-16 h-16 rounded-full object-cover" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Feature Ribbon Bar */}
      <section className="bg-[#072215] text-white py-4 border-y border-[#EAA823]/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-[#EAA823]">
            <Heart className="w-5 h-5 fill-[#EAA823]" />
            <span className="text-white font-semibold">Good Food. Great Experience. <span className="text-[#EAA823]">Better Together.</span></span>
          </div>
          <div className="flex items-center gap-8 text-gray-300">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#EAA823]" />
              <span>Fresh Ingredients</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#EAA823]" />
              <span>Hygienic Preparation</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#EAA823]" />
              <span>On-time Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Category Navigation Bar */}
      <section className="py-6 bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">

            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0A2E1D]">Browse Categories</h3>
                <p className="text-xs text-gray-500">Explore our preview menu options</p>
              </div>

              <div className="relative w-full md:w-72 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search meals, dishes..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:border-[#0A2E1D] text-sm"
                />
              </div>
            </div>

            <div className="w-full max-w-full overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="flex items-center gap-2 min-w-max pr-6">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  const hasGroups = cat.groups && cat.groups.length > 0
                  const isHovered = activeHoverCategory === cat.name

                  return (
                    <div
                      key={cat.name}
                      ref={(el) => {
                        buttonRefs.current[cat.name] = el
                      }}
                      className="relative"
                      onMouseEnter={() => handleMouseEnter(cat.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                          cat.isCakeRoute 
                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                            : isSelected || isHovered
                            ? 'bg-[#0A2E1D] text-[#EAA823] border-[#0A2E1D] shadow-md'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {cat.image ? (
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300 flex-shrink-0">
                            <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <span className={`p-1 rounded-full flex-shrink-0 ${isSelected || isHovered ? 'bg-[#EAA823] text-[#0A2E1D]' : 'bg-gray-200 text-gray-600'}`}>
                            {cat.icon}
                          </span>
                        )}
                        <span>{cat.name}</span>
                        {cat.isCakeRoute && (
                          <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full">Dedicated Page</span>
                        )}
                        {hasGroups && (
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${isHovered ? 'rotate-180 text-[#EAA823]' : 'text-gray-400'}`} />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Global Mega Menu Dropdown */}
        {activeCategoryConfig?.groups && activeCategoryConfig.groups.length > 0 && dropdownPosition && (
          <div
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
            className="z-[9999] min-w-[280px] sm:min-w-[320px] max-w-[90vw] animate-in fade-in slide-in-from-top-2 duration-200"
            onMouseEnter={() => setActiveHoverCategory(activeCategoryConfig.name)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="bg-[#0A2E1D] text-white rounded-2xl shadow-2xl border border-[#EAA823]/30 p-4 space-y-4 whitespace-normal">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#EAA823] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {activeCategoryConfig.name} Options
                </span>
                <span className="text-[10px] text-gray-400">Select option</span>
              </div>

              {activeCategoryConfig.groups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-2">
                  {group.groupTitle && (
                    <p className="text-xs font-semibold text-gray-300">{group.groupTitle}</p>
                  )}
                  <div className="grid grid-cols-1 gap-1">
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx}>
                        {!item.isCustom ? (
                          <button
                            onClick={() => handleCategorySelect(activeCategoryConfig.name, item.label)}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#12422C] transition-colors flex flex-col group/item cursor-pointer"
                          >
                            <span className="text-xs font-bold text-white group-hover/item:text-[#EAA823] transition-colors">
                              {item.label}
                            </span>
                            {item.desc && (
                              <span className="text-[10px] text-gray-400">{item.desc}</span>
                            )}
                          </button>
                        ) : (
                          <div className="p-3 bg-[#12422C] rounded-xl border border-[#EAA823]/30 mt-1 space-y-2">
                            <div>
                              <span className="text-xs font-bold text-[#EAA823] block">{item.label}</span>
                              <span className="text-[10px] text-gray-300">{item.desc}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="text"
                                placeholder="e.g. Extra protein, special instructions..."
                                value={customInputs[activeCategoryConfig.name] || ''}
                                onChange={(e) => setCustomInputs({ ...customInputs, [activeCategoryConfig.name]: e.target.value })}
                                className="bg-[#0A2E1D] border-[#EAA823]/30 text-white placeholder:text-gray-500 text-xs py-1 px-2.5 h-8 rounded-lg focus-visible:ring-[#EAA823]"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleCustomSubmit(activeCategoryConfig.name)}
                                className="bg-[#EAA823] text-[#0A2E1D] hover:bg-white h-8 px-2.5 rounded-lg text-xs font-bold flex-shrink-0 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 6. Customer Reviews Section */}
      <section className="py-8 bg-[#FDFBF7] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CustomerReviewsSection />
        </div>
      </section>

      {/* 7. Food Menu Listing & Dynamic Mr. Tell Answer Box */}
      <section className="py-16 scroll-mt-24" id="our-menu-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* DYNAMIC MR. TELL 20-SECOND ANSWER BOX (Desktop) */}
          {mrTellAnswer && (
            <div className="relative overflow-hidden bg-gradient-to-br from-[#072d1d] via-[#0a3a26] to-[#041a11] text-white p-6 rounded-3xl border-2 border-[#EAA823]/50 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
              
              {/* Countdown Expiry Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#EAA823] to-amber-300"
                  style={{ animation: 'shrink 20s linear forwards' }}
                />
              </div>

              {/* Header Badge */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EAA823] text-[#072d1d] flex items-center justify-center font-black shadow-md">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#EAA823] uppercase tracking-wider">
                      Mr. Tell&apos;s Response
                    </h3>
                    <p className="text-xs text-emerald-200/70">
                      Live Store Knowledge &bull; Auto-dismisses in 20s
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={dismissMrTellAnswer}
                  className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close answer box"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Payload */}
              <div className="bg-black/30 rounded-2xl p-4 border border-white/10 text-sm text-emerald-50 leading-relaxed whitespace-pre-line font-medium">
                {mrTellAnswer.message}
              </div>

              {/* Contextual Action Directives */}
              {mrTellAnswer.action === 'chat_order' && (
                <Link href="/my-messages" className="inline-block pt-1">
                  <Button className="bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-md">
                    <MessageCircle className="w-4 h-4" />
                    <span>Open Custom Order &amp; Invoice Chat</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}

              {mrTellAnswer.action === 'checkout' && (
                <Link href="/cart" className="inline-block pt-1">
                  <Button className="bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-md">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Proceed to Cart &amp; Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Food Menu Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-gray-200">
            <div>
              <span className="text-[#EAA823] font-bold text-sm tracking-wider uppercase">Preview Catalog</span>
              <h2 className="text-4xl font-extrabold text-[#0A2E1D] mt-1">
                Our Food Menu
              </h2>
            </div>
            <p className="text-gray-500 font-medium mt-2 md:mt-0">
              Showing <span className="text-[#0A2E1D] font-bold">{filteredProducts.length}</span> item{filteredProducts.length !== 1 ? 's' : ''} {selectedCategory !== 'All' ? `in ${selectedCategory}` : ''}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-[#0A2E1D] border-t-[#EAA823] rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">Preparing delicious preview menu...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500 text-lg font-medium">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No meals matching your selected category filters.'
                  : 'No food products available at the moment.'}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-full border-[#0A2E1D] text-[#0A2E1D] hover:bg-[#0A2E1D] hover:text-white font-bold cursor-pointer"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All')
                    filterData('', 'All', products)
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description || ''}
                  price={Number(product.price)}
                  imageUrl={product.image_url ?? undefined}
                  inStock={product.in_stock}
                  category={product.category}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8. Special Cake Collection Promo Banner */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0A2E1D] via-[#12422C] to-[#0A2E1D] rounded-3xl p-8 sm:p-12 text-white border-2 border-[#EAA823]/30 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#EAA823]/20 border border-[#EAA823]/40 text-[#EAA823] text-xs font-bold px-3 py-1 rounded-full">
                <Cake className="w-4 h-4" />
                Celebration Bakes
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold">Looking for Custom Cakes?</h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Explore our dedicated Cakes Collection featuring 6&quot; and 7&quot; tiered cakes, multi-flavor combinations, and our interactive event booking assistant.
              </p>
            </div>

            <Button
              onClick={() => router.push('/cakes')}
              className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-extrabold px-8 py-6 rounded-full text-base shadow-xl flex items-center gap-2 cursor-pointer"
            >
              Explore Cakes Collection
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Auto-dismiss countdown bar keyframes */}
      <style jsx global>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}