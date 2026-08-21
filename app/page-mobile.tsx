'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StorefrontHeader } from '@/components/storefront/header'
import { CustomerReviewsSection } from '@/components/storefront/customer-reviews'
import { WaitlistCountdownSection } from '@/components/storefront/waitlist-hero'
import { EventPromoModal } from '@/components/storefront/event-promo-modal'
import { 
  ArrowRight, 
  Zap, 
  ChevronRight,
  Utensils,
  Pizza,
  Drumstick,
  Navigation,
  MapPin,
  Cake,
  Share2,
  X,
  MessageCircle,
  Instagram,
  Facebook,
  Phone,
  Sparkles,
  Loader2,
  ShoppingBag,
  ArrowUpRight,
  Clock,
  HelpCircle,
  Truck
} from 'lucide-react'

import { ProductCard } from '@/components/storefront/product-card'
import { ProductDetailModal } from '@/components/storefront/product-detail-modal'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
  category: string
}

const HERO_IMAGES = [
  { src: '/mobile_bike.png', alt: 'Delivery Rider' },
  { src: '/deechoi_brand.png', alt: 'Fresh Delicious Meals' },
  { src: '/web_bike.png', alt: 'Tasty Gourmet Burger' }
]

const SOCIAL_HANDLES = [
  {
    name: 'WhatsApp',
    href: 'https://wa.me/2347031385337',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/deechoi01',
    icon: <Instagram className="w-5 h-5" />,
    color: 'bg-pink-600 hover:bg-pink-700 text-white',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@deechoi01',
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.81V7.65a6.34 6.34 0 0 0-1 .08 6.34 6.34 0 1 0 7.34 6.27V9.07a8.28 8.28 0 0 0 4.77 1.52v-3.9a4.85 4.85 0 0 1-1-.00z" />
      </svg>
    ),
    color: 'bg-slate-900 hover:bg-black text-white',
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/deechoiltd',
    icon: <Facebook className="w-5 h-5" />,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    name: 'Call Us',
    href: 'tel:+2347031385337',
    icon: <Phone className="w-4 h-4" />,
    color: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
]

