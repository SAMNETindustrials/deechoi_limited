'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StorefrontHeader } from '@/components/storefront/header'
import { CustomerReviewsSection } from '@/components/storefront/customer-reviews'
import { WaitlistCountdownSection } from '@/components/storefront/waitlist-hero'
import { 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Leaf, 
  Headphones, 
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
  Phone
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
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const [isSocialOpen, setIsSocialOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      handleSearch(search)
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredProducts(products)
    } else {
      const lowercaseQuery = query.toLowerCase()
      setFilteredProducts(
        products.filter(
          (product) =>
            product.name.toLowerCase().includes(lowercaseQuery) ||
            product.description?.toLowerCase().includes(lowercaseQuery)
        )
      )
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName.toLowerCase() === 'cakes') {
      router.push('/cakes')
    } else {
      handleSearch(categoryName)
      scrollToMenu()
    }
  }

  const handleViewDetails = (productId: string) => {
    setSelectedProductId(productId)
    setShowModal(true)
  }

  const scrollToMenu = () => {
    const menuElement = document.getElementById('our-menu-section')
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const categories = [
    { name: 'Meals', icon: <Utensils className="w-4 h-4" />, image: '/Recipe2.jpg' },
    { name: 'Cakes', icon: <Cake className="w-4 h-4 text-amber-400" />, image: '/cakes.jpg' },
    { name: 'Shawarma', icon: <span className="text-xs font-bold">🫔</span>, image: '/shawarma.jpeg' },
    { name: 'Pasta', icon: <span className="text-xs font-bold">🍝</span>, image: '/pasta.jpeg' },
    { name: 'Noodles', icon: <Drumstick className="w-4 h-4" />, image: '/noodles.jpeg' },
    { name: 'Corndogs', icon: <Pizza className="w-4 h-4" />, image: '/corndog.webp' },
    { name: 'Puff & Cream', icon: <span className="text-xs font-bold">🍝</span>, image: '/puff_cream.jpeg' },
    { name: 'Milky Doughnut', icon: <Drumstick className="w-4 h-4" />, image: '/milky_d.jpg.webp' },
    { name: 'Fresh Juice', icon: <Pizza className="w-4 h-4" />, image: '/fresh_juice.png' },
    { name: 'Zobo', icon: <span className="text-xs font-bold">🍝</span>, image: '/zobo.jpeg' },
    { name: 'Food Kombos', icon: <Drumstick className="w-4 h-4" />, image: '/kombos.jpeg' },
  ]

  return (
    <div className="min-h-screen bg-[#072d1d] text-slate-800 font-sans pb-12 relative">
      
      {/* 1. STOREFRONT HEADER */}
      <StorefrontHeader />

      {/* 2. 10-DAY WAITLIST COUNTDOWN BANNER */}
      <WaitlistCountdownSection />

      {/* 3. HERO SECTION */}
      <section className="relative px-5 pt-4 pb-4 max-w-md mx-auto overflow-hidden min-h-[220px]">
        <div className="relative z-10 space-y-3 max-w-[60%]">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Good Food. <br />
            <span className="text-amber-500">Great Experience.</span> <br />
            Delivered to <br />
            <span className="font-serif italic font-normal underline decoration-amber-500">You.</span>
          </h1>
          <p className="text-xs text-emerald-100/80 leading-relaxed pr-2">
            Explore our delicious menu during the 10-day launch preview. Join the waitlist for priority access!
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

      {/* 4. MAIN BODY CONTAINER */}
      <main className="bg-slate-50 rounded-t-[32px] pt-6 px-4 space-y-6 max-w-md mx-auto min-h-screen">
        
        {/* Features Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center gap-1.5 border-r border-slate-100 pr-1">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-700 leading-tight">Lightning Fast Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 border-r border-slate-100 pr-1">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-700 leading-tight">Safe & Secure Payments</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 border-r border-slate-100 pr-1">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-700 leading-tight">Fresh Ingredients</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-slate-700 leading-tight">24/7 Support</span>
          </div>
        </div>

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
                onClick={() => handleCategoryClick(cat.name)}
                className="flex-shrink-0 flex flex-col items-center focus:outline-none group cursor-pointer"
              >
                <div className="relative w-20 h-24 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60">
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

        {/* Live Tracking Feature Card */}
        <section className="bg-gradient-to-br from-[#072d1d] via-[#0a3a26] to-[#041a11] rounded-3xl p-4 text-white relative overflow-hidden shadow-xl border border-emerald-600/30">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="grid grid-cols-12 gap-3 items-center relative z-10">
            <div className="col-span-6 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[9px] uppercase px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                <Navigation className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Live Route Tracking</span>
              </div>
              
              <h3 className="text-sm font-extrabold leading-snug tracking-tight text-white">
                Live Order <br />
                <span className="text-amber-400 italic">Fast Pickup & Delivery</span>
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
                <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#072d1d]/80 via-transparent to-[#072d1d]/30" />
                <div className="absolute inset-0 z-10 pointer-events-none border border-emerald-400/20 rounded-2xl" />

                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-2xl scale-105 group-hover:scale-110 transition-transform duration-700 ease-out filter brightness-105 contrast-105"
                >
                  <source src="/pickup.mp4" type="video/mp4" />
                </video>

                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-[#072d1d]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/40 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <MapPin className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-[8px] font-bold text-emerald-100">Woji Delivery Hub</span>
                </div>

                <div className="absolute bottom-2 right-2 z-20 bg-amber-500 text-[#072d1d] text-[8px] font-black px-2 py-0.5 rounded-md shadow-md backdrop-blur-md">
                  ~12 Mins Away
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Cakes Feature Link Card */}
        <section 
          onClick={() => router.push('/cakes')}
          className="bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] rounded-2xl p-4 text-white border border-amber-400/30 shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition"
        >
          <div className="space-y-1">
            <span className="bg-amber-500 text-[#072d1d] font-bold text-[9px] px-2 py-0.5 rounded-full">
              Bespoke Bakes
            </span>
            <h4 className="text-sm font-extrabold text-white">Looking for Cakes?</h4>
            <p className="text-[10px] text-emerald-100/80">Customize 6&quot; & 7&quot; tiered flavors on our dedicated Cake page.</p>
          </div>
          <div className="bg-amber-500 text-[#072d1d] p-2.5 rounded-full">
            <Cake className="w-5 h-5" />
          </div>
        </section>

        {/* Customer Reviews & Star Ratings Section (Mobile Mount) */}
        <CustomerReviewsSection />

        {/* Food Menu Preview Listing */}
        <section id="our-menu-section" className="pt-4 scroll-mt-36">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Food Menu</h2>
              <p className="text-xs text-slate-500">
                {filteredProducts.length} preview meal{filteredProducts.length !== 1 ? 's' : ''} available
              </p>
            </div>
            {searchQuery && (
              <button 
                onClick={() => handleSearch('')}
                className="text-xs text-amber-600 font-medium hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-xs text-slate-500">Loading delicious preview catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl p-6 border border-slate-100">
              <p className="text-sm text-slate-600 mb-3">
                {searchQuery
                  ? `No meals found matching "${searchQuery}".`
                  : 'No food products available yet.'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch('')}
                  className="cursor-pointer"
                >
                  Clear Search
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

        {/* Footer */}
        <footer id="contact" className="bg-[#072d1d] text-white rounded-2xl p-6 space-y-6 mt-8">
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-amber-400">DEECHOI</h3>
            <p className="text-xs text-emerald-100/80">
              Bringing authentic flavors to your table with quality and care.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-amber-400 mb-2">Quick Links</h4>
              <ul className="space-y-1 text-emerald-100/80">
                <li><Link href="/" className="hover:text-amber-400 transition">Home</Link></li>
                <li><Link href="/cakes" className="text-amber-400 font-bold transition">Cakes Collection</Link></li>
                <li><Link href="/about" className="hover:text-amber-400 transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-amber-400 transition">Contact</Link></li>
                <li><Link href="/services" className="hover:text-amber-400 transition">Book Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 mb-2">Contact</h4>
              <p className="text-emerald-100/80">
                <a href="mailto:deechoi01@gmail.com" className="hover:text-amber-400 block">
                  deechoi01@gmail.com
                </a>
                <a href="tel:+2347046145982" className="hover:text-amber-400 block mt-1">
                  +234 704 614 5982
                </a>
              </p>
            </div>
          </div>

          <div className="border-t border-emerald-800/60 pt-4 text-xs text-emerald-100/80 space-y-1">
            <h4 className="font-semibold text-amber-400">Location</h4>
            <p>Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria</p>
          </div>

          <div className="border-t border-emerald-800/60 pt-4 text-center text-[10px] text-emerald-200/60">
            <p>&copy; 2026 DEECHOI LIMITED. All rights reserved.</p>
          </div>
        </footer>

      </main>

      {/* Floating Action Social Bar */}
      <div className="fixed right-4 bottom-8 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
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