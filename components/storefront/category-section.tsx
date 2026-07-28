'use client'

import Link from 'next/link'
import { UtensilsCrossed, Sandwich, Pizza, Utensils, Drumstick } from 'lucide-react'

export function CategorySection() {
  const categories = [
    { name: 'Meals', icon: UtensilsCrossed, color: 'from-red-500 to-red-600' },
    { name: 'Burgers', icon: Sandwich, color: 'from-orange-500 to-orange-600' },
    { name: 'Pizza', icon: Pizza, color: 'from-yellow-500 to-orange-500' },
    { name: 'Pasta', icon: Utensils, color: 'from-amber-500 to-yellow-600' },
    { name: 'Chicken', icon: Drumstick, color: 'from-orange-600 to-red-600' },
  ]

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Popular Categories</h2>
          </div>
          <Link href="/menu" className="text-accent font-semibold text-sm md:text-base flex items-center gap-2 hover:gap-3 transition-all">
            See all
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <button
                key={category.name}
                className="group relative overflow-hidden rounded-2xl h-40 md:h-48 cursor-pointer transition-transform hover:scale-105"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                {/* Icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <IconComponent className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  <p className="text-white font-bold text-base md:text-lg text-center">{category.name}</p>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-white font-semibold text-sm">Explore</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