export default function MobileHomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const [isSocialOpen, setIsSocialOpen] = useState(false)

  // Mr. Tell AI State
  const [aiSearching, setAiSearching] = useState(false)
  const [mrTellAnswer, setMrTellAnswer] = useState<{
    message: string
    action?: string
    questionType?: string
  } | null>(null)

  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
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
      handleManualFilter(search)
    }
  }, [searchParams])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .neq('category', 'Cakes')
        .order('created_at', { ascending: false })

      if (error) throw error

      const mealList = (data || []).filter(
        (p) => p.category?.toLowerCase() !== 'cakes' && !p.name?.toLowerCase().includes('cake')
      )

      setProducts(mealList)
      setFilteredProducts(mealList)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualFilter = (categoryOrKeyword: string) => {
    if (!categoryOrKeyword || !categoryOrKeyword.trim()) {
      setFilteredProducts(products)
      setActiveFilterLabel(null)
      return
    }

    const raw = categoryOrKeyword.toLowerCase().trim()

    const categoryDictionary: Record<string, string[]> = {
      'meals': ['meal', 'rice', 'soup', 'stew', 'catfish', 'pepper soup', 'jollof', 'fried rice', 'chicken'],
      'rice': ['rice', 'jollof', 'fried rice', 'smokey jollof', 'grain', 'meal'],
      'jollof rice': ['jollof', 'rice', 'smokey jollof'],
      'fried rice': ['fried rice', 'rice'],
      'parfait': ['parfait', 'yogurt', 'fruit parfait', 'dessert', 'cakeloaf', 'loaf', 'granola'],
      'cakeloaf': ['cakeloaf', 'loaf', 'mini cake', 'mini cakeloaf'],
      'shawarma': ['shawarma', 'wrap', 'roll', 'sausage', 'beef shawarma', 'chicken shawarma'],
      'pasta': ['pasta', 'spaghetti', 'macaroni', 'alfredo', 'bolognese', 'seafood pasta'],
      'noodles': ['noodle', 'noodles', 'indomie', 'pasta', 'stir fry', 'spiced noodles', 'stir-fry', 'turkey'],
      'corndogs': ['corndog', 'corn dog', 'hotdog', 'snack', 'cheese corndog', 'sausage corndog'],
      'puff & cream': ['puff', 'cream', 'doughnut', 'donut', 'pastry', 'snack', 'puff puff'],
      'milky doughnut': ['milky', 'doughnut', 'donut', 'glazed', 'pastry', 'sweet', 'ring'],
      'fresh juice': ['juice', 'drink', 'beverage', 'citrus', 'fruit', 'pineapple', 'watermelon', 'fresh'],
      'zobo': ['zobo', 'hibiscus', 'ginger', 'drink', 'beverage', 'juice'],
      'food kombos': ['kombo', 'combo', 'pack', 'set', 'meal', 'feast', 'party pack', 'box'],
    }

    const keywords = categoryDictionary[raw] || [raw]

    const matched = products.filter((product) => {
      const pName = (product.name || '').toLowerCase()
      const pDesc = (product.description || '').toLowerCase()
      const pCat = (product.category || '').toLowerCase()

      return keywords.some(kw => 
        pName.includes(kw) || 
        pDesc.includes(kw) || 
        pCat.includes(kw) ||
        pCat === raw
      )
    })

    setFilteredProducts(matched.length > 0 ? matched : products)
    setActiveFilterLabel(categoryOrKeyword)
  }

  const handleAiSmartSearch = async (customPrompt?: string) => {
    const queryToUse = (typeof customPrompt === 'string' ? customPrompt : searchQuery).trim()
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
        throw new Error(data.error || 'Failed to generate response.')
      }

      const result = data.result

      setMrTellAnswer({
        message: result.summaryMessage,
        action: result.action,
        questionType: result.questionType,
      })

      setSearchQuery('')

      autoDismissTimerRef.current = setTimeout(() => {
        setMrTellAnswer(null)
      }, 20000)

      if (result.matchedProductIds && result.matchedProductIds.length > 0) {
        const matched = products.filter((p) => result.matchedProductIds.includes(p.id))
        if (matched.length > 0) {
          setFilteredProducts(matched)
          setActiveFilterLabel(queryToUse)
        } else {
          setFilteredProducts(products)
          setActiveFilterLabel(null)
        }
      } else if (result.action === 'filter' && result.keywordFilter) {
        handleManualFilter(result.keywordFilter)
      } else {
        setFilteredProducts(products)
        setActiveFilterLabel(null)
      }

      scrollToMenu()
    } catch (err: unknown) {
      console.warn('[AI Search Notice]:', err)
      setMrTellAnswer({
        message: `I'm happy to help! De-echoi is located at Eze Nvuigwe Avenue, Woji, Port Harcourt. We deliver freshly cooked Smokey Jollof & Fried Rice, Catfish Pepper Soup, Parfaits, Shawarma, and Celebration Cakes across Port Harcourt.`,
        action: 'general',
      })
      setSearchQuery('')
      setFilteredProducts(products)
      setActiveFilterLabel(null)
      scrollToMenu()
    } finally {
      setAiSearching(false)
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName.toLowerCase() === 'cakes') {
      router.push('/cakes')
    } else {
      handleManualFilter(categoryName)
      scrollToMenu()
    }
  }

  const handleViewDetails = (productId: string) => {
    setSelectedProductId(productId)
    setShowModal(true)
  }

  const scrollToMenu = () => {
    setTimeout(() => {
      const menuElement = document.getElementById('our-menu-section')
      if (menuElement) {
        menuElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const dismissMrTellAnswer = () => {
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current)
    setMrTellAnswer(null)
  }

  const clearFilter = () => {
    setFilteredProducts(products)
    setActiveFilterLabel(null)
  }

  const categories = [
    { name: 'Rice', icon: <span className="text-xs font-bold">🍚</span>, image: '/jollof.jpeg' },
    { name: 'Parfait', icon: <span className="text-xs font-bold">🍓</span>, image: '/parfait.jpeg' },
    { name: 'Meals', icon: <Utensils className="w-4 h-4" />, image: '/Recipe2.jpg' },
    { name: 'Cakes', icon: <Cake className="w-4 h-4 text-amber-400" />, image: '/cakes.jpg' },
    { name: 'Shawarma', icon: <span className="text-xs font-bold">🫔</span>, image: '/shawarma.jpeg' },
    { name: 'Pasta', icon: <span className="text-xs font-bold">🍝</span>, image: '/pasta.jpeg' },
    { name: 'Noodles', icon: <Drumstick className="w-4 h-4" />, image: '/noodles.jpeg' },
    { name: 'Corndogs', icon: <Pizza className="w-4 h-4" />, image: '/corndog.webp' },
    { name: 'Puff & Cream', icon: <span className="text-xs font-bold">🍩</span>, image: '/puff_cream.jpeg' },
    { name: 'Milky Doughnut', icon: <Drumstick className="w-4 h-4" />, image: '/milky_d.jpg.webp' },
    { name: 'Fresh Juice', icon: <Pizza className="w-4 h-4" />, image: '/fresh_juice.png' },
    { name: 'Zobo', icon: <span className="text-xs font-bold">🍷</span>, image: '/zobo.jpeg' },
    { name: 'Food Kombos', icon: <Drumstick className="w-4 h-4" />, image: '/kombos.jpeg' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">

      {/* PROMOTIONAL & CELEBRATION POPUP MODAL */}
      <EventPromoModal />

      {/* 1. STICKY TOP APP HEADER & MR. TELL SMART SEARCH */}
      <div className="sticky top-0 z-40 w-full bg-[#072d1d] shadow-md border-b border-[#EAA823]/25">
        <StorefrontHeader />

        <div className="w-full bg-gradient-to-b from-[#072d1d] to-[#041a11] px-3.5 pt-2 pb-3.5 relative z-30">
          <div className="max-w-md mx-auto space-y-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAiSmartSearch()
              }}
              className="relative flex items-center w-full z-30 pointer-events-auto"
            >
              <div className="absolute left-3.5 flex items-center pointer-none text-amber-400 z-10">
                {aiSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <input
                ref={searchInputRef}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Ask Mr. Tell (e.g. 'Smokey Jollof', 'Parfait prices', 'Pickup')..."
                className="w-full bg-[#0a3a26] text-white placeholder-emerald-200/60 text-xs sm:text-sm pl-10 pr-24 py-3 rounded-xl border border-emerald-500/40 focus:border-[#EAA823] focus:ring-2 focus:ring-[#EAA823]/30 outline-none shadow-inner transition cursor-text pointer-events-auto z-20"
              />

              <div className="absolute right-1.5 flex items-center gap-1 z-30">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSearchQuery('')
                      searchInputRef.current?.focus()
                    }}
                    className="p-1.5 text-gray-300 hover:text-white rounded-full transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={aiSearching || !searchQuery.trim()}
                  className="bg-[#EAA823] hover:bg-white text-[#072d1d] text-[11px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span>Mr. Tell</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-[10px] relative z-20">
              <span className="text-amber-400 font-bold flex-shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Ask:</span>
              </span>
              <button
                type="button"
                onClick={() => handleAiSmartSearch('Tell me about your Smokey Jollof and Fried Rice options')}
                className="bg-white/10 hover:bg-white/20 text-emerald-100 px-2.5 py-1 rounded-full border border-white/10 flex-shrink-0 cursor-pointer whitespace-nowrap transition active:scale-95"
              >
                🍚 Jollof &amp; Fried Rice
              </button>
              <button
                type="button"
                onClick={() => handleAiSmartSearch('What parfait flavors and mini cakeloaves do you have?')}
                className="bg-white/10 hover:bg-white/20 text-emerald-100 px-2.5 py-1 rounded-full border border-white/10 flex-shrink-0 cursor-pointer whitespace-nowrap transition active:scale-95"
              >
                🍓 Parfaits &amp; Cakeloaf
              </button>
              <button
                type="button"
                onClick={() => handleAiSmartSearch('Where are your pickup locations and delivery points in Port Harcourt?')}
                className="bg-white/10 hover:bg-white/20 text-emerald-100 px-2.5 py-1 rounded-full border border-white/10 flex-shrink-0 cursor-pointer whitespace-nowrap transition flex items-center gap-1 active:scale-95"
              >
                <Truck className="w-2.5 h-2.5 text-amber-400" />
                <span>Pickup &amp; Delivery Hubs</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiSmartSearch('When do you open and close?')}
                className="bg-white/10 hover:bg-white/20 text-emerald-100 px-2.5 py-1 rounded-full border border-white/10 flex-shrink-0 cursor-pointer whitespace-nowrap transition flex items-center gap-1 active:scale-95"
              >
                <Clock className="w-2.5 h-2.5 text-amber-400" />
                <span>Opening Hours</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiSmartSearch('Tell me the health benefits of Hibiscus Zobo and ginger')}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/30 flex-shrink-0 cursor-pointer whitespace-nowrap transition flex items-center gap-1 active:scale-95"
              >
                <HelpCircle className="w-2.5 h-2.5" />
                <span>Zobo Health Benefits</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP BRAND HERO */}
      <div className="bg-[#072d1d]">
        <WaitlistCountdownSection />

        <section className="relative px-5 pt-4 pb-4 max-w-md mx-auto overflow-hidden min-h-[220px]">
          <div className="relative z-10 space-y-3 max-w-[60%]">
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              Good Food. <br />
              <span className="text-amber-500">Great Experience.</span> <br />
              Delivered to <br />
              <span className="font-serif italic font-normal underline decoration-amber-500">You.</span>
            </h1>
            <p className="text-xs text-emerald-100/80 leading-relaxed pr-2">
              Explore our delicious menu during the launch preview. Enjoy swift delivery across Port Harcourt.
            </p>
          </div>

          <div className="absolute right-[-15px] top-0 w-[58%] h-full pointer-events-none">
            {HERO_IMAGES.map((item, index) => (
              <div
                key={item.src}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  index === currentHeroIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <Image 
                  src={item.src} 
                  alt={item.alt} 
                  fill
                  className="object-contain object-right"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 bg-[#0a3a26]/90 border border-emerald-600/30 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 w-fit ml-auto shadow-lg relative z-10">
            <div className="bg-amber-500 p-1.5 rounded-lg text-[#072d1d]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-400 leading-none">Fast Delivery</p>
              <p className="text-[9px] text-white/80">At Your Doorstep</p>
            </div>
          </div>
        </section>
      </div>

      {/* 3. MAIN BODY & POPULAR CATEGORIES */}
      <main className="bg-slate-50 pt-5 px-4 pb-32 space-y-6 max-w-md mx-auto min-h-screen relative z-10 shadow-sm">

        {/* Popular Categories */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-900">Popular Categories</h2>
            <button 
              onClick={scrollToMenu}
              className="text-xs font-semibold text-amber-600 flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
            {categories.map((cat, idx) => (
              <button 
                key={idx} 
                type="button"
                onClick={() => handleCategoryClick(cat.name)}
                className="flex-shrink-0 flex flex-col items-center focus:outline-none group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="relative w-20 h-24 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 bg-white">
                  <Image 
                    src={cat.image} 
                    alt={cat.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <div className="bg-[#072d1d] text-white p-1.5 rounded-full shadow-md">
                      {cat.icon}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-800 mt-2 flex items-center gap-1">
                  {cat.name}
                  {cat.name === 'Cakes' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Live Route Tracking Card */}
        <section className="bg-gradient-to-br from-[#072d1d] via-[#0a3a26] to-[#041a11] rounded-3xl p-4 text-white relative overflow-hidden shadow-xl border border-emerald-600/30">
          <div className="grid grid-cols-12 gap-3 items-center relative z-10">
            <div className="col-span-6 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[9px] uppercase px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                <Navigation className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Live Route Tracking</span>
              </div>

              <h3 className="text-sm font-extrabold leading-snug tracking-tight text-white">
                Live Order <br />
                <span className="text-amber-400 italic">Fast Pickup &amp; Delivery</span>
              </h3>

              <p className="text-[10px] text-emerald-100/80 leading-relaxed font-medium">
                Track your order in real-time from our kitchen directly to your doorstep.
              </p>

              <button 
                onClick={scrollToMenu}
                className="mt-1 bg-amber-500 hover:bg-amber-400 text-[#072d1d] text-[11px] font-bold py-2 px-3.5 rounded-full flex items-center gap-1.5 shadow-md transition active:scale-95 group cursor-pointer"
              >
                Browse Menu
                <span className="bg-[#072d1d] text-amber-400 rounded-full p-0.5 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </button>
            </div>

            <div className="col-span-6 relative flex justify-end">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl group bg-[#041a11]">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-2xl scale-105 filter brightness-105 contrast-105"
                >
                  <source src="/pickup.mp4" type="video/mp4" />
                </video>

                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-[#072d1d]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/40 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <MapPin className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-[8px] font-bold text-emerald-100">Woji Delivery Hub</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Cakes Feature */}
        <section 
          onClick={() => router.push('/cakes')}
          className="bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] rounded-2xl p-4 text-white border border-amber-400/30 shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition"
        >
          <div className="space-y-1">
            <span className="bg-amber-500 text-[#072d1d] font-bold text-[9px] px-2 py-0.5 rounded-full">
              Bespoke Bakes
            </span>
            <h4 className="text-sm font-extrabold text-white">Looking for Cakes?</h4>
            <p className="text-[10px] text-emerald-100/80">Customize 6&quot; &amp; 7&quot; tiered flavors on our dedicated Cake page.</p>
          </div>
          <div className="bg-amber-500 text-[#072d1d] p-2.5 rounded-full">
            <Cake className="w-5 h-5" />
          </div>
        </section>

        {/* Customer Reviews */}
        <CustomerReviewsSection />

        {/* 4. MENU & DYNAMIC MR. TELL INTELLIGENCE CARD */}
        <section id="our-menu-section" className="pt-4 scroll-mt-52 space-y-4">
          
          {mrTellAnswer && (
            <div className="relative overflow-hidden bg-gradient-to-br from-[#072d1d] via-[#0a3a26] to-[#041a11] text-white p-4 sm:p-5 rounded-3xl border-2 border-amber-400/50 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
              
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-[#EAA823]"
                  style={{ animation: 'shrink 20s linear forwards' }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-400 text-[#072d1d] flex items-center justify-center font-black shadow-md">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Mr. Tell&apos;s Knowledge &amp; Guidance
                    </h3>
                    <p className="text-[10px] text-emerald-200/70">
                      Live Store Intelligence &bull; De-echoi AI Concierge
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={dismissMrTellAnswer}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close answer box"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-black/30 rounded-2xl p-3.5 border border-white/10 text-xs sm:text-sm text-emerald-50 leading-relaxed whitespace-pre-line font-medium">
                {mrTellAnswer.message}
              </div>

              {mrTellAnswer.action === 'chat_order' && (
                <Link href="/my-messages" className="block pt-1">
                  <Button className="w-full bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                    <MessageCircle className="w-4 h-4" />
                    <span>Open Custom Order &amp; Invoice Chat</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}

              {mrTellAnswer.action === 'checkout' && (
                <Link href="/cart" className="block pt-1">
                  <Button className="w-full bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Proceed to Cart &amp; Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Menu Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Food Menu</h2>
              <p className="text-xs text-slate-500">
                {filteredProducts.length} meal{filteredProducts.length !== 1 ? 's' : ''} available
                {activeFilterLabel && (
                  <span className="text-amber-600 font-semibold ml-1">
                    matching &ldquo;{activeFilterLabel}&rdquo;
                  </span>
                )}
              </p>
            </div>
            {activeFilterLabel && (
              <button 
                onClick={clearFilter}
                className="text-xs text-amber-600 font-medium hover:underline cursor-pointer"
              >
                Show All Menu
              </button>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-xs text-slate-500">Loading catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl p-6 border border-slate-100">
              <p className="text-sm text-slate-600 mb-3">
                {activeFilterLabel
                  ? `No meals found matching "${activeFilterLabel}".`
                  : 'No food products available yet.'}
              </p>
              {activeFilterLabel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilter}
                  className="cursor-pointer"
                >
                  Show Full Menu
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
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
        </section>

      </main>

      {/* Floating Action Social Bar */}
      <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2.5 pointer-events-none">
        <div 
          className={`flex flex-col gap-2.5 items-end transition-all duration-300 ease-in-out pointer-events-auto ${
            isSocialOpen 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        >
          {SOCIAL_HANDLES.map((handle, idx) => (
            <a
              key={handle.name}
              href={handle.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={handle.name}
              style={{ transitionDelay: `${isSocialOpen ? idx * 50 : 0}ms` }}
              className={`group relative flex items-center justify-center w-11 h-11 rounded-full shadow-lg border border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 ${handle.color}`}
            >
              {handle.icon}
              <span className="absolute right-14 bg-slate-900/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md border border-slate-700 pointer-events-none">
                {handle.name}
              </span>
            </a>
          ))}
        </div>

        <button
          onClick={() => setIsSocialOpen(!isSocialOpen)}
          aria-label="Toggle Social Handles"
          className="pointer-events-auto relative flex items-center justify-center w-13 h-13 rounded-full bg-amber-500 hover:bg-amber-400 text-[#072d1d] shadow-xl border-2 border-white transition-transform duration-300 active:scale-90 hover:scale-105 cursor-pointer"
        >
          <div className={`transition-transform duration-300 ${isSocialOpen ? 'rotate-90' : 'rotate-0'}`}>
            {isSocialOpen ? (
              <X className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          {!isSocialOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600 border-2 border-white"></span>
            </span>
          )}
        </button>
      </div>

      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}

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