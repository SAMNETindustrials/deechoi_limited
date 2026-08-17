'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, Search, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'

interface StorefrontHeaderUnifiedProps {
  onMrTellOpen?: () => void
}

export function StorefrontHeaderUnified({ onMrTellOpen }: StorefrontHeaderUnifiedProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { itemCount } = useCart()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Our Menu', href: '#our-menu-section' },
    { label: 'Book Us', href: '/book-us' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0A2E1D] to-[#072215] text-white shadow-lg">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between h-20 px-6 gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="relative w-12 h-12">
              <Image
                src="/logo-deechoi.png"
                alt="DEECHOI Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="ml-2 font-bold text-lg text-[#EAA823]">DEECHOI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-8 items-center flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-white hover:text-[#EAA823] transition text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search with Mr. Tell */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/20 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Search food, dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm text-white placeholder:text-gray-300 flex-1"
            />
            <button
              type="button"
              onClick={onMrTellOpen}
              className="p-1.5 rounded-full hover:bg-[#EAA823]/20 transition text-[#EAA823]"
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
            </button>
          </form>

          {/* Right Side - Cart and Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 rounded-full w-10 h-10">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EAA823] text-[#0A2E1D] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button
              onClick={onMrTellOpen}
              className="hidden lg:flex gap-2 bg-[#EAA823] text-[#0A2E1D] hover:bg-[#f5d547] rounded-full px-4 py-2 font-bold text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Mr. Tell
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-16 px-4 gap-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Mobile Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="relative w-10 h-10">
              <Image
                src="/logo-deechoi.png"
                alt="DEECHOI Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Mobile Right Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMrTellOpen}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Ask Mr. Tell"
            >
              <div className="relative w-5 h-5">
                <Image
                  src="/mr-tell.jpg"
                  alt="Mr. Tell"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
            </button>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 rounded-full w-10 h-10 p-0">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EAA823] text-[#0A2E1D] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 py-3 border-t border-white/10">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-2 border border-white/20">
            <Search className="w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm text-white placeholder:text-gray-300 flex-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <nav className="md:hidden border-t border-white/10 bg-black/40 backdrop-blur-md">
            <div className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-4 py-2.5 text-white hover:text-[#EAA823] hover:bg-white/10 rounded-lg transition font-medium text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  onMrTellOpen?.()
                  setIsMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-[#EAA823] hover:bg-white/10 rounded-lg transition font-medium text-sm flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat with Mr. Tell
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
