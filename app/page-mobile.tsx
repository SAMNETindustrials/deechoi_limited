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
  Truck,
  AlertTriangle
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

  // Storefront live vs Pre-Order state
  const [isStoreLive, setIsStoreLive] = useState(true)

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
    const checkStoreStatus = () => {
      const storeStatus = localStorage.getItem('deechoi_storefront_active')
      if (storeStatus !== null) {
        setIsStoreLive(storeStatus === 'true')
      }
    }
    checkStoreStatus()
    window.addEventListener('storage', checkStoreStatus)

    fetchProducts()
    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current)
      window.removeEventListener('storage', checkStoreStatus)
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
      'parfait': ['parfait', 'yogurt', 'fruit parfait', 'dessert', 'cakeloaf', 'loaf', 'granola'],
      'shawarma': ['shawarma', 'wrap', 'roll', 'sausage', 'beef shawarma', 'chicken shawarma'],
      'pasta': ['pasta', 'spaghetti', 'macaroni', 'alfredo', 'bolognese', 'seafood pasta'],
      'noodles': ['noodle', 'noodles', 'indomie', 'pasta', 'stir fry', 'spiced noodles', 'stir-fry', 'turkey'],
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
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">

      <EventPromoModal />

      <div className="sticky top-0 z-40 w-full bg-[#072d1d] shadow-md border-b border-[#EAA823]/25">
        <StorefrontHeader />

        {!isStoreLive && (
          <div className="bg-amber-600 text-white px-4 py-2 text-center text-[11px] font-black uppercase tracking-wider shadow-inner flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            <span>Storefront is in <span className="underline">Pre-Order Mode</span>.</span>
          </div>
        )}

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
                placeholder="Ask Mr. Tell (e.g. 'Smokey Jollof', 'Parfait prices')..."
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
          </div>
        </div>
      </div>

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
        </section>
      </div>

      <main className="bg-slate-50 pt-5 px-4 pb-32 space-y-6 max-w-md mx-auto min-h-screen relative z-10 shadow-sm">

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
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] rounded-2xl p-4 text-white border border-amber-400/30 shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition" onClick={() => router.push('/cakes')}>
          <div className="space-y-1">
            <span className="bg-amber-500 text-[#072d1d] font-bold text-[9px] px-2 py-0.5 rounded-full">Bespoke Bakes</span>
            <h4 className="text-sm font-extrabold text-white">Looking for Cakes?</h4>
            <p className="text-[10px] text-emerald-100/80">Customize 6&quot; &amp; 7&quot; tiered flavors on our dedicated Cake page.</p>
          </div>
          <div className="bg-amber-500 text-[#072d1d] p-2.5 rounded-full"><Cake className="w-5 h-5" /></div>
        </section>

        <CustomerReviewsSection />

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
                    <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">Mr. Tell&apos;s Knowledge</h3>
                  </div>
                </div>

                <button type="button" onClick={dismissMrTellAnswer} className="p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-black/30 rounded-2xl p-3.5 border border-white/10 text-xs sm:text-sm text-emerald-50 leading-relaxed whitespace-pre-line font-medium">
                {mrTellAnswer.message}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Food Menu</h2>
              <p className="text-xs text-slate-500">
                {filteredProducts.length} meal{filteredProducts.length !== 1 ? 's' : ''} available
                {activeFilterLabel && <span className="text-amber-600 font-semibold ml-1">({activeFilterLabel})</span>}
              </p>
            </div>
            {activeFilterLabel && (
              <button onClick={clearFilter} className="text-xs text-amber-600 font-medium hover:underline cursor-pointer">
                Show All
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12"><p className="text-xs text-slate-500">Loading catalog...</p></div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl p-6 border border-slate-100">
              <p className="text-sm text-slate-600 mb-3">No meals found.</p>
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

      <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2.5 pointer-events-none">
        <div className={`flex flex-col gap-2.5 items-end transition-all duration-300 ease-in-out pointer-events-auto ${isSocialOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'}`}>
          {SOCIAL_HANDLES.map((handle, idx) => (
            <a
              key={handle.name}
              href={handle.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative flex items-center justify-center w-11 h-11 rounded-full shadow-lg border border-white/20 transition-all duration-300 hover:scale-110 ${handle.color}`}
            >
              {handle.icon}
            </a>
          ))}
        </div>

        <button
          onClick={() => setIsSocialOpen(!isSocialOpen)}
          className="pointer-events-auto relative flex items-center justify-center w-13 h-13 rounded-full bg-amber-500 hover:bg-amber-400 text-[#072d1d] shadow-xl border-2 border-white transition-transform duration-300 active:scale-90 cursor-pointer"
        >
          <Share2 className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

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