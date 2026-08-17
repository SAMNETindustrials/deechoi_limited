'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { 
  ArrowLeft, 
  Upload, 
  X, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  MapPin, 
  Navigation, 
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    google: any
  }
}

const PH_ZONES: Record<number, { name: string; keywords: string[] }> = {
  1: {
    name: 'PH 1 (Woji, Elelenwo, Rumuibekwe, Rumuomasi, Trans Amadi, Peter Odili)',
    keywords: ['woji', 'elelenwo', 'rumuibekwe', 'rumuomasi', 'trans amadi', 'peter odili'],
  },
  2: {
    name: 'PH 2 (Abuluoma, Garrison, Dline, Waterlines, Elekahia, Nkpogu, Stadium Road)',
    keywords: ['abuluoma', 'garrison', 'dline', 'd-line', 'waterlines', 'elekahia', 'nkpogu', 'stadium road'],
  },
  3: {
    name: 'PH 3 (Eneka, Tank, Eliozu, Rumukrushi, Rumuigbo)',
    keywords: ['eneka', 'tank', 'eliozu', 'rumukrushi', 'rumuigbo'],
  },
  4: {
    name: 'PH 4 (GRA, Oroazi, Old Ikwerre Road, Ada George, Agip, Iwofe, Mile 1,2,3,4)',
    keywords: ['gra', 'oroazi', 'old ikwerre road', 'ada george', 'agip', 'iwofe', 'mile 1', 'mile 2', 'mile 3', 'mile 4'],
  },
  5: {
    name: 'PH 5 (Rumuodumaya, Rumuokoro, Rumuagholu, Rukpokwu, Mbgougba, Ozuoba)',
    keywords: ['rumuodumaya', 'rumuokoro', 'rumuagholu', 'rukpokwu', 'mbgougba', 'mgbougba', 'ozuoba'],
  },
  6: {
    name: 'PH 6 (Old GRA, Azikiwe, Lagos Busstop, Town)',
    keywords: ['old gra', 'azikiwe', 'lagos busstop', 'town'],
  },
  7: {
    name: 'PH 7 (Choba, Rumuosi, Alakahia)',
    keywords: ['choba', 'rumuosi', 'alakahia'],
  },
  8: {
    name: 'PH 8 (Akpajo, Oyigbo, Iriebe, Etche Road, Igwuruta)',
    keywords: ['akpajo', 'oyigbo', 'iriebe', 'etche', 'igwuruta'],
  },
  9: {
    name: 'PH 9 (Onne, Okrika, Trailer park, AFAM)',
    keywords: ['onne', 'okrika', 'trailer park', 'afam'],
  },
}

const DELIVERY_MATRIX: Record<string, number> = {
  '1-1': 3000, '2-2': 3000, '3-3': 3000, '4-4': 3000, '5-5': 3000,
  '6-6': 3500, '7-7': 3000, '8-8': 5000, '9-9': 5000,
  '1-2': 3000, '1-3': 3500, '1-4': 3500, '1-5': 3500,
  '1-6': 4000, '1-7': 5000, '1-8': 8000, '1-9': 8500,
  '2-3': 3000, '2-4': 3500, '2-5': 3500, '2-6': 3500,
  '2-7': 3500, '2-8': 6500, '2-9': 7500,
  '3-4': 3500, '3-5': 3000, '3-6': 4500, '3-7': 4500,
  '3-8': 7000, '3-9': 9000,
  '4-5': 3500, '4-6': 3500, '4-7': 3500, '4-8': 5500, '4-9': 7500,
  '5-6': 3500, '5-7': 4500, '5-8': 6500, '5-9': 7000,
  '6-7': 4500, '6-8': 7000, '6-9': 8500,
  '7-8': 6500, '7-9': 9000,
  '8-9': 7500,
  '9-1': 10500, '9-2': 10500, '9-3': 10500, '9-4': 10500,
  '9-5': 10500, '9-6': 10500, '9-7': 10500,
}

const OUT_OF_ZONE_FEE = 10500

