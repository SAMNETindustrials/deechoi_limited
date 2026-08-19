'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, ArrowRight, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  inStock?: boolean
  category?: string
  onViewDetails?: (id: string) => void
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  inStock = true,
  category = 'Specialty',
}: ProductCardProps) {
  return (
    <Link 
      href={`/product/${id}`}
      className="group block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Utensils className="w-8 h-8 text-gray-300" />
          </div>
        )}

        <span className="absolute top-3 left-3 bg-[#0A2E1D]/90 backdrop-blur-md text-[#EAA823] text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-xs">
          {category}
        </span>

        {!inStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#0A2E1D] group-hover:text-[#EAA823] transition-colors leading-snug line-clamp-1">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block">From</span>
            <span className="text-base sm:text-lg font-black text-[#0A2E1D]">
              ₦{Number(price).toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 bg-[#0A2E1D] group-hover:bg-[#EAA823] text-white group-hover:text-[#0A2E1D] rounded-full transition-colors shadow-xs">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}