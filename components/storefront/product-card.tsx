'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'

export interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  inStock: boolean
  onAddToCart: () => void
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  inStock,
  onAddToCart,
}: ProductCardProps) {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative w-full h-48 bg-muted overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">No image available</span>
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
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

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-2xl font-bold text-primary">
            ₦{price.toFixed(2)}
          </div>
          <Button
            onClick={onAddToCart}
            disabled={!inStock}
            size="sm"
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
