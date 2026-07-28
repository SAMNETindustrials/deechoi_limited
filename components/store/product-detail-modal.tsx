'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
import Image from 'next/image'

interface OptionGroup {
  id: string
  group_name: string
  is_required: boolean
  display_order: number
}

interface Option {
  id: string
  option_name: string
  price_modifier: number
  option_group_name: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category: string
}

interface ProductDetailModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
  onAddToCart: (item: any) => void
  optionGroups?: OptionGroup[]
  options?: Option[]
}

export function ProductDetailModal({
  isOpen,
  product,
  onClose,
  onAddToCart,
  optionGroups = [],
  options = []
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [totalPrice, setTotalPrice] = useState(product?.price || 0)

  useEffect(() => {
    if (product) {
      setQuantity(1)
      setSelectedOptions({})
      calculatePrice()
    }
  }, [product])

  const calculatePrice = () => {
    if (!product) return

    let priceModifier = 0
    Object.entries(selectedOptions).forEach(([groupName, optionId]) => {
      const option = options.find(o => o.id === optionId)
      if (option) {
        priceModifier += option.price_modifier
      }
    })

    setTotalPrice((product.price || 0) + priceModifier)
  }

  const handleOptionSelect = (groupName: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: optionId
    }))
  }

  useEffect(() => {
    calculatePrice()
  }, [selectedOptions, product])

  const handleAddToCart = () => {
    if (!product) return

    // Validate required options
    const missingRequired = optionGroups
      .filter(g => g.is_required)
      .some(g => !selectedOptions[g.group_name])

    if (missingRequired) {
      alert('Please select all required options')
      return
    }

    const selectedOptionDetails = Object.entries(selectedOptions).map(([groupName, optionId]) => {
      const option = options.find(o => o.id === optionId)
      return {
        groupName,
        optionName: option?.option_name,
        priceModifier: option?.price_modifier || 0
      }
    })

    onAddToCart({
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      selected_options: selectedOptionDetails,
      price_modifier: totalPrice - (product.price || 0),
      final_price: totalPrice * quantity
    })

    onClose()
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background">
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Image and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.image_url && (
              <div className="relative h-64 md:h-80 bg-muted rounded-lg overflow-hidden">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">{product.category}</p>
                <h3 className="text-lg font-semibold mt-1">{product.name}</h3>
              </div>
              <p className="text-muted-foreground">{product.description}</p>
              <div className="pt-4 border-t border-border">
                <p className="text-3xl font-bold text-primary">₦{totalPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Base price: ₦{(product.price || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Customization Options */}
          {optionGroups.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold">Customization Options</h3>
              {optionGroups.map(group => {
                const groupOptions = options.filter(o => o.option_group_name === group.group_name)
                return (
                  <div key={group.id} className="space-y-3">
                    <label className="block text-sm font-medium">
                      {group.group_name}
                      {group.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {groupOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => handleOptionSelect(group.group_name, option.id)}
                          className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                            selectedOptions[group.group_name] === option.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 text-foreground'
                          }`}
                        >
                          <div className="font-medium">{option.option_name}</div>
                          {option.price_modifier > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">+₦{option.price_modifier.toLocaleString()}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div>
              <label className="block text-sm font-medium mb-3">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-border rounded-lg hover:bg-accent"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-border rounded-lg hover:bg-accent"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1 gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart - ₦{(totalPrice * quantity).toLocaleString()}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
