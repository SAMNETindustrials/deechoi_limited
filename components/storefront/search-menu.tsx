'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MENU_DATA, searchMenuItems } from '@/lib/menu-data'

export function SearchMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState(MENU_DATA)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const results = searchMenuItems(searchQuery)
    setResults(results)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  // Group results by category
  const groupedResults = results.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof MENU_DATA>
  )

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for meals, snacks, categories..."
          className="pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No menu items found matching your search
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedResults).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-sm font-semibold text-secondary sticky top-0 bg-muted">
                    {category}
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSearchQuery(item.name)
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                    >
                      <div className="font-medium text-foreground">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
