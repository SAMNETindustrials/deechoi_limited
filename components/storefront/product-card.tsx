'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Sliders } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  inStock: boolean
  onViewDetails: (productId: string) => void
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  inStock,
  onViewDetails,
}: ProductCardProps) {
  const [hasOptions, setHasOptions] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkProductOptions()
  }, [id])

  const checkProductOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('product_option_groups')
        .select('id')
        .eq('product_id', id)
        .limit(1)

      if (!error && data && data.length > 0) {
        setHasOptions(true)
      }
    } catch (error) {
      console.error('[v0] Error checking product options:', error)
    }
  }

  return (
    <Link href={`/product/${id}`}>
      <div className="group w-full text-left bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:border-primary cursor-pointer">
      {/* Image Container */}
      <div className="relative w-full h-48 bg-muted overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">No image available</span>
          </div>
        )}
        
        {/* Hover Overlay - View Details */}
        {inStock && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-lg font-semibold">
              <ShoppingCart className="h-5 w-5" />
              View Details
            </div>
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}

        {/* Customization Badge */}
        {hasOptions && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
            <Sliders className="w-3 h-3" />
            Customizable
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg line-clamp-2">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        </div>

        {/* Price and Status */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-2xl font-bold text-accent">
            ₦{price.toLocaleString()}
          </div>
          <div className="text-xs bg-primary/15 text-primary px-2 py-1 rounded-full font-semibold whitespace-nowrap">
            {inStock ? 'Click to Order' : 'Unavailable'}
          </div>
        </div>
      </div>
      </div>
    </Link>
  )
}
