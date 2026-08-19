'use client'

import React from 'react'
import Link from 'next/link'
import { StorefrontHeader } from '@/components/storefront/header'
import { ShieldCheck, FileText, ArrowLeft, Clock, MapPin, Phone, Mail } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16 selection:bg-[#EAA823] selection:text-[#072d1d]">
      <StorefrontHeader />

      {/* HEADER SECTION */}
      <section className="bg-[#072d1d] text-white py-12 border-b border-[#EAA823]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#EAA823] font-bold hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#EAA823]" />
            <h1 className="text-3xl sm:text-4xl font-black">Terms &amp; Conditions</h1>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Last Updated: August 2026 &bull; De-echoi Limited (Port Harcourt, Nigeria)
          </p>
        </div>
      </section>

      {/* LEGAL CONTENT BODY */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-stone-700 text-xs sm:text-sm leading-relaxed">
        
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">1. Introduction &amp; Company Overview</h2>
          <p>
            Welcome to De-echoi Limited. By ordering freshly prepared meals, purchasing celebration cakes, reserving catering slots, or enrolling in the De-echoi Culinary Academy through our website and connected storefront channels, you agree to be bound by the following terms and operating policies.
          </p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">2. Orders, Food Preparation &amp; Cancellations</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Instant Meals &amp; Fast Delights:</strong> Fast kitchen items (such as Shawarma, Pastas, Noodles, Pepper Soup, and Fresh Juice) are freshly cooked to order. Once an order enters preparation in our kitchen, it cannot be cancelled or refunded.
            </li>
            <li>
              <strong>Bespoke Celebration Cakes:</strong> 6" and 7" tiered cakes require scheduled advance baking. Custom cake cancellations requested less than 24 hours prior to the dispatch date may incur an ingredient and production fee.
            </li>
          </ul>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">3. Delivery Hubs, Pickup &amp; Transit Times</h2>
          <p>
            Our primary fulfillment hub is located at <strong>Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State</strong>. Delivery estimates provided during checkout are calculated based on rider dispatch and local traffic. Customers are responsible for providing reachable phone numbers and correct delivery address landmarks.
          </p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">4. Culinary Academy Training Policies</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Registration fees and course deposits must be validated prior to cohort commencement to reserve dedicated workstation equipment and ingredient sets.
            </li>
            <li>
              Students are required to abide by internal kitchen safety regulations, hygiene protocols, and respectful conduct during practical sessions.
            </li>
          </ul>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">5. Intellectual Property &amp; Developer Notice</h2>
          <p>
            All website trademarks, culinary designs, Mr. Tell digital concierge assets, and menu branding are proprietary to <strong>De-echoi Limited</strong>. The technical infrastructure and web platform are engineered and managed by <strong>SAMNET Industrials Ltd</strong>.
          </p>
        </section>

        <section className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 space-y-2 text-[#072d1d]">
          <h3 className="font-extrabold text-sm">Questions or Enquiries?</h3>
          <p className="text-xs">
            For support or questions regarding these terms, reach our customer care desk:
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#EAA823]" /> +234 704 614 5982</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#EAA823]" /> deechoion@gmail.com</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#EAA823]" /> Woji, Port Harcourt</span>
          </div>
        </section>

      </main>
    </div>
  )
}