function getDeliveryFee(originZone: number, destZone: number | null): number {
  if (!destZone) return OUT_OF_ZONE_FEE
  const key = `${originZone}-${destZone}`
  const reverseKey = `${destZone}-${originZone}`
  if (DELIVERY_MATRIX[key]) return DELIVERY_MATRIX[key]
  if (DELIVERY_MATRIX[reverseKey]) return DELIVERY_MATRIX[reverseKey]
  return OUT_OF_ZONE_FEE
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card'>('bank_transfer')
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Port Harcourt',
    state: 'Rivers',
  })

  // Auto-fill from returning customer session if available
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('deechoi_customer_session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        setCustomerInfo(prev => ({
          ...prev,
          firstName: parsed.firstName || prev.firstName,
          lastName: parsed.lastName || prev.lastName,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          address: parsed.address || prev.address,
        }))
        if (parsed.address) {
          detectZoneFromAddress(parsed.address)
        }
      }
    } catch (e) {
      console.warn('Could not read session:', e)
    }
  }, [])

  const [storeOriginZone] = useState<number>(1)
  const [detectedZone, setDetectedZone] = useState<number | null>(null)
  const [deliveryFee, setDeliveryFee] = useState<number>(3000)
  const [isOutOfZone, setIsOutOfZone] = useState<boolean>(false)
  const [locating, setLocating] = useState<boolean>(false)

  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const detectZoneFromAddress = (addressText: string) => {
    if (!addressText.trim()) {
      setDetectedZone(null)
      setIsOutOfZone(false)
      setDeliveryFee(3000)
      return
    }

    const lower = addressText.toLowerCase()
    let foundZone: number | null = null

    for (const [zoneNum, zoneData] of Object.entries(PH_ZONES)) {
      if (zoneData.keywords.some(keyword => lower.includes(keyword))) {
        foundZone = parseInt(zoneNum, 10)
        break
      }
    }

    if (foundZone) {
      setDetectedZone(foundZone)
      setIsOutOfZone(false)
      setDeliveryFee(getDeliveryFee(storeOriginZone, foundZone))
    } else {
      setDetectedZone(null)
      setIsOutOfZone(true)
      setDeliveryFee(OUT_OF_ZONE_FEE)
    }
  }

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.onload = initAutocomplete
      document.head.appendChild(script)
    } else {
      initAutocomplete()
    }

    function initAutocomplete() {
      if (!addressInputRef.current || !window.google) return
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: 'ng' },
          fields: ['address_components', 'formatted_address', 'geometry'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place.formatted_address) {
            setCustomerInfo(prev => ({
              ...prev,
              address: place.formatted_address || prev.address
            }))
            detectZoneFromAddress(place.formatted_address)
          }
        })
      } catch (err) {
        console.warn('Google Places error:', err)
      }
    }
  }, [])

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      alert('Geolocation is not supported by your current browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

          if (apiKey) {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            )
            const data = await response.json()
            if (data.results && data.results[0]) {
              const formattedAddr = data.results[0].formatted_address
              setCustomerInfo(prev => ({ ...prev, address: formattedAddr }))
              detectZoneFromAddress(formattedAddr)
            } else {
              const fallback = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} (Port Harcourt)`
              setCustomerInfo(prev => ({ ...prev, address: fallback }))
              detectZoneFromAddress(fallback)
            }
          } else {
            const coordsAddress = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} (Port Harcourt)`
            setCustomerInfo(prev => ({ ...prev, address: coordsAddress }))
            detectZoneFromAddress(coordsAddress)
          }
        } catch (err) {
          console.error('Geocoding error:', err)
          alert('Could not resolve your location address. Please type your street name manually.')
        } finally {
          setLocating(false)
        }
      },
      (error) => {
        let msg = 'Could not retrieve your location. Please type your address manually.'
        if (error.code === 1) {
          msg = 'Location permission was denied. Please enable location access or type your address manually.'
        }
        alert(msg)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'address') {
      detectZoneFromAddress(value)
    }
  }

  const handleZoneSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === '') {
      setDetectedZone(null)
      setIsOutOfZone(true)
      setDeliveryFee(OUT_OF_ZONE_FEE)
    } else {
      const z = parseInt(val, 10)
      setDetectedZone(z)
      setIsOutOfZone(false)
      setDeliveryFee(getDeliveryFee(storeOriginZone, z))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('Please upload a PDF or JPG/PNG image receipt.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.')
        return
      }
      setProofFile(file)

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setProofPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setProofPreview(null)
      }
    }
  }

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerInfo.firstName.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim() || !customerInfo.address.trim()) {
      alert('Please fill in all required contact and shipping details.')
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finalOrderTotal = total + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === 'bank_transfer' && !proofFile) {
      alert('Please upload your payment transfer receipt before completing your order.')
      return
    }

    setLoading(true)
    try {
      let proofUrl: string | null = null

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop() || 'png'
        const sanitizedFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(sanitizedFileName, proofFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Receipt upload failed: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(uploadData.path)

        proofUrl = publicUrlData?.publicUrl || uploadData.path
      }

      const fullName = `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`.trim()

      const sanitizedItems = items.map((item) => ({
        id: String(item.id || item.product_id || ''),
        product_id: String(item.product_id || item.id || ''),
        name: item.name || item.product_name || 'Product',
        quantity: item.quantity || 1,
        price: item.price ?? item.unit_price ?? item.final_price ?? 0,
        selected_options: item.selected_options || {},
        imageUrl: item.imageUrl || null
      }))

      const orderPayload = {
        customer_name: fullName,
        customer_email: customerInfo.email.trim(),
        customer_phone: customerInfo.phone.trim(),
        delivery_address: customerInfo.address.trim(),
        delivery_city: customerInfo.city.trim(),
        delivery_state: customerInfo.state.trim(),
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        delivery_fee: deliveryFee,
        total_amount: finalOrderTotal,
        status: 'pending',
        items: sanitizedItems
      }

      const { data: order, error: insertError } = await supabase
        .from('store_orders')
        .insert([orderPayload])
        .select('*')
        .single()

      if (insertError) {
        throw new Error(insertError.message || 'Failed to place order.')
      }

      if (!order?.id) {
        throw new Error('Order was placed but no order ID was returned.')
      }

      // 1. Persist Customer Account & Order ID in Local Storage
      try {
        const customerSession = {
          name: fullName,
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address.trim(),
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem('deechoi_customer_session', JSON.stringify(customerSession))

        const existingOrders = JSON.parse(localStorage.getItem('deechoi_customer_orders') || '[]')
        const updatedOrders = Array.from(new Set([order.id, ...existingOrders]))
        localStorage.setItem('deechoi_customer_orders', JSON.stringify(updatedOrders))

        // Notify other components (like StorefrontHeader) of order update
        window.dispatchEvent(new Event('deechoi_order_placed'))
      } catch (storageErr) {
        console.warn('Storage persistence warning:', storageErr)
      }

      // 2. Dispatch Telegram Alert in Background
      fetch('/api/notifications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      }).catch((err) => console.warn('Notification trigger warning:', err))

      clearCart()
      router.push(`/order-confirmation/${order.id}`)
    } catch (error: any) {
      console.error('Full Order Submission Error:', error)
      alert(error.message || 'Failed to place order. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const BANK_DETAILS = {
    accountName: 'De-echoi Limited',
    accountNumber: '1312120060',
    bankName: 'Zenith Bank',
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
        <StorefrontHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EAA823]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is currently empty</h2>
            <p className="text-gray-500 text-sm mb-6">
              Add some freshly baked celebration cakes or delicious meals to proceed.
            </p>
            <Link href="/">
              <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6 text-xs">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
      <StorefrontHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/cart" 
            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] flex items-center gap-1.5 transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Cart
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span className={step === 1 ? 'text-[#0A2E1D] font-bold' : 'text-gray-400'}>1. Details</span>
            <span>›</span>
            <span className={step === 2 ? 'text-[#0A2E1D] font-bold' : 'text-gray-400'}>2. Payment</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-black text-[#0A2E1D] flex items-center gap-2">
            <Truck className="w-7 h-7 text-[#EAA823]" />
            Complete Your Order
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Fast, secure delivery across Port Harcourt and surrounding zones.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">

            {step === 1 ? (
              <form onSubmit={handleProceedToPayment} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-4">Contact Information</h2>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                      placeholder="e.g. name@example.com"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D]">Shipping Address</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="gap-2 text-[#0A2E1D] border-gray-300 hover:bg-gray-50 text-xs rounded-full font-bold self-start sm:self-auto"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#EAA823]" />
                      {locating ? 'Locating...' : 'Use Current Location'}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          required
                          value={customerInfo.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                          placeholder="e.g. Samuel"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={customerInfo.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                          placeholder="e.g. Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        Street Address (Port Harcourt Area) *
                      </label>
                      <div className="relative">
                        <input
                          ref={addressInputRef}
                          type="text"
                          name="address"
                          required
                          value={customerInfo.address}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                          placeholder="e.g. Woji, Peter Odili, GRA Phase 2, Choba..."
                        />
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div className="p-4 bg-[#FDFBF7] border border-gray-200 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-extrabold text-[#0A2E1D] uppercase">
                          Port Harcourt Delivery Zone
                        </label>
                        {detectedZone ? (
                          <span className="text-[11px] bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full">
                            Matched Zone {detectedZone}
                          </span>
                        ) : isOutOfZone ? (
                          <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Outer Zone Fee
                          </span>
                        ) : null}
                      </div>

                      <select
                        value={detectedZone || ''}
                        onChange={handleZoneSelectChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-xs sm:text-sm text-[#0A2E1D] font-medium focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                      >
                        <option value="">-- Outside Standard Local PH Zones --</option>
                        {Object.entries(PH_ZONES).map(([zoneNum, zoneData]) => (
                          <option key={zoneNum} value={zoneNum}>
                            {zoneData.name}
                          </option>
                        ))}
                      </select>

                      {isOutOfZone && customerInfo.address.trim() !== '' && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl leading-relaxed">
                          Your address falls outside standard Port Harcourt local delivery zones. Outer-zone delivery fee applied.
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500 font-semibold">Calculated Delivery Fee</span>
                        <span className="text-base sm:text-lg font-black text-[#0A2E1D]">₦{deliveryFee.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">City</label>
                        <input
                          type="text"
                          name="city"
                          value={customerInfo.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                          placeholder="Port Harcourt"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">State</label>
                        <input
                          type="text"
                          name="state"
                          value={customerInfo.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                          placeholder="Rivers"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={customerInfo.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                        placeholder="+234 701 234 5678"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                  <Link href="/cart" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0A2E1D]">
                    <ArrowLeft className="w-4 h-4" />
                    Return to cart
                  </Link>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full sm:w-auto bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-extrabold px-8 py-6 rounded-xl text-sm shadow-md transition-all"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-1">Select Payment Method</h2>
                  <p className="text-xs text-gray-500 mb-6">Choose how you would like to complete your payment.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-[#0A2E1D] bg-[#0A2E1D]/5 shadow-sm'
                          : 'border-gray-200 bg-[#FDFBF7] hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <Building2 className={`w-6 h-6 ${paymentMethod === 'bank_transfer' ? 'text-[#0A2E1D]' : 'text-gray-400'}`} />
                        {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-5 h-5 text-[#0A2E1D]" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0A2E1D] text-sm">Direct Bank Transfer</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Transfer to official corporate account</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled
                      className="p-5 rounded-2xl border border-gray-200 bg-gray-50 text-left flex flex-col justify-between opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <CreditCard className="w-6 h-6 text-gray-400" />
                        <span className="text-[9px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 text-sm">Card Payment</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Pay via Mastercard / Visa / Verve</p>
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'bank_transfer' && (
                    <div className="border border-gray-200 rounded-2xl bg-[#FDFBF7] p-5 sm:p-6 space-y-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs">
                        <h3 className="font-bold text-[#0A2E1D] text-sm mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#EAA823]" />
                          Official Bank Details
                        </h3>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-500">Account Name</span>
                            <span className="font-bold text-[#0A2E1D]">{BANK_DETAILS.accountName}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-gray-500">Account Number</span>
                            <span className="font-mono font-black text-base text-[#0A2E1D]">{BANK_DETAILS.accountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Bank Name</span>
                            <span className="font-bold text-[#0A2E1D]">{BANK_DETAILS.bankName}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#0A2E1D] text-xs uppercase mb-1">Upload Payment Receipt *</h4>
                        <p className="text-[11px] text-gray-500 mb-3">Upload a screenshot or PDF receipt of your completed transfer.</p>

                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-white hover:border-[#0A2E1D] transition-colors">
                          {proofPreview ? (
                            <div className="relative inline-block max-w-full">
                              <img
                                src={proofPreview}
                                alt="Payment proof preview"
                                className="max-h-48 rounded-xl object-contain mx-auto border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setProofFile(null)
                                  setProofPreview(null)
                                }}
                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : proofFile ? (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <span className="text-xs font-bold text-[#0A2E1D] truncate">{proofFile.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setProofFile(null)
                                  setProofPreview(null)
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block">
                              <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-amber-50 rounded-full text-[#EAA823]">
                                  <Upload className="w-6 h-6" />
                                </div>
                                <span className="text-[#0A2E1D] font-bold text-xs">Tap to upload receipt</span>
                                <span className="text-[10px] text-gray-400">PDF, PNG, or JPG (max 10MB)</span>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0A2E1D]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Information
                  </button>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full sm:w-auto bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-black text-sm px-8 py-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      `Complete Order - ₦${finalOrderTotal.toLocaleString()}`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm sticky top-20 space-y-6">
              <h3 className="text-lg font-black text-[#0A2E1D] pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="space-y-3.5 mb-6 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => {
                  const targetKey = String(item.id || item.product_id || '')
                  const unitPrice = item.price ?? item.unit_price ?? item.final_price ?? 0
                  const options = item.selected_options || {}

                  return (
                    <div key={targetKey} className="flex gap-3.5 items-center pb-3 border-b border-gray-100">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name ?? item.product_name ?? 'Product'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                            FOOD
                          </div>
                        )}
                        <span className="absolute top-0 right-0 bg-[#0A2E1D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-[#0A2E1D] text-xs truncate">
                          {item.name ?? item.product_name}
                        </p>
                        {Object.keys(options).length > 0 && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {Object.values(options).join(' • ')}
                          </p>
                        )}
                        <p className="text-[11px] font-bold text-[#EAA823] mt-0.5">
                          ₦{(unitPrice * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3 pt-2 text-xs sm:text-sm border-t border-gray-100">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#0A2E1D]">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500 items-center">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#0A2E1D]">₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-base">
                  <span className="font-black text-[#0A2E1D]">Total Payable</span>
                  <span className="font-black text-2xl text-[#0A2E1D]">
                    ₦{finalOrderTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}