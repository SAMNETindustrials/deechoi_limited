'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Utensils, Clock, X, AlertCircle } from 'lucide-react'

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
  const [showAlertModal, setShowAlertModal] = useState(false) // Custom modal state

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hours = parseInt(h, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${m} ${ampm}`
  }

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

  useEffect(() => {
    if (isTimeBound && availableFrom && availableTo) {
      const checkTime = () => {
        const now = new Date()
        const currentHour = now.getHours().toString().padStart(2, '0')
        const currentMinute = now.getMinutes().toString().padStart(2, '0')
        const currentTime = `${currentHour}:${currentMinute}`

        let valid = false
        if (availableFrom < availableTo) {
          valid = currentTime >= availableFrom && currentTime <= availableTo
        } else {
          valid = currentTime >= availableFrom || currentTime <= availableTo
        }
        setIsTimeValid(valid)
      }
      checkTime()
      const intervalId = setInterval(checkTime, 60000)
      return () => clearInterval(intervalId)
    } else {
      setIsTimeValid(true)
    }
  }, [isTimeBound, availableFrom, availableTo])

  const handleCardClick = (e: React.MouseEvent) => {
    if (!inStock) {
      e.preventDefault()
      return
    }

    if (isStoreLive && isTimeBound && !isTimeValid) {
      e.preventDefault()
      setShowAlertModal(true) // Triggers custom branded popup instead of browser alert()
    }
  }

  const isUnavailable = !inStock || (isStoreLive && isTimeBound && !isTimeValid && mounted)
  const sectionName = menuSection ? menuSection.charAt(0).toUpperCase() + menuSection.slice(1) : 'Menu'

  return (
    <>
      <Link 
        href={`/product/${id}`}
        onClick={handleCardClick}
        className={`group block bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col justify-between ${
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
              <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 items-start z-20">
            <span className="bg-[#0A2E1D]/95 backdrop-blur-md text-[#EAA823] text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase shadow-xs">
              {category}
            </span>
          </div>

          {!isStoreLive && mounted && inStock && (
            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20">
              <span className="bg-amber-500 text-[#0A2E1D] text-[8px] sm:text-[9px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase shadow-md flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Pre-Order
              </span>
            </div>
          )}

          {!inStock ? (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-red-600 text-white font-bold text-[10px] sm:text-xs px-3 py-1 sm:px-4 sm:py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                Sold Out
              </span>
            </div>
          ) : (isStoreLive && isTimeBound && !isTimeValid && mounted) ? (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] flex flex-col items-center justify-center p-3 text-center z-10">
              <span className="bg-amber-500 text-[#0A2E1D] font-black text-[10px] sm:text-xs px-3 py-1 sm:px-4 sm:py-1.5 rounded-full uppercase tracking-wider mb-1 sm:mb-2 shadow-lg">
                Menu Closed
              </span>
              <span className="text-white text-[9px] sm:text-[10px] font-bold bg-black/50 px-2.5 py-0.5 sm:py-1 rounded-lg">
                Available from {formatTime(availableFrom)} tomorrow
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <h3 className={`text-xs sm:text-base font-extrabold leading-snug line-clamp-1 transition-colors ${
              isUnavailable ? 'text-gray-600' : 'text-[#0A2E1D] group-hover:text-[#EAA823]'
            }`}>
              {name}
            </h3>
            {description && (
              <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <div className="pt-2.5 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold block">
                {!isStoreLive && mounted ? 'Pre-Order From' : 'From'}
              </span>
              <span className={`text-sm sm:text-lg font-black ${isUnavailable ? 'text-gray-500' : 'text-[#0A2E1D]'}`}>
                ₦{Number(price).toLocaleString()}
              </span>
            </div>

            <div className={`p-2 sm:p-2.5 rounded-full transition-colors shadow-xs ${
              isUnavailable 
                ? 'bg-gray-200 text-gray-400' 
                : 'bg-[#0A2E1D] group-hover:bg-[#EAA823] text-white group-hover:text-[#0A2E1D]'
            }`}>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>
      </Link>

      {/* CUSTOM BRANDED MODAL (Replaces browser www.de-echoi.com says alert) */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0A2E1D] border-2 border-[#EAA823]/40 p-6 text-white shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#EAA823] flex items-center justify-center mx-auto border border-[#EAA823]/30">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-[#EAA823] uppercase tracking-wider">
                {sectionName} Menu Closed
              </h3>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                Oops! The {sectionName} menu is currently closed.<br /><br />
                It is only available between <strong>{formatTime(availableFrom)}</strong> and <strong>{formatTime(availableTo)}</strong>.<br />
                Please check back tomorrow or wait for Pre-Order mode to secure this item for tomorrow!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAlertModal(false)}
              className="w-full bg-[#EAA823] hover:bg-amber-400 text-[#0A2E1D] font-black text-xs sm:text-sm py-3 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              OK, Understood
            </button>
          </div>
        </div>
      )}
    </>
  )
}