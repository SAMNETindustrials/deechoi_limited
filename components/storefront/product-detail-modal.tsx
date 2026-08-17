'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { StorefrontHeader } from '@/components/storefront/header'
import { 
  X, Plus, Minus, ShoppingCart, Clock, Users, ShieldAlert, Box, 
  Cake, Sparkles, Layers, ArrowLeft, Truck,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'
import { ProductCustomizationSelector } from '@/components/product-customization-selector'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
  category: string
  cake_details?: {
    size?: string
    primaryFlavor?: string
    allowCustomInscription?: boolean
    tiers?: { layers: number; price: number; label?: string }[]
  } | null
}

interface ProductExtraDetails {
  description?: string
  ingredients?: string[]
  allergens?: string[]
  preparation_time_minutes?: number | string
  servings?: number | string
  storage_instructions?: string
}

interface ProductDetailModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

const AVAILABLE_FLAVORS = ['Vanilla', 'Chocolate', 'Red Velvet']

export function ProductDetailModal({
  productId,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const supabase = createClient()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [details, setDetails] = useState<ProductExtraDetails | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [totalModifier, setTotalModifier] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Cake specific customization state
  const [isCakeProduct, setIsCakeProduct] = useState(false)
  const [cakeSize, setCakeSize] = useState<'6' | '7'>('6')
  const [cakeLayers, setCakeLayers] = useState<1 | 2 | 3>(1)
  const [cakeFlavors, setCakeFlavors] = useState<string[]>(['Vanilla'])
  const [customWriting, setCustomWriting] = useState('')

  useEffect(() => {
    if (isOpen && productId) {
      loadProductData()
      window.scrollTo(0, 0)
    }
  }, [isOpen, productId])

  const loadProductData = async () => {
    try {
      setLoading(true)
      const { data: productData, error: productError } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', productId)
        .single()

      let fetchedProduct = productData
      if (productError) {
        const { data: fallbackProduct } = await supabase.from('products').select('*').eq('id', productId).single()
        fetchedProduct = fallbackProduct
      }

      setProduct(fetchedProduct)

      const isCake = fetchedProduct?.category?.toLowerCase() === 'cakes' || fetchedProduct?.name?.toLowerCase().includes('cake')
      setIsCakeProduct(Boolean(isCake))

      if (isCake) {
        const cakeDetails = fetchedProduct?.cake_details
        const isSeven = cakeDetails?.size?.includes('7') || fetchedProduct?.name?.includes('7') || fetchedProduct?.description?.includes('7')
        setCakeSize(isSeven ? '7' : '6')
        setCakeLayers(1)
        const defaultFlavor = cakeDetails?.primaryFlavor && cakeDetails.primaryFlavor !== 'Multi-Flavor Combo' ? cakeDetails.primaryFlavor : 'Vanilla'
        setCakeFlavors([defaultFlavor])
      }

      try {
        const response = await fetch(`/api/products/${productId}/details`)
        const resData = await response.json()
        if (resData.success) setDetails(resData.data)
      } catch { setDetails(null) }
    } finally {
      setLoading(false)
    }
  }

  const getCakeUnitPrice = () => {
    if (!product) return 0
    if (cakeSize === '6') {
      if (cakeLayers === 1) return (cakeFlavors[0] === 'Chocolate' ? 21000 : cakeFlavors[0] === 'Red Velvet' ? 20500 : 20000)
      if (cakeLayers === 2) return (cakeFlavors[0] !== (cakeFlavors[1] || cakeFlavors[0]) ? 41000 : cakeFlavors[0] === 'Chocolate' ? 40000 : cakeFlavors[0] === 'Red Velvet' ? 39000 : 38500)
      return (new Set(cakeFlavors.slice(0, 3)).size >= 2 ? 61500 : cakeFlavors[0] === 'Chocolate' ? 53000 : cakeFlavors[0] === 'Red Velvet' ? 51000 : 52000)
    } else {
      if (cakeLayers === 1) return (cakeFlavors[0] === 'Chocolate' ? 27500 : cakeFlavors[0] === 'Red Velvet' ? 27000 : 26000)
      if (cakeLayers === 2) return (cakeFlavors[0] !== (cakeFlavors[1] || cakeFlavors[0]) ? 45000 : cakeFlavors[0] === 'Chocolate' ? 50000 : cakeFlavors[0] === 'Red Velvet' ? 49000 : 46000)
      return (new Set(cakeFlavors.slice(0, 3)).size >= 2 ? 69000 : cakeFlavors[0] === 'Chocolate' ? 65000 : cakeFlavors[0] === 'Red Velvet' ? 63500 : 55000)
    }
  }

  const getEffectiveUnitPrice = () => isCakeProduct ? getCakeUnitPrice() : (Number(product?.price) || 0) + totalModifier
  const calculateTotalPrice = () => getEffectiveUnitPrice() * quantity

  const handleAddToCart = async () => {
    if (!product) return
    setSubmitting(true)
    const options = { ...selectedOptions }
    if (isCakeProduct) {
      options['Size'] = `${cakeSize} Inches`
      options['Layers'] = `${cakeLayers} Layer${cakeLayers > 1 ? 's' : ''}`
      options['Flavors'] = cakeFlavors.slice(0, cakeLayers).join(' + ')
      if (customWriting.trim()) options['Inscription'] = customWriting.trim()
    }
    addItem({
      id: isCakeProduct ? `${product.id}-${cakeSize}in-${cakeLayers}L` : product.id,
      product_id: product.id,
      name: isCakeProduct ? `${cakeSize}" ${cakeLayers}-Layer Cake` : product.name,
      product_name: product.name,
      quantity,
      price: getEffectiveUnitPrice(),
      final_price: calculateTotalPrice(),
      selected_options: options,
      imageUrl: product.image_url || undefined,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-[#FDFBF7] overflow-y-auto">
      <StorefrontHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <button onClick={onClose} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" /></div>
        ) : product ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Image */}
            <div className="space-y-6">
              {product.image_url && (
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden border border-gray-200 shadow-md">
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black text-[#0A2E1D]">{product.name}</h1>
                <p className="text-gray-600 mt-2 text-sm leading-relaxed">{details?.description || product.description}</p>
              </div>

              {/* Price Panel */}
              <div className="bg-[#0A2E1D] text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
                <span className="font-bold">Total Price</span>
                <span className="text-2xl font-black text-[#EAA823]">₦{calculateTotalPrice().toLocaleString()}</span>
              </div>

              {/* Cake Customization Panel */}
              {isCakeProduct && (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-sm text-[#0A2E1D] flex items-center gap-2"><Sparkles className="text-[#EAA823]" /> Customization</h4>
                  
                  {/* Size Select */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Size</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {['6', '7'].map(s => (
                        <button key={s} onClick={() => setCakeSize(s as '6' | '7')} className={`py-2 rounded-lg text-xs font-bold border ${cakeSize === s ? 'bg-[#0A2E1D] text-white' : 'bg-gray-100'}`}>{s} Inches</button>
                      ))}
                    </div>
                  </div>

                  {/* Layers Select */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Layers</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {[1, 2, 3].map(l => (
                        <button key={l} onClick={() => setCakeLayers(l as 1 | 2 | 3)} className={`py-2 rounded-lg text-xs font-bold border ${cakeLayers === l ? 'bg-[#0A2E1D] text-white' : 'bg-gray-100'}`}>{l} L</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <span className="font-bold text-[#0A2E1D]">Quantity</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="w-4 h-4" /></Button>
                  <span className="font-bold w-8 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <Button 
                onClick={handleAddToCart}
                className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] text-white font-black py-6 rounded-2xl shadow-xl transition-all"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}