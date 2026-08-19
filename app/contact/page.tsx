'use client'

import { useState, useEffect } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Clock, 
  Send, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [autoResponseReceived, setAutoResponseReceived] = useState<string | null>(null)

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
      if (session.name || session.email || session.phone) {
        setFormData(prev => ({
          ...prev,
          name: session.name || prev.name,
          email: session.email || prev.email,
          phone: session.phone || prev.phone,
        }))
      }
    } catch (e) {
      console.warn(e)
    }
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = formData.name.trim()
    const email = formData.email.trim().toLowerCase()
    const phone = formData.phone.trim()
    const message = formData.message.trim()

    if (!name || !phone || !email || !message) {
      alert('Please fill in your name, email, phone number, and message.')
      return
    }

    try {
      setSubmitting(true)

      // Post to primary contact endpoint
      let res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject: 'Support Message via Contact Page',
          message,
        }),
      })

      // Fallback to /api/contact/message if /api/contact is unavailable
      if (!res.ok && res.status === 404) {
        res = await fetch('/api/contact/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            subject: 'Support Message via Contact Page',
            message,
          }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit message')
      }

      // Persist customer session & conversation inquiry thread
      try {
        const customerSession = {
          name,
          email,
          phone,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem('deechoi_customer_session', JSON.stringify(customerSession))

        if (data.inquiryId) {
          const storedInquiries = JSON.parse(localStorage.getItem('deechoi_customer_inquiries') || '[]')
          const updated = Array.from(new Set([data.inquiryId, ...storedInquiries]))
          localStorage.setItem('deechoi_customer_inquiries', JSON.stringify(updated))
        }

        window.dispatchEvent(new Event('deechoi_message_sent'))
      } catch (err) {
        console.warn('Storage sync warning:', err)
      }

      setAutoResponseReceived(
        data.autoReply || 
        'Thank you for reaching out! We have received your inquiry and our kitchen support team will get back to you shortly.'
      )
      setFormData(prev => ({ ...prev, message: '' }))
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message. Please reach us via WhatsApp.'
      console.error('Error sending message:', err)
      alert(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Storefront
          </Link>

          <Link
            href="/my-messages"
            className="text-xs font-bold text-[#0A2E1D] hover:underline flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>View My Message History</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="mb-10 bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white p-6 sm:p-10 rounded-3xl shadow-xl border border-amber-500/20 text-center space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            We are here for you
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Get in Touch with DEECHOI
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-lg mx-auto">
            Questions about your order, custom celebration cakes, or culinary training? Reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Direct Channels */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-base font-black text-[#0A2E1D] uppercase tracking-wider">
                Direct Channels
              </h2>

              <div className="space-y-4 text-xs">
                <a
                  href="tel:+2347046145982"
                  className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#FDFBF7] hover:bg-amber-50 transition border border-gray-100 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0A2E1D] text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Phone Call</span>
                    <strong className="text-sm text-[#0A2E1D] group-hover:text-amber-700 transition">
                      +234 704 614 5982
                    </strong>
                  </div>
                </a>

                <a
                  href="https://wa.me/2347031385337"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#FDFBF7] hover:bg-emerald-50 transition border border-gray-100 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">WhatsApp Chat</span>
                    <strong className="text-sm text-[#0A2E1D] group-hover:text-emerald-700 transition">
                      +234 703 138 5337
                    </strong>
                  </div>
                </a>

                <a
                  href="mailto:deechoion@gmail.com"
                  className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#FDFBF7] hover:bg-blue-50 transition border border-gray-100 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0A2E1D] text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Email Us</span>
                    <strong className="text-xs text-[#0A2E1D] group-hover:text-blue-700 transition">
                      deechoion@gmail.com
                    </strong>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#EAA823] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2E1D]">Kitchen & Bakery Location</h3>
                  <p className="text-gray-500 mt-0.5 leading-relaxed">
                    Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#EAA823] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2E1D]">Opening Hours</h3>
                  <p className="text-gray-500 mt-0.5">Monday &ndash; Sunday: 8:00 AM &ndash; 10:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-1">
                  Send Us a Direct Message
                </h2>
                <p className="text-xs text-gray-500">
                  Your message creates your personal support thread automatically.
                </p>
              </div>

              {autoResponseReceived ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <p className="font-black text-base text-[#0A2E1D]">Inquiry Dispatched to Kitchen Support!</p>
                    <p className="text-xs text-gray-500">
                      Your account profile has been saved. You can track all responses under <strong>My Messages</strong>.
                    </p>
                  </div>

                  <div className="bg-[#072d1d] text-white p-6 rounded-3xl space-y-2 shadow-md border border-amber-400/30">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Instant Response:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                      {autoResponseReceived}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Link href="/my-messages" className="flex-1">
                      <Button className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold py-5 rounded-2xl text-xs cursor-pointer">
                        Open Conversation Hub
                      </Button>
                    </Link>
                    <Button
                      onClick={() => setAutoResponseReceived(null)}
                      variant="outline"
                      className="text-xs font-bold rounded-2xl py-5 border-gray-300 cursor-pointer"
                    >
                      Send Another
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Name *</label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Emeka Okafor"
                      className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number (WhatsApp) *</label>
                      <Input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+234 700 000 0000"
                        className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Message *</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Ask about celebration cake sizes, event bookings, or food delivery questions..."
                      className="w-full bg-[#FDFBF7] border border-gray-200 text-xs sm:text-sm text-[#0A2E1D] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-extrabold py-6 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Dispatching Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message & Create Thread</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}