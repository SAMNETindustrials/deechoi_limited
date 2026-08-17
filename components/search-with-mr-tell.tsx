'use client'

import { Search, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface SearchWithMrTellProps {
  value: string
  onChange: (value: string) => void
  onMrTellClick?: () => void
  placeholder?: string
  isDarkMode?: boolean
}

export function SearchWithMrTell({
  value,
  onChange,
  onMrTellClick,
  placeholder = 'Search food, dishes...',
  isDarkMode = false,
}: SearchWithMrTellProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div
      className={`relative flex items-center gap-1 rounded-full transition-all duration-200 ${
        isDarkMode
          ? `border ${
              isFocused
                ? 'border-[#EAA823] bg-[#0F1419]'
                : 'border-[#EAA823]/20 bg-[#131821]'
            }`
          : `border-2 ${
              isFocused
                ? 'border-[#0A2E1D] bg-white'
                : 'border-gray-300 bg-gray-50'
            }`
      } px-4 py-2.5`}
    >
      <Search
        className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isDarkMode
            ? isFocused
              ? 'text-[#EAA823]'
              : 'text-gray-500'
            : isFocused
              ? 'text-[#0A2E1D]'
              : 'text-gray-400'
        }`}
      />

      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`flex-1 border-none outline-none bg-transparent text-sm ${
          isDarkMode
            ? 'text-white placeholder:text-gray-500'
            : 'text-slate-800 placeholder:text-gray-500'
        }`}
      />

      {value ? (
        <button
          onClick={() => onChange('')}
          className={`p-1 rounded-full transition ${
            isDarkMode
              ? 'hover:bg-[#EAA823]/20 text-gray-400'
              : 'hover:bg-gray-200 text-gray-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}

      {onMrTellClick && (
        <button
          type="button"
          onClick={onMrTellClick}
          className="p-1.5 rounded-full hover:bg-[#EAA823]/20 transition group relative"
          title="Ask Mr. Tell for help"
        >
          <div className="relative w-4 h-4">
            <Image
              src="/mr-tell.jpg"
              alt="Mr. Tell"
              fill
              className="object-cover rounded-full"
            />
          </div>
          {/* Quick Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white border border-[#EAA823]/50 pointer-events-none">
            Ask Mr. Tell
          </div>
        </button>
      )}
    </div>
  )
}
