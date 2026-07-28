'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
}

interface OptionGroup {
  id: string
  product_id: string
  group_name: string
  options: Array<{
    id: string
    name: string
    price_modifier: number
  }>
}

export default function ProductDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [product, setProduct] = useState<Product | null>(null)
  const [options, setOptions] = useState<OptionGroup[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [priceModifier, setPriceModifier] = useState(0)
  const supabase = createClient()
  const { addItem } = useCart()
  const router = useRouter()

  useEffect(() => {
    if (params?.id) {
      fetchProductDetails()
    }
  }, [params?.id])

  useEffect(() => {
    // Calculate price modifier based on selected options
    let modifier = 0
    options.forEach(group => {
      const selectedOptionId = selectedOptions[group.id]
      if (selectedOptionId) {
        const option = group.options.find(opt => opt.id === selectedOptionId)
        if (option) {
          modifier += option.price_modifier
        }
      }
    })
    setPriceModifier(modifier)
  }, [selectedOptions, options])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', params.id)
        .single()

      if (productError) throw productError
      setProduct(productData)

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from('product_option_groups')
        .select(`
          *,
          product_options (*)
        `)
        .eq('product_id', params.id)

      if (!optionsError && optionsData) {
        setOptions(optionsData as any[])
        // Initialize with first option from each group
        const initialOptions: Record<string, string> = {}
        optionsData.forEach(group => {
          if ((group as any).product_options?.[0]) {
            initialOptions[group.id] = (group as any).product_options[0].id
          }
        })
        setSelectedOptions(initialOptions)
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    const selectedOptionsArray = options
      .map(group => {
        const selectedOptionId = selectedOptions[group.id]
        if (selectedOptionId) {
          const option = group.options.find(opt => opt.id === selectedOptionId)
          if (option) {
            return {
              groupName: group.group_name,
              optionName: option.name,
              priceModifier: option.price_modifier
            }
          }
        }
        return null
      })
      .filter(Boolean) as any[]

    addItem({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        final_price: (product.price + priceModifier) * quantity,
        selected_options: selectedOptionsArray,
        price_modifier: priceModifier,
        name: undefined,
        id: undefined,
        imageUrl: undefined,
        price: undefined
    })

    router.push('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StorefrontHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <StorefrontHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-foreground">Product not found</p>
        </div>
      </div>
    )
  }

  const totalPrice = (product.price + priceModifier) * quantity

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/">
          <button className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden h-96">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-lg text-muted-foreground">{product.description}</p>
            </div>

            {/* Customization Options */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Customize Your Order</h3>
              {options.map(group => (
                <div key={group.id} className="border border-border rounded-lg p-4">
                  <p className="font-semibold text-foreground mb-3">{group.group_name}</p>
                  <div className="space-y-2">
                    {group.options?.map(option => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={group.id}
                          value={option.id}
                          checked={selectedOptions[group.id] === option.id}
                          onChange={() => setSelectedOptions(prev => ({
                            ...prev,
                            [group.id]: option.id
                          }))}
                          className="w-4 h-4"
                        />
                        <span className="flex-1 text-foreground">{option.name}</span>
                        {option.price_modifier !== 0 && (
                          <span className={`font-semibold ${option.price_modifier > 0 ? 'text-primary' : 'text-green-600'}`}>
                            {option.price_modifier > 0 ? '+' : ''}₦{Math.abs(option.price_modifier).toLocaleString()}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quantity Selector */}
            <div className="border border-border rounded-lg p-4">
              <p className="font-semibold text-foreground mb-3">Quantity</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold text-foreground w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Price and Add to Cart */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg text-muted-foreground">Total Price:</span>
                <span className="text-3xl font-bold text-accent">₦{totalPrice.toLocaleString()}</span>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className="w-full bg-primary hover:bg-primary/90 text-background font-bold text-lg py-6 rounded-lg"
              >
                {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
