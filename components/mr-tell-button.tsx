'use client'

import { MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface MrTellButtonProps {
  onClick: () => void
  isDarkMode?: boolean
}

export function MrTellButton({ onClick, isDarkMode = false }: MrTellButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show button after a short delay
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
      }`}
    >
      <button
        onClick={onClick}
        className={`group relative w-16 h-16 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden border-2 border-[#EAA823] ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#1a1f2e] to-[#131821] hover:from-[#252d3d] hover:to-[#1a202c]'
            : 'bg-gradient-to-br from-[#0A2E1D] to-[#072215] hover:from-[#0d3a24] hover:to-[#082818]'
        }`}
        title="Chat with Mr. Tell"
      >
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#EAA823]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Image Container */}
        <div className="relative z-10 flex flex-col items-center gap-0.5">
          <div className="relative w-7 h-7">
            <Image
              src="/mr-tell.jpg"
              alt="Mr. Tell"
              fill
              className="object-cover rounded-full"
            />
          </div>
          <span className="text-[10px] font-bold text-[#EAA823] leading-none">
            Ask Me
          </span>
        </div>

        {/* Pulsing Ring */}
        <div className="absolute inset-0 border-2 border-[#EAA823] rounded-full opacity-0 group-hover:opacity-100 scale-100 group-hover:scale-125 transition-all duration-300 pointer-events-none" />

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-[#EAA823]/50">
          Need help? Talk to Mr. Tell
          <div className="absolute top-full right-2 w-2 h-2 bg-gray-900 transform rotate-45 border-r border-b border-[#EAA823]/50" />
        </div>
      </button>
    </div>
  )
}
