'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StorefrontHeader } from '@/components/storefront/header'
import { ProductCard } from '@/components/storefront/product-card'
import { ProductDetailModal } from '@/components/storefront/product-detail-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Cake, 
  Sparkles, 
  Search, 
  ArrowLeft, 
  Calculator, 
  CheckCircle2, 
  Info, 
  PartyPopper,
  Loader2,
  Calendar,
  Layers,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
  category: string
}

const CAKE_FLAVORS = [
  'Vanilla Velvet Cream',
  'Rich Belgian Chocolate',
  'Signature Red Velvet',
  'Strawberry Delight',
  'Caramel Butterscotch',
]

function CakesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cakeProducts, setCakeProducts] = useState<Product[]>([])
  const [filteredCakes, setFilteredCakes] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Interactive Live Price Estimator State
  const [calcSize, setCalcSize] = useState<'6' | '7'>('6')
  const [calcLayers, setCalcLayers] = useState<number>(2)
  const [calcFlavor1, setCalcFlavor1] = useState(CAKE_FLAVORS[0])
  const [calcFlavor2, setCalcFlavor2] = useState(CAKE_FLAVORS[2])
  const [calcInscription, setCalcInscription] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchCakes()
  }, [])

  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
      filterCakes(search, cakeProducts)
    }
  }, [searchParams, cakeProducts])

  const fetchCakes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter only cake items
      const cakes = (data || []).filter(
        (p) =>
          p.category?.toLowerCase() === 'cakes' ||
          p.name?.toLowerCase().includes('cake')
      )

      setCakeProducts(cakes)
      setFilteredCakes(cakes)
    } catch (err) {
      console.error('Error loading cakes:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterCakes = (query: string, allCakes: Product[]) => {
    if (!query.trim()) {
      setFilteredCakes(allCakes)
      return
    }
    const q = query.toLowerCase()
    const result = allCakes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    )
    setFilteredCakes(result)
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    filterCakes(q, cakeProducts)
  }

  const handleViewDetails = (productId: string) => {
    setSelectedProductId(productId)
    setShowModal(true)
  }

  // Calculate live estimate based on size and layers
  const calculateEstimatedPrice = () => {
    const basePrice = calcSize === '6' ? 18000 : 25000
    const layerModifier = (calcLayers - 1) * (calcSize === '6' ? 7000 : 9000)
    return basePrice + layerModifier
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Food Storefront
          </Link>

          <Link href="/services">
            <Button className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white text-xs font-bold rounded-full px-5 py-2.5 transition">
              Book Wedding / Event Cakes
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] rounded-3xl p-8 sm:p-12 text-white border border-amber-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#12422C] text-amber-400 px-3.5 py-1.5 rounded-full border border-amber-400/30 text-xs font-extrabold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bespoke Celebration Cakes</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Crafted for Your <br />
                <span className="text-[#EAA823]">Sweetest Milestones.</span>
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
                Freshly baked signature 6-inch and 7-inch layered cakes. Customize your sponge flavors, tier heights, and custom greeting inscriptions.
              </p>
            </div>

            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/30 bg-[#041a11]">
                <Image
                  src="/cakes.jpg"
                  alt="Celebration Cakes"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Live Price Estimator */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 rounded-xl text-[#EAA823]">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#0A2E1D]">
                  Interactive Cake Price Estimator
                </h2>
                <p className="text-xs text-gray-500">Configure sizes, layers, and get instant pricing</p>
              </div>
            </div>

            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full">
              Live Matrix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Size Choice */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">1. Cake Diameter Size</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCalcSize('6')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    calcSize === '6'
                      ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                      : 'bg-[#FDFBF7] text-gray-700 border-gray-200'
                  }`}
                >
                  <p className="text-xs font-bold">6-Inch Cake</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Base: ₦18,000</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCalcSize('7')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    calcSize === '7'
                      ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                      : 'bg-[#FDFBF7] text-gray-700 border-gray-200'
                  }`}
                >
                  <p className="text-xs font-bold">7-Inch Cake</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Base: ₦25,000</p>
                </button>
              </div>
            </div>

            {/* Layer Count */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">2. Number of Layers</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCalcLayers(num)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      calcLayers === num
                        ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                        : 'bg-[#FDFBF7] text-gray-700 border-gray-200'
                    }`}
                  >
                    <p className="text-xs font-bold">{num} Layer{num > 1 ? 's' : ''}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Flavor 1 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">3. Primary Sponge Flavor</label>
              <select
                value={calcFlavor1}
                onChange={(e) => setCalcFlavor1(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-gray-200 text-xs text-[#0A2E1D] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
              >
                {CAKE_FLAVORS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Summary Output */}
          <div className="bg-[#072d1d] text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-amber-400 font-bold uppercase">Calculated Estimate</p>
              <p className="text-xs text-gray-300">
                {calcSize}&quot; Diameter &bull; {calcLayers} Layer{calcLayers > 1 ? 's' : ''} &bull; {calcFlavor1}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl font-black text-[#EAA823]">
                ₦{calculateEstimatedPrice().toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* Cakes Catalog Listing */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-black text-[#0A2E1D]">Cakes Showcase</h2>
              <p className="text-xs text-gray-500">Showing {filteredCakes.length} celebration cake design{filteredCakes.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search cakes..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-white border-gray-200 text-xs pl-10 pr-4 py-2.5 rounded-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" />
              <p className="text-xs font-bold text-gray-400">Loading cake designs...</p>
            </div>
          ) : filteredCakes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-3">
              <Cake className="w-12 h-12 text-gray-400 mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-gray-700">No Cakes Found</h3>
              <p className="text-xs text-gray-500">Try adjusting your search query or view all items.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCakes.map((cake) => (
                <ProductCard
                  key={cake.id}
                  id={cake.id}
                  name={cake.name}
                  description={cake.description || ''}
                  price={Number(cake.price)}
                  imageUrl={cake.image_url ?? undefined}
                  inStock={cake.in_stock}
                  category={cake.category}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </section>

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

export default function CakesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" />
        <p className="text-xs font-bold text-gray-500">Loading Cakes Collection...</p>
      </div>
    }>
      <CakesPageContent />
    </Suspense>
  )
}