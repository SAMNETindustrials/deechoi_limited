'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
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
}

interface ProductDetailModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailModal({
  productId,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const supabase = createClient()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [totalModifier, setTotalModifier] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && productId) {
      loadProductData()
    }
  }, [isOpen, productId])

  const loadProductData = async () => {
    try {
      setLoading(true)

      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) {
        // Fallback query if stored under standard 'products' table
        const { data: fallbackProduct, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (fallbackError) throw fallbackError
        setProduct(fallbackProduct)
      } else {
        setProduct(productData)
      }
    } catch (error) {
      console.error('[v0] Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOptions = (options: Record<string, string>, modifier: number) => {
    setSelectedOptions(options)
    setTotalModifier(modifier)
  }

  const calculateTotalPrice = () => {
    if (!product) return 0
    return (product.price + totalModifier) * quantity
  }

  const handleAddToCart = async () => {
    if (!product) return

    try {
      setSubmitting(true)

      const unitPriceWithModifiers = product.price + totalModifier
      const finalPrice = calculateTotalPrice()

      addItem({
        id: product.id,
        product_id: product.id,
        name: product.name,
        product_name: product.name,
        quantity,
        price: unitPriceWithModifiers,
        unit_price: product.price,
        final_price: finalPrice,
        price_modifier: totalModifier,
        selected_options: selectedOptions,
        imageUrl: product.image_url || undefined,
      })

      onClose()
      setQuantity(1)
      setSelectedOptions({})
      setTotalModifier(0)
    } catch (error) {
      console.error('[v0] Error adding to cart:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-background/95 backdrop-blur">
          <h2 className="text-2xl font-bold truncate pr-4">{product?.name || 'Product Details'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground animate-pulse">Loading product details...</p>
          </div>
        ) : product ? (
          <div className="p-6 space-y-6">
            {/* Product Image */}
            {product.image_url && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Product Description & Base Price */}
            <div>
              {product.description && (
                <p className="text-muted-foreground mb-4">{product.description}</p>
              )}
              <div className="p-4 bg-accent/10 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Base Price:</span>
                <span className="text-xl font-bold text-primary">₦{product.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Embed Customization Options Selector */}
            <ProductCustomizationSelector
              productId={product.id}
              basePrice={product.price}
              onSelectOptions={handleSelectOptions}
            />

            {/* Quantity Selector */}
            <div className="border border-border rounded-lg p-4 bg-card/30">
              <p className="font-semibold mb-3">Quantity</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold min-w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Total Price and Add to Cart */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-3xl font-bold text-primary">₦{calculateTotalPrice().toLocaleString()}</span>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={submitting || (product.in_stock !== undefined && !product.in_stock)}
                className="w-full gap-2"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5" />
                {submitting ? 'Adding...' : product.in_stock === false ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">Failed to load product</p>
          </div>
        )}
      </div>
    </div>
  )
}