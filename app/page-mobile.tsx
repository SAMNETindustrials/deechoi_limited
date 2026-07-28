'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Menu, 
  ShoppingCart, 
  Search, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Leaf, 
  Headphones, 
  ChevronRight,
  Gift,
  Tag,
  Utensils,
  Pizza,
  Drumstick,
  Heart,
  X,
  Info,
  PhoneCall,
  Calendar,
  Home,
  Star,
  Share2,
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

// Hero Rider Images Carousel Config
const HERO_IMAGES = [
  { src: '/mobile_bike.png', alt: 'Delivery Rider' },
  { src: '/deechoi_brand.png', alt: 'Fresh Delicious Meals' },
  { src: '/web_bike.png', alt: 'Tasty Gourmet Burger' }
]

// Floating Social Handles Config
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

export default function HomePage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  
  // Floating Social Handles Expansion State
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

  // 4-second interval timer for rotating hero images smoothly
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
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
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
    { name: 'Shawarma', icon: <span className="text-xs font-bold">🫔</span>, image: '/shawarma.jpeg' },
    { name: 'Cakes', icon: <Pizza className="w-4 h-4" />, image: '/cakes.jpg' },
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
      
      {/* 1. STICKY HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#072d1d]/95 backdrop-blur-md px-5 py-2.5 border-b border-emerald-900/40">
        <div className="flex items-center justify-between max-w-md mx-auto h-12">
          {/* Menu Toggle Button */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            aria-label="Toggle Navigation Menu"
            className="text-white p-2 rounded-full hover:bg-white/10 transition active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Active Header Logo Image */}
          <div 
            className="flex items-center justify-center cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative w-60 h-30">
              <Image 
                src="/logo.png" 
                alt="De-echoi Limited Logo" 
                fill 
                className="object-contain scale-110"
                priority
              />
            </div>
          </div>

          {/* Cart Button with Cart Icon */}
          <button 
            onClick={scrollToMenu}
            aria-label="View Shopping Cart"
            className="relative bg-white text-[#072d1d] p-2.5 rounded-full shadow-md active:scale-95 transition"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#072d1d]">
              2
            </span>
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION OVERLAY */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm transition-opacity">
          {/* Overlay Click-to-Close Handler */}
          <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)} />

          <aside className="relative w-[80%] max-w-[320px] bg-slate-50 h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-left duration-300">
            
            {/* Top Brand Banner Header */}
            <div className="bg-[#072d1d] p-6 text-white relative rounded-b-3xl shadow-md">
              <button 
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close Navigation Menu"
                className="absolute top-4 right-4 bg-white/10 p-1.5 rounded-full text-white hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full border-2 border-amber-500 bg-emerald-900 overflow-hidden flex-shrink-0 shadow-md">
                  <Image 
                    src="/logo.png" 
                    alt="De-echoi Logo Avatar" 
                    fill 
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white leading-tight">De-echoi Limited</h3>
                  <p className="text-[11px] text-emerald-200/80">Authentic Flavors & Catering</p>
                </div>
              </div>
            </div>

            {/* Navigation Options List */}
            <nav className="p-5 space-y-6 flex-1 text-slate-700">
              
              {/* Primary Pages Category */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-3">
                  Main Navigation
                </p>
                <div className="space-y-1">
                  <Link 
                    href="/" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <Home className="w-4 h-4 text-[#072d1d]" />
                    <span>Home</span>
                  </Link>

                  <Link 
                    href="/about" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-[#072d1d]" />
                      <span>About Us</span>
                    </div>
                  </Link>

                  <Link 
                    href="/contact" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <PhoneCall className="w-4 h-4 text-[#072d1d]" />
                      <span>Contact</span>
                    </div>
                  </Link>

                  <Link 
                    href="/services" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#072d1d]" />
                      <span>Book Us</span>
                    </div>
                    <span className="bg-amber-500/15 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Events
                    </span>
                  </Link>
                </div>
              </div>

              {/* Menu Categories / Labels section */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-3">
                  Quick Actions
                </p>
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      scrollToMenu()
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Utensils className="w-4 h-4 text-[#072d1d]" />
                      <span>Our Menu</span>
                    </div>
                    <span className="bg-emerald-100 text-[#072d1d] text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {products.length} Items
                    </span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      scrollToMenu()
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span>Promotions</span>
                    </div>
                    <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Deals
                    </span>
                  </button>
                </div>
              </div>

            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-200 bg-white text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                De-echoi Limited &copy; 2026
              </p>
            </div>

          </aside>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative px-5 pt-4 pb-4 max-w-md mx-auto overflow-hidden min-h-[220px]">
        <div className="relative z-10 space-y-3 max-w-[60%]">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Good Food. <br />
            <span className="text-amber-500">Great Experience.</span> <br />
            Delivered to <br />
            <span className="font-serif italic font-normal underline decoration-amber-500">You.</span>
          </h1>
          <p className="text-xs text-emerald-100/80 leading-relaxed pr-2">
            Delicious meals delivered fast and fresh to your door. Order now and enjoy the De-echoi experience.
          </p>
        </div>

        {/* Rotational Hero Image Container */}
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

        {/* Floating Delivery Tag */}
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

      {/* 3. STICKY SEARCH BAR */}
      <div className="sticky top-[61px] z-40 bg-[#072d1d] px-5 py-3 max-w-md mx-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search for food, restaurants..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white rounded-full py-3 pl-11 pr-12 text-sm text-slate-800 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          
          {searchQuery ? (
            <button 
              onClick={() => handleSearch('')}
              className="absolute right-2 text-xs text-slate-500 hover:text-slate-800 bg-slate-200 p-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={scrollToMenu}
              className="absolute right-1.5 bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600 transition shadow"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN BODY CONTAINER */}
      <main className="bg-slate-50 rounded-t-[32px] pt-6 px-4 space-y-6 max-w-md mx-auto min-h-screen">
        
        {/* Feature Highlights */}
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
              className="text-xs font-semibold text-amber-600 flex items-center gap-0.5 hover:underline"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
            {categories.map((cat, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSearch(cat.name)}
                className="flex-shrink-0 flex flex-col items-center focus:outline-none group"
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
                <span className="text-xs font-medium text-slate-800 mt-2">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Exclusive Deals Section */}
        <section className="bg-[#072d1d] rounded-2xl p-4 text-white relative overflow-hidden flex items-center justify-between shadow-md">
          <div className="space-y-3 z-10 max-w-[60%]">
            <div className="inline-block bg-amber-500 text-[#072d1d] font-black text-[9px] uppercase px-2 py-0.5 rounded shadow-sm">
              Exclusive Deals
            </div>
            <p className="text-xs font-semibold leading-snug">
              Enjoy exclusive deals on your <span className="text-amber-400">favorite meals!</span>
            </p>
            <button 
              onClick={scrollToMenu}
              className="bg-white text-[#072d1d] text-xs font-bold py-2 px-3.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-slate-100 transition active:scale-95"
            >
              Order Now
              <span className="bg-amber-500 text-white rounded-full p-0.5">
                <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </button>
          </div>

          <div className="relative w-50 h-30 -mr-2">
            <Image 
              src="/mobile_bike.png" 
              alt="Exclusive Food Deal" 
              fill 
              className="object-contain"
            />
          </div>
        </section>

        {/* Rewards & Special Offers */}
        <section className="bg-orange-50/60 rounded-2xl p-3 border border-orange-100/80 grid grid-cols-2 gap-2 divide-x divide-slate-200/60">
          <div className="flex items-start gap-2.5 pr-2">
            <div className="p-2 bg-[#072d1d] text-amber-400 rounded-xl">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-900 leading-tight">Rewards & Discounts</h4>
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5">Earn points and enjoy amazing rewards.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pl-3">
            <div className="p-2 bg-[#072d1d] text-amber-400 rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-900 leading-tight">Special Offers</h4>
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5">Check out our daily offers and save more.</p>
            </div>
          </div>
        </section>

        {/* 5. DYNAMIC PRODUCTS & MENU LISTING */}
        <section id="our-menu-section" className="pt-4 scroll-mt-36">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Our Menu</h2>
              <p className="text-xs text-slate-500">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} available
              </p>
            </div>
            {searchQuery && (
              <button 
                onClick={() => handleSearch('')}
                className="text-xs text-amber-600 font-medium hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-xs text-slate-500">Loading delicious products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl p-6 border border-slate-100">
              <p className="text-sm text-slate-600 mb-3">
                {searchQuery
                  ? `No products found matching "${searchQuery}".`
                  : 'No products available yet.'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch('')}
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
                  imageUrl={product.image_url}
                  inStock={product.in_stock}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </section>

        {/* 6. BOTTOM CTA RIBBON */}
        <section className="bg-[#072d1d] rounded-full p-2 pl-5 flex items-center justify-between shadow-md my-6">
          <p className="text-xs font-semibold text-white flex items-center gap-1">
            Taste the <span className="text-amber-400 italic">echoi</span> in every bite. 
            <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
          </p>

          <button 
            onClick={scrollToMenu}
            className="bg-amber-500 text-[#072d1d] text-xs font-bold py-2 px-3.5 rounded-full flex items-center gap-1.5 hover:bg-amber-400 transition active:scale-95"
          >
            Order Now
            <span className="bg-[#072d1d] text-white rounded-full p-0.5">
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </button>
        </section>

        {/* 7. FOOTER SECTION */}
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

      {/* 8. VERTICAL FLOATING COLLAPSIBLE SOCIAL HANDLES PANEL */}
      <div className="fixed right-4 bottom-8 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
        
        {/* Expanded Social Handles Stack */}
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

              {/* Tooltip Label */}
              <span className="absolute right-14 bg-slate-900/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md border border-slate-700 pointer-events-none">
                {handle.name}
              </span>
            </a>
          ))}
        </div>

        {/* Collapsible Trigger Floating Action Button (FAB) */}
        <button
          onClick={() => setIsSocialOpen(!isSocialOpen)}
          aria-label="Toggle Social Handles"
          className="pointer-events-auto relative flex items-center justify-center w-13 h-13 rounded-full bg-amber-500 hover:bg-amber-400 text-[#072d1d] shadow-xl border-2 border-white transition-transform duration-300 active:scale-90 hover:scale-105"
        >
          <div className={`transition-transform duration-300 ${isSocialOpen ? 'rotate-90' : 'rotate-0'}`}>
            {isSocialOpen ? (
              <X className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>

          {/* Pulse notification dot when collapsed */}
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