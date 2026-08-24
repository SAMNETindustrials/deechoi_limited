'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Utensils, Clock } from 'lucide-react'

interface ProductCardProps {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  inStock?: boolean
  category?: string
  isTimeBound?: boolean
  availableFrom?: string | null
  availableTo?: string | null
  menuSection?: string | null
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
  isTimeBound = false,
  availableFrom,
  availableTo,
  menuSection,
}: ProductCardProps) {
  const [isTimeValid, setIsTimeValid] = useState(true)
  const [isStoreLive, setIsStoreLive] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Format 24h time to 12h AM/PM for friendly display
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hours = parseInt(h, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${m} ${ampm}`
  }

  // 1. Pull and Listen to Global Pre-Order Status
  useEffect(() => {
    setMounted(true)

    const checkStoreStatus = () => {
      const storeStatus = localStorage.getItem('deechoi_storefront_active')
      if (storeStatus !== null) {
        setIsStoreLive(storeStatus === 'true')
      }
    }

    checkStoreStatus()

    window.addEventListener('storage', checkStoreStatus)
    window.addEventListener('deechoi_store_status_change', checkStoreStatus)

    return () => {
      window.removeEventListener('storage', checkStoreStatus)
      window.removeEventListener('deechoi_store_status_change', checkStoreStatus)
    }
  }, [])

  // 2. Continuously monitor real-time clock to enforce time-bound rules
  useEffect(() => {
    if (isTimeBound && availableFrom && availableTo) {
      const checkTime = () => {
        const now = new Date()
        const currentHour = now.getHours().toString().padStart(2, '0')
        const currentMinute = now.getMinutes().toString().padStart(2, '0')
        const currentTime = `${currentHour}:${currentMinute}`

        let valid = false
        if (availableFrom < availableTo) {
          // Standard same-day window (e.g., 07:30 to 16:00)
          valid = currentTime >= availableFrom && currentTime <= availableTo
        } else {
          // Cross-midnight window (e.g., 18:00 to 02:00)
          valid = currentTime >= availableFrom || currentTime <= availableTo
        }

        setIsTimeValid(valid)
      }

      checkTime()
      const intervalId = setInterval(checkTime, 60000) // Re-verify every 60 seconds
      return () => clearInterval(intervalId)
    }
  }, [isTimeBound, availableFrom, availableTo])

  // Prevent navigation and alert the user if they try to access a closed menu
  const handleCardClick = (e: React.MouseEvent) => {
    if (!inStock) {
      e.preventDefault()
      return
    }

    // Only block the user if the store is LIVE. 
    // If the store is in Pre-Order mode, we ALLOW them to click so they can pre-order for tomorrow!
    if (isStoreLive && isTimeBound && !isTimeValid) {
      e.preventDefault()
      const sectionName = menuSection ? menuSection.charAt(0).toUpperCase() + menuSection.slice(1) : 'Menu'
      alert(
        `Oops! The ${sectionName} menu is currently closed.\n\nIt is only available between ${formatTime(availableFrom)} and ${formatTime(availableTo)}.\nPlease check back tomorrow or wait for Pre-Order mode to secure this item for tomorrow!`
      )
    }
  }

  // The item is visually locked ONLY if it's out of stock OR if the store is live but the time has passed.
  const isUnavailable = !inStock || (isStoreLive && isTimeBound && !isTimeValid && mounted)

  return (
    <Link 
      href={`/product/${id}`}
      onClick={handleCardClick}
      className={`group block bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col justify-between ${
        isUnavailable 
          ? 'opacity-85 shadow-none cursor-not-allowed' 
          : 'shadow-xs hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className={`object-cover transition-transform duration-500 ${isUnavailable ? 'grayscale-[30%]' : 'group-hover:scale-105'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Utensils className="w-8 h-8 text-gray-300" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-20">
          <span className="bg-[#0A2E1D]/90 backdrop-blur-md text-[#EAA823] text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-xs">
            {category}
          </span>
          
          {isTimeBound && menuSection && (
            <span className="flex items-center gap-1 bg-amber-100/95 backdrop-blur-md text-amber-900 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase shadow-xs">
              <Clock className="w-3 h-3" />
              {menuSection}
            </span>
          )}
        </div>

        {/* Pre-Order Identification Badge */}
        {!isStoreLive && mounted && inStock && (
          <div className="absolute top-3 right-3 z-20">
            <span className="bg-amber-500 text-[#0A2E1D] text-[9px] font-black px-2.5 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pre-Order
            </span>
          </div>
        )}

        {/* OVERLAYS FOR OUT OF STOCK OR CLOSED MENUS */}
        {!inStock ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-red-600 text-white font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Sold Out
            </span>
          </div>
        ) : (isStoreLive && isTimeBound && !isTimeValid && mounted) ? (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 text-center z-10">
            <span className="bg-amber-500 text-[#0A2E1D] font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider mb-2 shadow-lg">
              Menu Closed
            </span>
            <span className="text-white text-[10px] font-bold bg-black/50 px-3 py-1 rounded-lg">
              Available from {formatTime(availableFrom)} tomorrow
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`text-base font-extrabold leading-snug line-clamp-1 transition-colors ${
            isUnavailable ? 'text-gray-600' : 'text-[#0A2E1D] group-hover:text-[#EAA823]'
          }`}>
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
            <span className="text-[10px] text-gray-400 font-semibold block">
              {!isStoreLive && mounted ? 'Pre-Order From' : 'From'}
            </span>
            <span className={`text-base sm:text-lg font-black ${isUnavailable ? 'text-gray-500' : 'text-[#0A2E1D]'}`}>
              ₦{Number(price).toLocaleString()}
            </span>
          </div>

          <div className={`p-2.5 rounded-full transition-colors shadow-xs ${
            isUnavailable 
              ? 'bg-gray-200 text-gray-400' 
              : 'bg-[#0A2E1D] group-hover:bg-[#EAA823] text-white group-hover:text-[#0A2E1D]'
          }`}>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}