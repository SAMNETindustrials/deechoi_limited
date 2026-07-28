'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { ProductCard } from '@/components/storefront/product-card'
import { ProductDetailModal } from '@/components/storefront/product-detail-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { 
  Search, 
  ShoppingBag, 
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
  Drumstick
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
  category: string
}

// Category Config with rich icons & imagery matched to mobile
const CATEGORIES = [
  { name: 'All', icon: <Utensils className="w-4 h-4" /> },
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

export default function DesktopHomePage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
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
        .order('created_at', { ascending: false })

      if (error) throw error
      const productList = data || []
      setProducts(productList)
      filterData(searchQuery, selectedCategory, productList)
    } catch (error) {
      console.error('Failed to fetch products:', error)
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

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName)
    filterData(searchQuery, categoryName, products)
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

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
      {/* Header Navigation */}
      <StorefrontHeader />

      {/* Hero Section based on Visual Mockup */}
      <section className="relative overflow-hidden bg-[#0A2E1D] text-white pt-8 pb-16 lg:pb-24 rounded-b-[40px] md:rounded-b-[60px]">
        {/* Background Wave Accent */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#12422C] text-[#EAA823] px-4 py-2 rounded-full border border-[#EAA823]/20 text-sm font-semibold">
                <Truck className="w-4 h-4 text-[#EAA823]" />
                <span>Fast Delivery</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Fastest <br />
                <span className="text-[#EAA823]">Delivery</span> & <br />
                Easy <span className="text-[#EAA823]">Pickup.</span>
              </h1>

              {/* Subheading */}
              <p className="text-gray-300 text-lg max-w-lg leading-relaxed">
                Delicious meals delivered hot and fresh to your door. Order now and enjoy the best food experience.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button 
                  onClick={scrollToMenu} 
                  className="bg-[#0A2E1D] border-2 border-[#EAA823] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] px-8 py-6 rounded-full font-bold text-base flex items-center gap-3 transition-all duration-300 shadow-lg"
                >
                  Order Now
                  <span className="bg-[#EAA823] text-[#0A2E1D] p-1.5 rounded-full">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>

                <Button 
                  onClick={scrollToMenu}
                  variant="outline"
                  className="bg-white text-[#0A2E1D] hover:bg-gray-100 border-none px-8 py-6 rounded-full font-bold text-base flex items-center gap-2 shadow-md"
                >
                  <ShoppingBag className="w-5 h-5 text-[#EAA823]" />
                  Order Process
                </Button>
              </div>

              {/* Value Proposition Icons */}
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

            {/* Right Hero Image Composition */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <div className="relative w-full max-w-lg aspect-square">
                {/* Yellow Halo Background & Spinner */}
                <div className="absolute inset-0 bg-[#EAA823] rounded-full opacity-20 filter blur-3xl transform scale-90" />
                <div className="absolute inset-4 border-2 border-dashed border-[#EAA823]/40 rounded-full animate-spin-slow" />
                
                {/* Enabled Main Hero Image */}
                <img 
                  src="/images/hero-delivery.png" 
                  alt="De-echoi Delivery Rider" 
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                  onError={(e) => {
                    // Fallback to mobile bike if hero-delivery is missing
                    e.currentTarget.src = '/mobile_bike.png'
                  }}
                />

                {/* Floating Dish Highlights */}
                <div className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-xl border-2 border-[#EAA823] z-20 hover:scale-110 transition-transform">
                  <img src="/images/dish-1.png" alt="Dish" className="w-20 h-20 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/Recipe2.jpg' }} />
                </div>
                <div className="absolute top-1/3 -left-6 bg-white p-2 rounded-full shadow-xl border-2 border-[#EAA823] z-20 hover:scale-110 transition-transform">
                  <img src="/images/dish-2.png" alt="Dish" className="w-16 h-16 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/shawarma.jpeg' }} />
                </div>
                <div className="absolute -bottom-2 left-12 bg-white p-2 rounded-full shadow-xl border-2 border-[#EAA823] z-20 hover:scale-110 transition-transform">
                  <img src="/images/dish-3.png" alt="Dish" className="w-16 h-16 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/cakes.jpg' }} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Ribbon Bar */}
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

      {/* Horizontal Scroll Category Navigation Bar */}
      <section className="py-6 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            
            {/* Category Section Header & Search */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0A2E1D]">Categories</h3>
                <p className="text-xs text-gray-500">Scroll horizontally to select your favorite meal type</p>
              </div>

              {/* Inline Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search food, dishes..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:border-[#0A2E1D] text-sm"
                />
              </div>
            </div>

            {/* Horizontal Scroll Categories Bar */}
            <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase()
                return (
                  <button
                    key={cat.name}
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 border ${
                      isSelected
                        ? 'bg-[#0A2E1D] text-[#EAA823] border-[#0A2E1D] shadow-md scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    {cat.image ? (
                      <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300">
                        <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <span className={`p-1 rounded-full ${isSelected ? 'bg-[#EAA823] text-[#0A2E1D]' : 'bg-gray-200 text-gray-600'}`}>
                        {cat.icon}
                      </span>
                    )}
                    <span>{cat.name}</span>
                  </button>
                )
              })}
            </div>

          </div>
        </div>
      </section>

      {/* Our Menu / Featured Products Section */}
      <section className="py-16" id="our-menu-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-gray-200">
            <div>
              <span className="text-[#EAA823] font-bold text-sm tracking-wider uppercase">Fresh & Hot</span>
              <h2 className="text-4xl font-extrabold text-[#0A2E1D] mt-1">
                Our Menu
              </h2>
            </div>
            <p className="text-gray-500 font-medium mt-2 md:mt-0">
              Showing <span className="text-[#0A2E1D] font-bold">{filteredProducts.length}</span> item{filteredProducts.length !== 1 ? 's' : ''} {selectedCategory !== 'All' ? `in ${selectedCategory}` : ''}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-[#0A2E1D] border-t-[#EAA823] rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">Preparing delicious items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500 text-lg font-medium">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No products matching your selected filters.'
                  : 'No products available at the moment.'}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-full border-[#0A2E1D] text-[#0A2E1D] hover:bg-[#0A2E1D] hover:text-white"
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
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rewards & Special Offers Banner */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#0A2E1D] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <span className="text-4xl mb-4 block">🎁</span>
                <h4 className="text-2xl font-bold mb-2">Rewards & Discounts</h4>
                <p className="text-gray-300">Earn loyalty points with every order and unlock exclusive savings.</p>
              </div>
              <div className="mt-6 relative z-10">
                <Button 
                  onClick={scrollToMenu} 
                  className="bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold rounded-full px-6"
                >
                  Claim Rewards
                </Button>
              </div>
            </div>

            <div className="bg-[#12422C] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <span className="text-4xl mb-4 block">🎯</span>
                <h4 className="text-2xl font-bold mb-2">Special Offers</h4>
                <p className="text-gray-300">Check out our daily combo deals and save up to 25% on family feasts.</p>
              </div>
              <div className="mt-6 relative z-10">
                <Button 
                  onClick={scrollToMenu} 
                  className="bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold rounded-full px-6"
                >
                  Explore Offers
                </Button>
              </div>
            </div>
          </div>

          {/* Call To Action */}
          <div className="bg-[#0A2E1D] rounded-3xl p-10 md:p-16 text-center relative overflow-hidden border-2 border-[#EAA823]/30">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                Taste the <span className="text-[#EAA823]">echoi</span> in every bite. 💚
              </h3>
              <Button 
                onClick={scrollToMenu} 
                className="bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold text-lg px-10 py-6 rounded-full shadow-xl transition-all duration-300 inline-flex items-center gap-3"
              >
                Order Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <li><a href="#about" className="hover:text-[#EAA823] transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-[#EAA823] transition-colors">Contact Us</a></li>
                <li><a href="#book" className="hover:text-[#EAA823] transition-colors">Catering & Booking</a></li>
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