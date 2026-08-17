'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Heart, 
  ShieldCheck, 
  Leaf, 
  Sparkles, 
  Utensils, 
  Cake, 
  Award, 
  Users, 
  Clock, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#EAA823]" />,
      title: 'Highest Quality & Hygiene',
      description: 'We source the freshest local ingredients and prepare every meal with strict hygiene protocols in our certified kitchen.',
    },
    {
      icon: <Leaf className="w-6 h-6 text-[#EAA823]" />,
      title: 'Authentic Heritage Recipes',
      description: 'Our dishes and bespoke cakes honor authentic culinary traditions while delivering bold, unforgettable flavors.',
    },
    {
      icon: <Heart className="w-6 h-6 text-[#EAA823]" />,
      title: 'Passion & Genuine Care',
      description: 'Every meal and layered cake is prepared with love and precision, making customer satisfaction our ultimate badge of honor.',
    },
    {
      icon: <Clock className="w-6 h-6 text-[#EAA823]" />,
      title: 'Reliable Speed & Freshness',
      description: 'On-time preparation and fast rider dispatch across Port Harcourt ensuring food arrives piping hot and fresh.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white py-16 sm:py-24 overflow-hidden border-b border-amber-500/20 shadow-xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#12422C] text-amber-400 px-4 py-1.5 rounded-full border border-amber-400/30 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The De-echoi Experience</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
            Authentic Flavors, <br />
            <span className="text-[#EAA823]">Crafted with Love & Precision.</span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            From hot delicacies and artisanal pastries to bespoke celebration cakes and luxury event catering in Port Harcourt.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        
        {/* Story Section with Visual Accent */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Our Heritage & Story</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2E1D]">
              Bringing the authentic taste of home to your table.
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              DEECHOI LIMITED started with a clear vision: to combine authentic Nigerian and West African culinary heritage with modern kitchen excellence, hygienic packaging, and swift doorstep delivery.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              From our kitchen in Woji, Port Harcourt, we bake signature tiered celebration cakes and cook delicious hot platters daily. Whether you are ordering a quick lunch, celebrating a milestone, or planning catering for hundreds of guests, we deliver uncompromising flavor and care.
            </p>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-2 border-[#0A2E1D]/10 bg-[#072d1d]">
              <Image
                src="/deechoi_brand.png"
                alt="De-echoi Kitchen & Catering"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-[#0A2E1D]">Port Harcourt Hub</p>
                  <p className="text-[10px] text-gray-500">Woji Delivery & Baking Center</p>
                </div>
                <span className="bg-[#0A2E1D] text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full">
                  100% Fresh Daily
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values Grid */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">What Drives Us</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2E1D]">Our Core Principles</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0A2E1D] flex items-center justify-center shadow-md">
                  {v.icon}
                </div>
                <h3 className="font-extrabold text-sm text-[#0A2E1D]">{v.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Box */}
        <div className="bg-gradient-to-br from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-2xl border border-amber-400/30">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white">Ready for the De-echoi Experience?</h3>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              Browse our fresh meals, build custom celebration cakes, or book us for your next special event.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/">
              <Button className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-extrabold px-8 py-6 rounded-full text-xs sm:text-sm shadow-md transition">
                Order Food Menu
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" className="border-amber-400/50 text-white hover:bg-white/10 font-bold px-8 py-6 rounded-full text-xs sm:text-sm transition">
                Book Catering / Events
              </Button>
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 pt-8 text-center text-xs text-gray-400">
        <p>&copy; 2026 DEECHOI LIMITED. All rights reserved.</p>
      </footer>
    </div>
  )
}