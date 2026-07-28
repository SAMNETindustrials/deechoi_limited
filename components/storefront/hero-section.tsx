'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Zap, Shield, Leaf, Phone } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative text-background pt-8 pb-0 min-h-[500px] md:min-h-[700px] flex items-center overflow-hidden">
      {/* Desktop Background Image */}
      <div 
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundImage: 'url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg1-AjmQXmpaFmrsaEdSaER5lu9y3XuYOt.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Mobile Gradient Background */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-b from-primary via-primary to-primary/95"></div>

      {/* Content Container */}
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-4 md:py-12">
            {/* Left Content */}
            <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/30 rounded-full px-4 py-2 w-fit">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Fast Delivery</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-background">Good Food.</span>
                <br />
                <span className="text-accent">Great Experience.</span>
                <br />
                <span className="text-background">Delivered to</span>
                <br />
                <span className="italic text-accent">You.</span>
              </h1>

              <p className="text-lg text-background/90 max-w-md">
                Delicious meals delivered fast and fresh to your door. Order now and enjoy the De-echoi experience.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/menu">
                <Button className="bg-primary border-2 border-background text-background hover:bg-background hover:text-primary font-bold text-lg px-8 py-6 rounded-full w-full sm:w-auto gap-2">
                  Order Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Button variant="outline" className="border-2 border-background text-background hover:bg-background/20 font-bold text-lg px-8 py-6 rounded-full w-full sm:w-auto gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 20a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                Order Process
              </Button>
            </div>
          </div>

          {/* Right Side - Bike Image for Mobile and Tablet */}
          <div className="order-1 lg:order-2 relative md:hidden">
            <Image
              src="/delivery-bike.png"
              alt="Delivery bike"
              width={400}
              height={400}
              className="w-full max-w-sm mx-auto"
              priority
            />
            {/* Fast Delivery Badge */}
            <div className="absolute bottom-12 right-4 bg-accent text-primary rounded-full px-4 py-2 flex items-center gap-2 font-bold text-sm">
              <Zap className="w-4 h-4" />
              Fast Delivery
            </div>
          </div>
        </div>

            {/* Wave divider */}
            <div className="mt-8 lg:mt-16">
              <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-auto fill-background">
                <path d="M0,30 Q300,0 600,30 T1200,30 L1200,60 L0,60 Z"></path>
              </svg>
            </div>
        </div>
      </div>

      {/* Features Section - Below Wave */}
      <div className="bg-background py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-background">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm md:text-base">Lightning Fast</p>
                <p className="text-xs md:text-sm text-muted-foreground">Delivery</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-background">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm md:text-base">Safe & Secure</p>
                <p className="text-xs md:text-sm text-muted-foreground">Payments</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-background">
                <Leaf className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm md:text-base">Fresh</p>
                <p className="text-xs md:text-sm text-muted-foreground">Ingredients</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-background">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm md:text-base">24/7</p>
                <p className="text-xs md:text-sm text-muted-foreground">Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
