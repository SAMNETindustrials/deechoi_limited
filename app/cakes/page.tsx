'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Menu, 
  ShoppingCart, 
  Search, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Leaf, 
  Headphones, 
  ChevronRight,
  Gift,
  Tag,
  Utensils,
  Pizza,
  Drumstick,
  Heart,
  X,
  Info,
  PhoneCall,
  Calendar,
  Home,
  Star,
  Share2,
  MessageCircle,
  Instagram,
  Facebook,
  Phone,
  Cake,
  Sparkles,
  Layers,
  Bot,
  User,
  Loader2,
  Send,
  CheckCircle2,
  CalendarCheck,
  Check,
  RefreshCw
} from 'lucide-react'

import { ProductCard } from '@/components/storefront/product-card'
import { ProductDetailModal } from '@/components/storefront/product-detail-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/lib/cart-context'

interface CakeProduct {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
  category: string
  size: string
  flavor: string
  tiers: { layers: number; price: number; label?: string }[]
}

// Floating Social Handles Config
const SOCIAL_HANDLES = [
  {
    name: 'WhatsApp',
    href: 'https://wa.me/2347031385337',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/deechoi01',
    icon: <Instagram className="w-5 h-5" />,
    color: 'bg-pink-600 hover:bg-pink-700 text-white',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@deechoi01',
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.81V7.65a6.34 6.34 0 0 0-1 .08 6.34 6.34 0 1 0 7.34 6.27V9.07a8.28 8.28 0 0 0 4.77 1.52v-3.9a4.85 4.85 0 0 1-1-.00z" />
      </svg>
    ),
    color: 'bg-slate-900 hover:bg-black text-white',
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/deechoiltd',
    icon: <Facebook className="w-5 h-5" />,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    name: 'Call Us',
    href: 'tel:+2347046145982',
    icon: <Phone className="w-4 h-4" />,
    color: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
]

