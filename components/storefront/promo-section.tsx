'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Gift, Percent, Clock } from 'lucide-react'

export function PromoSection() {
  return (
    <section className="bg-background py-12 md:py-16 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Exclusive Deals Banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-4 py-2 w-fit">
                <Gift className="w-5 h-5 text-accent" />
                <span className="text-accent font-bold uppercase tracking-wide text-sm">Exclusive Deals</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-background">
                Enjoy exclusive deals on your <span className="text-accent">favorite meals!</span>
              </h3>
              <Link href="/deals">
                <Button className="bg-accent hover:bg-accent/90 text-primary font-bold text-lg px-8 py-6 rounded-full gap-2">
                  Order Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </div>
            <div className="h-48 md:h-64 bg-accent/10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Gift className="w-24 h-24 text-accent/30 mx-auto mb-4" />
                <p className="text-accent/60 font-medium">Premium meal image here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards & Offers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rewards Card */}
          <div className="bg-card border-2 border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h4 className="text-2xl md:text-3xl font-bold text-foreground">Rewards & Discounts</h4>
                <p className="text-muted-foreground">Earn points and enjoy amazing rewards.</p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Percent className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Special Offers Card */}
          <div className="bg-card border-2 border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h4 className="text-2xl md:text-3xl font-bold text-foreground">Special Offers</h4>
                <p className="text-muted-foreground">Check out our daily offers and save more.</p>
              </div>
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-8 h-8 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-background space-y-6">
          <h3 className="text-3xl md:text-4xl font-bold">
            Taste the <span className="text-accent">echoi</span> in every bite. <span className="text-accent">❤️</span>
          </h3>
          <Link href="/menu">
            <Button className="bg-accent hover:bg-accent/90 text-primary font-bold text-lg px-8 py-6 rounded-full gap-2">
              Order Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
