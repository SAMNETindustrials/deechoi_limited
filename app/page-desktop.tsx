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
  Gift
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
    icon: <span className="text-xs font-bold">🍝</span>, 
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

  const [activeHoverCategory, setActiveHoverCategory] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [customSubmitted, setCustomSubmitted] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
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
          product.description?.toLowerCase().includes(lowercaseQuery)
      )
    }

    setFilteredProducts(result)
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

  const activeCategoryConfig = CATEGORIES.find((c) => c.name === activeHoverCategory)

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
      <StorefrontHeader />

      {/* 1. 10-DAY WAITLIST COUNTDOWN BANNER */}
      <WaitlistCountdownSection />

      {/* 2. Hero Section */}
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

      {/* 3. Feature Ribbon Bar */}
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

      {/* 4. Category Navigation Bar */}
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

      {/* 5. Customer Reviews Section (Desktop Mount) */}
      <section className="py-8 bg-[#FDFBF7] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CustomerReviewsSection />
        </div>
      </section>

      {/* 6. Food Menu Listing */}
      <section className="py-16" id="our-menu-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-gray-200">
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

      {/* 7. Special Cake Collection Promo Banner */}
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

      {/* 8. Footer */}
      <footer className="bg-[#051B10] text-white py-16 border-t border-[#12422C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h3 className="font-black text-2xl mb-4 text-[#EAA823] tracking-wide">DEECHOI</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Bringing authentic, fresh, and hygienic culinary delights right to your home with speed and care.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Quick Links</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-[#EAA823] transition-colors">Home</Link></li>
                <li><Link href="/cakes" className="text-[#EAA823] font-bold hover:underline transition-colors">Cakes Collection</Link></li>
                <li><Link href="/about" className="hover:text-[#EAA823] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#EAA823] transition-colors">Contact Us</Link></li>
                <li><Link href="/services" className="hover:text-[#EAA823] transition-colors">Book Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Contact</h4>
              <p className="text-sm text-gray-400 mb-2">
                <a href="mailto:deechoi01@gmail.com" className="hover:text-[#EAA823] transition-colors">
                  deechoi01@gmail.com
                </a>
              </p>
              <p className="text-sm text-gray-400">
                <a href="tel:+2347046145982" className="hover:text-[#EAA823] transition-colors">
                  +234 704 614 5982
                </a>
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Location</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Eze Nvuigwe Avenue, Woji<br />
                Port Harcourt, Rivers State, Nigeria
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 DEECHOI LIMITED. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}