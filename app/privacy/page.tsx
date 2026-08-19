'use client'

import React from 'react'
import Link from 'next/link'
import { StorefrontHeader } from '@/components/storefront/header'
import { Shield, Lock, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16 selection:bg-[#EAA823] selection:text-[#072d1d]">
      <StorefrontHeader />

      {/* HEADER */}
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
            <Shield className="w-6 h-6 text-[#EAA823]" />
            <h1 className="text-3xl sm:text-4xl font-black">Privacy Policy</h1>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Commitment to Customer Privacy &bull; De-echoi Limited
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-stone-700 text-xs sm:text-sm leading-relaxed">
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">1. Information We Collect</h2>
          <p>
            We collect personal details necessary to fulfill meal orders and course registrations, including your name, delivery address, phone number, and email. We do not store or process debit/credit card pin credentials on our servers.
          </p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">2. How Your Data Is Used</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Dispatching food and cake deliveries with our local delivery riders.</li>
            <li>Sending order tracking SMS and WhatsApp receipts.</li>
            <li>Processing admission into the De-echoi Culinary Training Academy.</li>
          </ul>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#072d1d]">3. Third-Party Sharing</h2>
          <p>
            Your information is never sold to external data brokers. Operational data is shared only with verified payment processors and local logistics dispatchers strictly to fulfill your orders.
          </p>
        </section>
      </main>
    </div>
  )
}