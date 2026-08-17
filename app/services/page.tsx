'use client'

import { useState } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Cake, 
  Utensils, 
  ArrowLeft,
  PartyPopper
} from 'lucide-react'
import Link from 'next/link'

export default function BookUsPage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const [bookingData, setBookingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventType: 'Birthday Celebration',
    eventDate: '',
    guestCount: '50',
    location: '',
    specialRequirements: '',
    servicesNeeded: ['Food Catering', 'Celebration Cakes'],
  })

  const eventTypes = [
    'Birthday Celebration',
    'Wedding Reception',
    'Corporate Meeting / Luncheon',
    'Anniversary',
    'Private Dinner Party',
    'Church / Community Gathering',
  ]

  const serviceOptions = [
    'Full Food Buffet & Platters',
    'Bespoke Multi-Tier Celebration Cake',
    'Finger Foods & Small Chops Combo',
    'Fresh Juice & Cocktail Bar',
    'On-site Chef & Service Staff',
  ]

  const handleServiceToggle = (service: string) => {
    setBookingData((prev) => {
      const exists = prev.servicesNeeded.includes(service)
      return {
        ...prev,
        servicesNeeded: exists
          ? prev.servicesNeeded.filter((s) => s !== service)
          : [...prev.servicesNeeded, service],
      }
    })
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookingData.fullName || !bookingData.phone || !bookingData.eventDate || !bookingData.location) {
      alert('Please fill in your name, phone number, event date, and venue location.')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        customer_name: bookingData.fullName.trim(),
        customer_email: bookingData.email.trim(),
        customer_phone: bookingData.phone.trim(),
        delivery_address: `Event Venue: ${bookingData.location.trim()} | Guests: ${bookingData.guestCount} | Type: ${bookingData.eventType}`,
        delivery_city: 'Port Harcourt',
        payment_method: 'event_booking_inquiry',
        status: 'pending',
        total_amount: 0,
        items: [
          {
            name: `Event Booking: ${bookingData.eventType}`,
            event_date: bookingData.eventDate,
            guest_count: bookingData.guestCount,
            services: bookingData.servicesNeeded,
            notes: bookingData.specialRequirements,
          },
        ],
      }

      // Save inquiry into Supabase
      const { data, error } = await supabase
        .from('store_orders')
        .insert([payload])
        .select()
        .single()

      if (error) throw error

      // Trigger background Telegram / Email alert to admin
      fetch('/api/notifications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            ...payload,
            id: data?.id || `EVT-${Date.now()}`,
          },
        }),
      }).catch((err) => console.warn('Booking alert background warning:', err))

      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error('Booking submission error:', err)
      alert(err.message || 'Failed to submit booking inquiry. Please call us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Storefront
          </Link>
        </div>

        {/* Hero Header */}
        <div className="mb-8 bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white p-6 sm:p-10 rounded-3xl shadow-xl border border-amber-500/20 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
            <PartyPopper className="w-3.5 h-3.5 text-[#EAA823]" />
            <span>Event Catering & Bakes</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Book Us for Your Special Event
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
            Weddings, birthdays, corporate lunches, and private gatherings. Let De-echoi treat your guests to authentic delicacies and signature celebration cakes.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-[#0A2E1D]">Booking Request Received!</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong>{bookingData.fullName}</strong>. Our catering coordinator will contact you at <strong>{bookingData.phone}</strong> within 2 hours to confirm menu options and event pricing.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Link href="/">
                <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-8 py-5 text-xs">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmitBooking}
            className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-1">1. Contact Information</h2>
              <p className="text-xs text-gray-500 mb-4">Tell us who we are coordinating with.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Full Name *</label>
                  <Input
                    type="text"
                    required
                    value={bookingData.fullName}
                    onChange={(e) => setBookingData({ ...bookingData, fullName: e.target.value })}
                    placeholder="e.g. Joy Williams"
                    className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Phone Number (WhatsApp) *</label>
                  <Input
                    type="tel"
                    required
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    placeholder="e.g. +234 703 123 4567"
                    className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Email Address</label>
                <Input
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                  placeholder="e.g. name@example.com"
                  className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-1">2. Event Details</h2>
              <p className="text-xs text-gray-500 mb-4">Date, venue, and estimated guest turnout.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Event Type</label>
                  <select
                    value={bookingData.eventType}
                    onChange={(e) => setBookingData({ ...bookingData, eventType: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-gray-200 text-xs sm:text-sm text-[#0A2E1D] font-medium p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                  >
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Event Date *</label>
                  <Input
                    type="date"
                    required
                    value={bookingData.eventDate}
                    onChange={(e) => setBookingData({ ...bookingData, eventDate: e.target.value })}
                    className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Expected Guests</label>
                  <Input
                    type="number"
                    min="10"
                    value={bookingData.guestCount}
                    onChange={(e) => setBookingData({ ...bookingData, guestCount: e.target.value })}
                    placeholder="e.g. 50"
                    className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Event Venue / Address *</label>
                <Input
                  type="text"
                  required
                  value={bookingData.location}
                  onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                  placeholder="e.g. Presidential Hotel Banquet Hall / Residence in GRA Phase 2"
                  className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                3. Services & Menu Options Needed:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {serviceOptions.map((srv) => {
                  const selected = bookingData.servicesNeeded.includes(srv)
                  return (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => handleServiceToggle(srv)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                        selected
                          ? 'border-[#0A2E1D] bg-[#0A2E1D]/5 text-[#0A2E1D]'
                          : 'border-gray-200 bg-[#FDFBF7] text-gray-600'
                      }`}
                    >
                      <span>{srv}</span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                        selected ? 'border-[#0A2E1D] bg-[#0A2E1D] text-white' : 'border-gray-300'
                      }`}>
                        {selected && '✓'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Special Requests or Dietary Notes
              </label>
              <textarea
                rows={3}
                value={bookingData.specialRequirements}
                onChange={(e) => setBookingData({ ...bookingData, specialRequirements: e.target.value })}
                placeholder="e.g. Preferred cake flavors, extra spice for pepper soup, delivery timing..."
                className="w-full bg-[#FDFBF7] border border-gray-200 text-xs sm:text-sm text-[#0A2E1D] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-extrabold py-6 rounded-2xl text-sm shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Booking...</span>
                  </>
                ) : (
                  <span>Submit Event Catering Request</span>
                )}
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}