export default function CakesPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { itemCount } = useCart()

  // Navigation & UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Database Products
  const [cakes, setCakes] = useState<CakeProduct[]>([])
  const [selectedSize, setSelectedSize] = useState<'All' | '6 inches' | '7 inches'>('All')
  const [selectedFlavor, setSelectedFlavor] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Live Price Estimator State
  const [builderSize, setBuilderSize] = useState<'6' | '7'>('6')
  const [builderLayers, setBuilderLayers] = useState<1 | 2 | 3>(1)
  const [builderFlavors, setBuilderFlavors] = useState<string[]>(['Vanilla'])
  const [aiSyncNotice, setAiSyncNotice] = useState<string | null>(null)

  // Mobile Price Guide Matrix Segmented Control
  const [activeMatrixTab, setActiveMatrixTab] = useState<'6' | '7'>('6')

  // AI Chatbot State
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; synced?: boolean }[]>([
    {
      role: 'ai',
      text: "Hello! I am your De-echoi Event Cake Preparatory Booking Agent. I am connected live to our bakery database! Tell me the size (6\" or 7\"), number of layers (1, 2, or 3), or flavors you want and I will automatically configure your estimator in real-time.",
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Product Modal
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchCakesFromSupabase()
  }, [])

  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  const fetchCakesFromSupabase = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .ilike('category', 'Cakes')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const formatted: CakeProduct[] = data.map((item) => {
          const isSeven = item.name.includes('7') || item.description?.includes('7')
          const details = item.cake_details || {}
          const itemPrice = Number(item.price) && !isNaN(Number(item.price)) ? Number(item.price) : (isSeven ? 26000 : 20000)

          return {
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: itemPrice,
            image_url: item.image_url || '/cakes.jpg',
            in_stock: item.in_stock ?? true,
            category: item.category || 'Cakes',
            size: details.size || (isSeven ? '7 inches' : '6 inches'),
            flavor: details.primaryFlavor || (item.name.includes('Chocolate') ? 'Chocolate' : item.name.includes('Red Velvet') ? 'Red Velvet' : 'Vanilla'),
            tiers: details.tiers || (isSeven 
              ? [{ layers: 1, price: 26000 }, { layers: 2, price: 46000 }, { layers: 3, price: 55000 }]
              : [{ layers: 1, price: 20000 }, { layers: 2, price: 38500 }, { layers: 3, price: 52000 }]),
          }
        })
        setCakes(formatted)
      } else {
        setCakes([])
      }
    } catch (err) {
      console.error('Error fetching cakes from Supabase:', err)
      setCakes([])
    } finally {
      setLoading(false)
    }
  }

  // Exact Calculation Matrix Logic
  const calculateBuilderPrice = () => {
    if (builderSize === '6') {
      if (builderLayers === 1) {
        if (builderFlavors[0] === 'Chocolate') return 21000
        if (builderFlavors[0] === 'Red Velvet') return 20500
        return 20000
      }
      if (builderLayers === 2) {
        const isMulti = builderFlavors[0] !== (builderFlavors[1] || builderFlavors[0])
        if (isMulti) return 41000
        if (builderFlavors[0] === 'Chocolate') return 40000
        if (builderFlavors[0] === 'Red Velvet') return 39000
        return 38500
      }
      if (builderLayers === 3) {
        const uniqueFlavors = new Set(builderFlavors.slice(0, 3)).size
        if (uniqueFlavors >= 2) return 61500
        if (builderFlavors[0] === 'Chocolate') return 53000
        if (builderFlavors[0] === 'Red Velvet') return 51000
        return 52000
      }
    } else {
      // 7 Inches
      if (builderLayers === 1) {
        if (builderFlavors[0] === 'Chocolate') return 27500
        if (builderFlavors[0] === 'Red Velvet') return 27000
        return 26000
      }
      if (builderLayers === 2) {
        const isMulti = builderFlavors[0] !== (builderFlavors[1] || builderFlavors[0])
        if (isMulti) return 45000
        if (builderFlavors[0] === 'Chocolate') return 50000
        if (builderFlavors[0] === 'Red Velvet') return 49000
        return 46000
      }
      if (builderLayers === 3) {
        const uniqueFlavors = new Set(builderFlavors.slice(0, 3)).size
        if (uniqueFlavors >= 2) return 69000
        if (builderFlavors[0] === 'Chocolate') return 65000
        if (builderFlavors[0] === 'Red Velvet') return 63500
        return 55000
      }
    }
    return 20000
  }

  // Real-time AI NLP extraction & sync
  const handleSendMessage = () => {
    const userQuery = input.trim()
    if (!userQuery) return

    setMessages((prev) => [...prev, { role: 'user', text: userQuery }])
    setInput('')
    setIsTyping(true)

    const lower = userQuery.toLowerCase()
    let extractedSize: '6' | '7' | null = null
    let extractedLayers: 1 | 2 | 3 | null = null
    let extractedFlavors: string[] = []

    if (lower.includes('7') || lower.includes('seven')) {
      extractedSize = '7'
    } else if (lower.includes('6') || lower.includes('six')) {
      extractedSize = '6'
    }

    if (lower.includes('3 layer') || lower.includes('three layer') || lower.includes('3-layer') || lower.includes('3 tier') || lower.includes('three tier')) {
      extractedLayers = 3
    } else if (lower.includes('2 layer') || lower.includes('two layer') || lower.includes('2-layer') || lower.includes('2 tier') || lower.includes('two tier')) {
      extractedLayers = 2
    } else if (lower.includes('1 layer') || lower.includes('single layer') || lower.includes('one layer') || lower.includes('1 tier')) {
      extractedLayers = 1
    }

    const hasVanilla = lower.includes('vanilla')
    const hasChocolate = lower.includes('chocolate') || lower.includes('choco')
    const hasRedVelvet = lower.includes('red velvet') || lower.includes('velvet')

    if (hasVanilla) extractedFlavors.push('Vanilla')
    if (hasChocolate) extractedFlavors.push('Chocolate')
    if (hasRedVelvet) extractedFlavors.push('Red Velvet')

    setTimeout(() => {
      let appliedDetails = []

      if (extractedSize) {
        setBuilderSize(extractedSize)
        appliedDetails.push(`${extractedSize}" Size`)
      }

      if (extractedLayers) {
        setBuilderLayers(extractedLayers)
        appliedDetails.push(`${extractedLayers} Layer${extractedLayers > 1 ? 's' : ''}`)

        if (extractedFlavors.length > 0) {
          const newFlavors: string[] = []
          for (let i = 0; i < extractedLayers; i++) {
            newFlavors.push(extractedFlavors[i % extractedFlavors.length])
          }
          setBuilderFlavors(newFlavors)
          appliedDetails.push(`Flavors: ${newFlavors.join(' + ')}`)
        } else {
          if (extractedLayers === 1) setBuilderFlavors(['Vanilla'])
          if (extractedLayers === 2) setBuilderFlavors(['Vanilla', 'Chocolate'])
          if (extractedLayers === 3) setBuilderFlavors(['Vanilla', 'Chocolate', 'Red Velvet'])
        }
      } else if (extractedFlavors.length > 0) {
        const newFlavors: string[] = []
        for (let i = 0; i < builderLayers; i++) {
          newFlavors.push(extractedFlavors[i % extractedFlavors.length])
        }
        setBuilderFlavors(newFlavors)
        appliedDetails.push(`Flavors: ${newFlavors.join(' + ')}`)
      }

      let responseText = ''
      if (appliedDetails.length > 0) {
        setAiSyncNotice(`⚡ Live Estimator updated to: ${appliedDetails.join(' • ')}`)
        setTimeout(() => setAiSyncNotice(null), 5000)

        responseText = `✨ I've updated your Live Price Estimator to ${appliedDetails.join(', ')}! As I am still in preparatory training mode, you can practice customizing and click "Book Now" whenever you're ready.`
      } else {
        responseText = `Thanks for your inquiry! I am your Event Cake Preparatory Agent (connected to the De-echoi live database). For weddings, birthdays, and celebrations, let me know if you prefer 6" or 7", how many layers (1, 2, or 3), and your favorite flavors, and I will configure the live estimator for you!`
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: responseText,
          synced: appliedDetails.length > 0,
        },
      ])
      setIsTyping(false)
    }, 850)
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const scrollToMenu = () => {
    const el = document.getElementById('our-cake-menu')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredCakes = cakes.filter((cake) => {
    const matchesSize = selectedSize === 'All' || cake.size === selectedSize
    const matchesFlavor = selectedFlavor === 'All' || cake.flavor?.toLowerCase().includes(selectedFlavor.toLowerCase())
    const matchesSearch = cake.name.toLowerCase().includes(searchQuery.toLowerCase()) || cake.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSize && matchesFlavor && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#072d1d] text-slate-800 font-sans pb-12 relative selection:bg-amber-500 selection:text-[#072d1d]">
      
      {/* 1. STICKY MOBILE & DESKTOP HEADER */}
      <header className="sticky top-0 z-50 bg-[#072d1d]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 border-b border-emerald-900/40">
        <div className="flex items-center justify-between max-w-6xl mx-auto h-12">
          {/* Menu Toggle Button (Mobile) */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden text-white p-2 rounded-full hover:bg-white/10 transition active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Brand Logo */}
          <Link href="/" className="flex items-center justify-center">
            <div className="relative w-40 sm:w-52 h-10">
              <Image 
                src="/logo.png" 
                alt="De-echoi Limited Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-white">
            <Link href="/" className="hover:text-amber-400 transition">Home</Link>
            <Link href="/cakes" className="text-amber-400 flex items-center gap-1 font-bold bg-[#12422C] px-3.5 py-1.5 rounded-full border border-amber-400/30">
              <Cake className="w-4 h-4" />
              <span>Cakes</span>
            </Link>
            <Link href="/#our-menu-section" className="hover:text-amber-400 transition">Meals</Link>
            <Link href="/about" className="hover:text-amber-400 transition">About</Link>
            <Link href="/contact" className="hover:text-amber-400 transition">Contact</Link>
          </nav>

          {/* Cart Button */}
          <Link 
            href="/cart"
            aria-label="View Shopping Cart"
            className="relative bg-white text-[#072d1d] p-2.5 rounded-full shadow-md active:scale-95 transition hover:bg-amber-400"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#072d1d]">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION DRAWER (Mobile) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)} />

          <aside className="relative w-[82%] max-w-[320px] bg-slate-50 h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="bg-[#072d1d] p-6 text-white relative rounded-b-3xl shadow-md">
              <button 
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close Navigation Menu"
                className="absolute top-4 right-4 bg-white/10 p-1.5 rounded-full text-white hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full border-2 border-amber-500 bg-emerald-900 overflow-hidden flex-shrink-0 shadow-md">
                  <Image 
                    src="/logo.png" 
                    alt="De-echoi Logo Avatar" 
                    fill 
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">De-echoi Limited</h3>
                  <p className="text-[10px] text-emerald-200/80">Signature Celebration Cakes</p>
                </div>
              </div>
            </div>

            <nav className="p-5 space-y-6 flex-1 text-slate-700">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-3">
                  Store Navigation
                </p>
                <div className="space-y-1">
                  <Link 
                    href="/" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <Home className="w-4 h-4 text-[#072d1d]" />
                    <span>Home</span>
                  </Link>

                  <Link 
                    href="/cakes" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 text-amber-900 font-bold text-xs transition border border-amber-200"
                  >
                    <div className="flex items-center gap-3">
                      <Cake className="w-4 h-4 text-amber-600" />
                      <span>Cakes Collection</span>
                    </div>
                    <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </Link>

                  <Link 
                    href="/cart" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4 text-[#072d1d]" />
                      <span>Shopping Cart</span>
                    </div>
                    {itemCount > 0 && (
                      <span className="bg-[#072d1d] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {itemCount}
                      </span>
                    )}
                  </Link>

                  <Link 
                    href="/#our-menu-section" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <Utensils className="w-4 h-4 text-[#072d1d]" />
                    <span>Food & Meals</span>
                  </Link>

                  <Link 
                    href="/about" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <Info className="w-4 h-4 text-[#072d1d]" />
                    <span>About Us</span>
                  </Link>

                  <Link 
                    href="/contact" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition"
                  >
                    <PhoneCall className="w-4 h-4 text-[#072d1d]" />
                    <span>Contact</span>
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-3">
                  Cake Quick Links
                </p>
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      scrollToMenu()
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-800 font-medium text-xs transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-[#072d1d]" />
                      <span>Explore Live Designs</span>
                    </div>
                    <span className="bg-emerald-100 text-[#072d1d] text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {cakes.length} Cakes
                    </span>
                  </button>
                </div>
              </div>
            </nav>

            <div className="p-4 border-t border-slate-200 bg-white text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                De-echoi Limited &copy; 2026
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-6 max-w-6xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-7 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#0a3a26]/90 border border-emerald-600/40 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <Cake className="w-3.5 h-3.5" />
              <span>Celebration Cakes & Event Bakes</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Customized Layers, <br />
              <span className="text-amber-400">Unmatched Flavors.</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-lg">
              Freshly baked 6" & 7" tiered cakes in Port Harcourt. Choose 1, 2, or 3 layers with pure Vanilla, Rich Chocolate, and Signature Red Velvet.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a 
                href="#custom-builder" 
                className="bg-amber-500 hover:bg-amber-400 text-[#072d1d] px-5 py-3 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Live Price Estimator
              </a>
              <a 
                href="#pricing-grid" 
                className="border border-amber-400/40 text-white hover:bg-white/10 px-5 py-3 rounded-full font-bold text-xs sm:text-sm transition"
              >
                Price Breakdown
              </a>
            </div>
          </div>

          <div className="md:col-span-5 relative flex justify-center mt-2 md:mt-0">
            <div className="relative w-full max-w-[280px] sm:max-w-[340px] aspect-square rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-[#0a3a26]">
              <Image
                src="/cakes.jpg"
                alt="De-echoi Signature Cake"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#072d1d]/90 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 text-white">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Starting From</span>
                  <span className="text-lg font-black">₦20,000</span>
                </div>
                <span className="text-[10px] bg-amber-500 text-[#072d1d] font-bold px-2.5 py-1 rounded-full">
                  6" & 7" Available
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. STICKY SEARCH BAR */}
      <div className="sticky top-[57px] z-40 bg-[#072d1d] px-4 sm:px-6 lg:px-8 py-2.5 max-w-6xl mx-auto">
        <div className="relative flex items-center max-w-md mx-auto md:max-w-none">
          <input
            type="text"
            placeholder="Search live cake flavor (vanilla, chocolate, red velvet)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-full py-2.5 pl-11 pr-10 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute left-4 w-4 h-4 text-slate-400" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-700 bg-slate-100 p-1 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN BODY CONTAINER */}
      <main className="bg-slate-50 rounded-t-[32px] pt-6 px-4 sm:px-6 lg:px-8 space-y-8 max-w-6xl mx-auto min-h-screen">

        {/* Feature Highlights Ribbon */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center gap-1 border-r border-slate-100 pr-1">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-700 leading-tight">Same Day Baking</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-r border-slate-100 pr-1">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-700 leading-tight">100% Hygienic</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-r border-slate-100 pr-1">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-700 leading-tight">Pure Buttercream</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 bg-slate-100 rounded-full text-[#072d1d]">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-700 leading-tight">Event Support</span>
          </div>
        </div>

        {/* 5. INTERACTIVE LIVE ESTIMATOR & AI CONSULTATION HUB */}
        <section id="custom-builder" className="bg-[#072d1d] rounded-3xl p-4 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-600/30">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/60">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-black">Live Cake Customizer & AI Agent</h2>
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-0.5">
                Customize dimensions manually or chat with our AI agent to auto-populate your selection.
              </p>
            </div>

            {aiSyncNotice && (
              <div className="bg-[#0a3a26] border border-amber-400 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-200 w-fit">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{aiSyncNotice}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Estimator Column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#041a11] p-4 sm:p-6 rounded-2xl border border-emerald-700/30 space-y-4">
                
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Live Price Estimator
                  </span>
                  <span className="text-[10px] bg-[#072d1d] text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/40">
                    Real-time
                  </span>
                </div>

                {/* 1. Size */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase">1. Cake Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBuilderSize('6')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition active:scale-95 ${
                        builderSize === '6'
                          ? 'bg-amber-500 text-[#072d1d] border-amber-500 shadow-md'
                          : 'bg-[#072d1d] text-gray-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      6 Inches (from ₦20,000)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderSize('7')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition active:scale-95 ${
                        builderSize === '7'
                          ? 'bg-amber-500 text-[#072d1d] border-amber-500 shadow-md'
                          : 'bg-[#072d1d] text-gray-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      7 Inches (from ₦26,000)
                    </button>
                  </div>
                </div>

                {/* 2. Layers */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase">2. Layers Count</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          setBuilderLayers(l as 1 | 2 | 3)
                          if (l === 1) setBuilderFlavors([builderFlavors[0] || 'Vanilla'])
                          if (l === 2) setBuilderFlavors([builderFlavors[0] || 'Vanilla', builderFlavors[1] || 'Chocolate'])
                          if (l === 3) setBuilderFlavors([builderFlavors[0] || 'Vanilla', builderFlavors[1] || 'Chocolate', 'Red Velvet'])
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition active:scale-95 ${
                          builderLayers === l
                            ? 'bg-amber-500 text-[#072d1d] border-amber-500 shadow-md'
                            : 'bg-[#072d1d] text-gray-300 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {l} Layer{l > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Flavors */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase">3. Choose Flavor Per Layer</label>
                  <div className="space-y-2">
                    {Array.from({ length: builderLayers }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-200/80 w-16 font-semibold">Layer {idx + 1}:</span>
                        <select
                          value={builderFlavors[idx] || 'Vanilla'}
                          onChange={(e) => {
                            const updated = [...builderFlavors]
                            updated[idx] = e.target.value
                            setBuilderFlavors(updated)
                          }}
                          className="flex-1 bg-[#072d1d] border border-emerald-700/40 text-white text-xs rounded-xl p-2 outline-none focus:border-amber-400"
                        >
                          <option value="Vanilla">Vanilla</option>
                          <option value="Chocolate">Chocolate</option>
                          <option value="Red Velvet">Red Velvet</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total and Book Now */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-emerald-200/80 block font-medium">Estimated Total</span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">
                      ₦{calculateBuilderPrice().toLocaleString()}
                    </div>
                    <span className="text-[10px] text-gray-300">
                      {builderSize}" • {builderLayers} Layer{builderLayers > 1 ? 's' : ''} ({builderFlavors.slice(0, builderLayers).join(' + ')})
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                      const matchCake = cakes.find(c => c.size.includes(builderSize)) || cakes[0]
                      if (matchCake) {
                        setSelectedProductId(matchCake.id)
                        setShowModal(true)
                      }
                    }}
                    disabled={cakes.length === 0}
                    className="bg-amber-500 hover:bg-amber-400 text-[#072d1d] font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Book Now
                  </Button>
                </div>

              </div>
            </div>

            {/* Right AI Chatbot Column */}
            <div className="lg:col-span-6 bg-[#041a11] rounded-2xl flex flex-col h-[440px] sm:h-[470px] border border-emerald-700/40 overflow-hidden shadow-2xl">
              <div className="p-3.5 bg-[#03130c] flex items-center justify-between border-b border-emerald-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#072d1d] text-amber-400 rounded-full border border-amber-400/20">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-white">Event Cake Preparatory Agent</span>
                    <span className="text-[9px] text-amber-400">Live Database AI Assistant</span>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-700/40">
                  Active
                </span>
              </div>

              {/* Chat Message Stream */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-black/20">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        m.role === 'ai' ? 'bg-amber-500 text-[#072d1d]' : 'bg-white/20 text-white'
                      }`}
                    >
                      {m.role === 'ai' ? <Bot size={12} /> : <User size={12} />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                        m.role === 'ai'
                          ? 'bg-[#072d1d] text-emerald-50 border border-emerald-700/30'
                          : 'bg-amber-500 text-[#072d1d] font-bold shadow-md'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="text-xs text-amber-400 flex items-center gap-2 pl-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[11px]">Evaluating cake mix & updating estimator...</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-[#03130c] flex gap-2 border-t border-emerald-800/40">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="e.g. 7 inch 2 layers chocolate and red velvet..."
                  className="flex-1 bg-[#072d1d] border border-emerald-700/40 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-amber-500 hover:bg-amber-400 text-[#072d1d] p-2.5 rounded-xl font-bold transition active:scale-95 flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 6. MOBILE-FIRST PRICE MATRIX TABS */}
        <section className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm" id="pricing-grid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Standard Pricing</span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Official Cake Price Breakdown</h3>
            </div>

            {/* Segmented Switcher for 6" vs 7" */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveMatrixTab('6')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeMatrixTab === '6' ? 'bg-[#072d1d] text-amber-400 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Inches (from ₦20,000)
              </button>
              <button
                onClick={() => setActiveMatrixTab('7')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeMatrixTab === '7' ? 'bg-[#072d1d] text-amber-400 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Inches (from ₦26,000)
              </button>
            </div>
          </div>

          {/* 6 Inches View */}
          {activeMatrixTab === '6' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="font-bold text-xs text-slate-900 block mb-2">Vanilla Cake (6")</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">1 Layer</span><strong className="text-[#072d1d]">₦20,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">2 Layers</span><strong className="text-[#072d1d]">₦38,500</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">3 Layers</span><strong className="text-[#072d1d]">₦52,000</strong></div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="font-bold text-xs text-slate-900 block mb-2">Chocolate Cake (6")</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">1 Layer</span><strong className="text-[#072d1d]">₦21,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">2 Layers</span><strong className="text-[#072d1d]">₦40,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">3 Layers</span><strong className="text-[#072d1d]">₦53,000</strong></div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="font-bold text-xs text-slate-900 block mb-2">Red Velvet Cake (6")</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">1 Layer</span><strong className="text-[#072d1d]">₦20,500</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">2 Layers</span><strong className="text-[#072d1d]">₦39,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">3 Layers</span><strong className="text-[#072d1d]">₦51,000</strong></div>
                </div>
              </div>

              <div className="bg-[#072d1d] text-white p-3.5 rounded-2xl border border-amber-400/30">
                <span className="font-bold text-xs text-amber-400 block mb-2">Multi-Flavor Mix Combinations (6")</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-[#041a11] p-2.5 rounded-xl border border-emerald-700/40">
                    <span className="text-[10px] text-emerald-200 block">2 Layers / 2 Flavors</span>
                    <strong className="text-amber-400 text-sm">₦41,000</strong>
                  </div>
                  <div className="bg-[#041a11] p-2.5 rounded-xl border border-emerald-700/40">
                    <span className="text-[10px] text-emerald-200 block">3 Layers / 3 Flavors</span>
                    <strong className="text-amber-400 text-sm">₦61,500</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7 Inches View */}
          {activeMatrixTab === '7' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="font-bold text-xs text-slate-900 block mb-2">Vanilla Cake (7")</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">1 Layer</span><strong className="text-[#072d1d]">₦26,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">2 Layers</span><strong className="text-[#072d1d]">₦46,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">3 Layers</span><strong className="text-[#072d1d]">₦55,000</strong></div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="font-bold text-xs text-slate-900 block mb-2">Chocolate Cake (7")</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">1 Layer</span><strong className="text-[#072d1d]">₦27,500</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">2 Layers</span><strong className="text-[#072d1d]">₦50,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">3 Layers</span><strong className="text-[#072d1d]">₦65,000</strong></div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                <span className="font-bold text-xs text-slate-900 block mb-2">Red Velvet Cake (7")</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">1 Layer</span><strong className="text-[#072d1d]">₦27,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">2 Layers</span><strong className="text-[#072d1d]">₦49,000</strong></div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">3 Layers</span><strong className="text-[#072d1d]">₦63,500</strong></div>
                </div>
              </div>

              <div className="bg-[#072d1d] text-white p-3.5 rounded-2xl border border-amber-400/30">
                <span className="font-bold text-xs text-amber-400 block mb-2">Multi-Flavor Mix Combinations (7")</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-[#041a11] p-2.5 rounded-xl border border-emerald-700/40">
                    <span className="text-[10px] text-emerald-200 block">2 Layers / 2 Flavors</span>
                    <strong className="text-amber-400 text-sm">₦45,000</strong>
                  </div>
                  <div className="bg-[#041a11] p-2.5 rounded-xl border border-emerald-700/40">
                    <span className="text-[10px] text-emerald-200 block">3 Layers / 3 Flavors</span>
                    <strong className="text-amber-400 text-sm">₦69,000</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 7. DYNAMIC CAKE MENU & FILTER SECTION (100% From Database) */}
        <section id="our-cake-menu" className="pt-2 scroll-mt-28">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">Explore Cake Designs</h3>
                <button
                  onClick={fetchCakesFromSupabase}
                  aria-label="Refresh cakes"
                  className="text-slate-400 hover:text-[#072d1d] transition p-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {loading ? 'Fetching live products...' : `Showing ${filteredCakes.length} live product${filteredCakes.length !== 1 ? 's' : ''} from database`}
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', '6 inches', '7 inches'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    selectedSize === sz
                      ? 'bg-[#072d1d] text-amber-400 shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sz}
                </button>
              ))}

              {['All', 'Vanilla', 'Chocolate', 'Red Velvet'].map((flv) => (
                <button
                  key={flv}
                  onClick={() => setSelectedFlavor(flv)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    selectedFlavor === flv
                      ? 'bg-amber-500 text-[#072d1d] shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {flv}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-16 space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-8 h-8 border-3 border-[#072d1d] border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading cakes from database...</p>
            </div>
          ) : filteredCakes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl p-6 border border-dashed border-slate-200 shadow-sm">
              <Cake className="w-10 h-10 text-amber-500/60 mb-2" />
              <h4 className="text-base font-bold text-slate-900">No cakes found in database</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
                {searchQuery || selectedSize !== 'All' || selectedFlavor !== 'All'
                  ? 'No cakes matching your active search or filters.'
                  : 'Run the database SQL seed script to populate cake products or add products from the admin panel.'}
              </p>
              <div className="flex gap-2">
                {(searchQuery || selectedSize !== 'All' || selectedFlavor !== 'All') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSize('All')
                      setSelectedFlavor('All')
                      setSearchQuery('')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={fetchCakesFromSupabase}
                  className="bg-[#072d1d] text-white hover:bg-amber-500 hover:text-[#072d1d] font-bold"
                >
                  Reload Database
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCakes.map((cake) => {
                const startingPrice = Number(cake.price) && !isNaN(Number(cake.price)) 
                  ? Number(cake.price) 
                  : (cake.size.includes('7') ? 26000 : 20000)

                return (
                  <ProductCard
                    key={cake.id}
                    id={cake.id}
                    name={cake.name}
                    description={cake.description || ''}
                    price={startingPrice}
                    imageUrl={cake.image_url}
                    inStock={cake.in_stock}
                    category="Cakes"
                    onViewDetails={(id) => {
                      setSelectedProductId(id)
                      setShowModal(true)
                    }}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* 8. FOOTER SECTION */}
        <footer id="contact" className="bg-[#072d1d] text-white rounded-2xl p-6 space-y-6 mt-8">
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-amber-400">DEECHOI</h3>
            <p className="text-xs text-emerald-100/80">
              Handcrafted bespoke cakes, layered delicacies, and catering delivered across Port Harcourt.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-amber-400 mb-2">Navigation</h4>
              <ul className="space-y-1 text-emerald-100/80">
                <li><Link href="/" className="hover:text-amber-400 transition">Main Storefront</Link></li>
                <li><Link href="/cakes" className="text-amber-400 font-bold">Cakes Collection</Link></li>
                <li><Link href="/about" className="hover:text-amber-400 transition">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 mb-2">Custom Bakes</h4>
              <p className="text-emerald-100/80">
                <a href="mailto:deechoi01@gmail.com" className="hover:text-amber-400 block">
                  deechoi01@gmail.com
                </a>
                <a href="tel:+2347046145982" className="hover:text-amber-400 block mt-1">
                  +234 704 614 5982
                </a>
              </p>
            </div>
          </div>

          <div className="border-t border-emerald-800/60 pt-4 text-xs text-emerald-100/80 space-y-1">
            <h4 className="font-semibold text-amber-400">Bakery Location</h4>
            <p>Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria</p>
          </div>

          <div className="border-t border-emerald-800/60 pt-4 text-center text-[10px] text-emerald-200/60">
            <p>&copy; 2026 DEECHOI LIMITED. All rights reserved.</p>
          </div>
        </footer>

      </main>

      {/* 9. FLOATING ACTION SOCIAL / CALL CONTACT BAR (Mobile & Desktop) */}
      <div className="fixed right-4 bottom-8 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
        <div 
          className={`flex flex-col gap-2.5 items-end transition-all duration-300 ease-in-out pointer-events-auto ${
            isSocialOpen 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        >
          {SOCIAL_HANDLES.map((handle, idx) => (
            <a
              key={handle.name}
              href={handle.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={handle.name}
              style={{ transitionDelay: `${isSocialOpen ? idx * 50 : 0}ms` }}
              className={`group relative flex items-center justify-center w-11 h-11 rounded-full shadow-lg border border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 ${handle.color}`}
            >
              {handle.icon}
              <span className="absolute right-14 bg-slate-900/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md border border-slate-700 pointer-events-none">
                {handle.name}
              </span>
            </a>
          ))}
        </div>

        <button
          onClick={() => setIsSocialOpen(!isSocialOpen)}
          aria-label="Toggle Contact Handles"
          className="pointer-events-auto relative flex items-center justify-center w-13 h-13 rounded-full bg-amber-500 hover:bg-amber-400 text-[#072d1d] shadow-xl border-2 border-white transition-transform duration-300 active:scale-90 hover:scale-105"
        >
          <div className={`transition-transform duration-300 ${isSocialOpen ? 'rotate-90' : 'rotate-0'}`}>
            {isSocialOpen ? (
              <X className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          {!isSocialOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600 border-2 border-white"></span>
            </span>
          )}
        </button>
      </div>

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}