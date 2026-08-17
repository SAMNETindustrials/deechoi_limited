'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Cake, ShoppingBag, Layers, CheckCircle2, XCircle } from 'lucide-react'

interface ProductCardProps {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string | null
  inStock?: boolean
  category?: string
  onViewDetails: (id: string) => void
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  inStock = true,
  category,
  onViewDetails,
}: ProductCardProps) {
  // Check if item is a cake product
  const isCake = 
    category?.toLowerCase() === 'cakes' || 
    name.toLowerCase().includes('cake') ||
    id.startsWith('cake-')

  // Extract size tag if present (e.g. 6" or 7")
  const sizeMatch = name.match(/([67]['"”]|6\s*inches|7\s*inches)/i)
  const sizeTag = sizeMatch ? sizeMatch[0].replace(/inches/i, '"').trim() : null

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-4 sm:p-5 relative">
      
      {/* Top Image Section */}
      <div className="space-y-3.5">
        <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              {isCake ? <Cake className="w-10 h-10 text-[#EAA823]" /> : <ShoppingBag className="w-10 h-10 text-gray-300" />}
              <span className="text-xs font-medium">De-echoi Special</span>
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isCake && (
              <span className="inline-flex items-center gap-1 bg-[#0A2E1D]/90 backdrop-blur-xs text-[#EAA823] text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-[#EAA823]/30 shadow-sm">
                <Cake className="w-3 h-3" />
                Cake
              </span>
            )}
            {sizeTag && (
              <span className="bg-[#12422C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {sizeTag} Size
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 z-10">
            {inStock ? (
              <span className="inline-flex items-center gap-1 bg-green-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-red-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                <XCircle className="w-3 h-3" />
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-1">
          {category && (
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#EAA823] block">
              {category}
            </span>
          )}

          <h3 className="font-bold text-base sm:text-lg text-[#0A2E1D] line-clamp-1 group-hover:text-[#12422C] transition-colors">
            {name}
          </h3>

          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed min-h-[32px]">
              {description}
            </p>
          )}
        </div>

        {/* Cake Tier Indicator Chip */}
        {isCake && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#12422C] bg-[#FDFBF7] p-2 rounded-xl border border-[#EAA823]/20">
            <Layers className="w-3.5 h-3.5 text-[#EAA823]" />
            <span>Available in 1, 2 & 3 Layers</span>
          </div>
        )}
      </div>

      {/* Bottom Pricing & Action Section */}
      <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-gray-400 block font-medium">
            {isCake ? 'Starting from' : 'Price'}
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-[#0A2E1D]">
            ₦{Number(price).toLocaleString()}
          </div>
        </div>

        <Button
          onClick={() => onViewDetails(id)}
          disabled={!inStock}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm ${
            inStock
              ? 'bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isCake ? 'Select & Order' : 'Order Now'}
        </Button>
      </div>

    </div>
  )
}