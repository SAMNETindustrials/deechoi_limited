'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Upload, X, CreditCard, Building2, CheckCircle2, MapPin, Navigation, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// --- TypeScript Declaration for Google Maps on Window ---
declare global {
  interface Window {
    google: any
  }
}

// --- Port Harcourt Delivery Zones Data ---
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

// Matrix Rate Lookup [Origin Zone]-[Destination Zone]
const DELIVERY_MATRIX: Record<string, number> = {
  // Within same zone
  '1-1': 3000, '2-2': 3000, '3-3': 3000, '4-4': 3000, '5-5': 3000,
  '6-6': 3500, '7-7': 3000, '8-8': 5000, '9-9': 5000,

  // Zone 1
  '1-2': 3000, '1-3': 3500, '1-4': 3500, '1-5': 3500,
  '1-6': 4000, '1-7': 5000, '1-8': 8000, '1-9': 8500,

  // Zone 2
  '2-3': 3000, '2-4': 3500, '2-5': 3500, '2-6': 3500,
  '2-7': 3500, '2-8': 6500, '2-9': 7500,

  // Zone 3
  '3-4': 3500, '3-5': 3000, '3-6': 4500, '3-7': 4500,
  '3-8': 7000, '3-9': 9000,

  // Zone 4
  '4-5': 3500, '4-6': 3500, '4-7': 3500, '4-8': 5500, '4-9': 7500,

  // Zone 5
  '5-6': 3500, '5-7': 4500, '5-8': 6500, '5-9': 7000,

  // Zone 6
  '6-7': 4500, '6-8': 7000, '6-9': 8500,

  // Zone 7
  '7-8': 6500, '7-9': 9000,

  // Zone 8 & 9
  '8-9': 7500,
  '9-1': 10500, '9-2': 10500, '9-3': 10500, '9-4': 10500,
  '9-5': 10500, '9-6': 10500, '9-7': 10500,
}

// Fallback price for unlisted/out-of-zone locations
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

  // Checkout Steps: 1 = Information & Shipping, 2 = Payment
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

  // Delivery & Zone States
  const [storeOriginZone] = useState<number>(1) // Kitchen origin e.g. Zone 1 (Woji/Peter Odili)
  const [detectedZone, setDetectedZone] = useState<number | null>(null)
  const [deliveryFee, setDeliveryFee] = useState<number>(3000)
  const [isOutOfZone, setIsOutOfZone] = useState<boolean>(false)
  const [locating, setLocating] = useState<boolean>(false)

  const addressInputRef = useRef<HTMLInputElement | null>(null)

  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Detect zone from input text
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
      // Address typed does not fall within standard PH zones
      setDetectedZone(null)
      setIsOutOfZone(true)
      setDeliveryFee(OUT_OF_ZONE_FEE)
    }
  }

  // Initialize Google Maps Places Autocomplete
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
    }
  }, [])

  // Geolocation handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
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
            }
          } else {
            const coordsAddress = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} (Port Harcourt)`
            setCustomerInfo(prev => ({ ...prev, address: coordsAddress }))
            detectZoneFromAddress(coordsAddress)
          }
        } catch (err) {
          console.error('Geocoding error:', err)
        } finally {
          setLocating(false)
        }
      },
      (error) => {
        console.error('Location error:', error)
        alert('Could not retrieve your location. Please type your address manually.')
        setLocating(false)
      }
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
        alert('Please upload a PDF or JPG/PNG image')
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
    if (!customerInfo.firstName || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      alert('Please fill in all required customer fields.')
      return
    }
    setStep(2)
  }

  const finalOrderTotal = total + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === 'bank_transfer' && !proofFile) {
      alert('Please upload your payment receipt before submitting.')
      return
    }

    setLoading(true)
    try {
      let proofUrl = null
      if (proofFile) {
        const fileName = `${Date.now()}-${proofFile.name}`
        const { data, error } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, proofFile)

        if (error) throw error
        proofUrl = data.path
      }

      const fullName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim()

      const { data: order, error } = await supabase
        .from('store_orders')
        .insert({
          customer_name: fullName,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          delivery_address: customerInfo.address,
          delivery_city: customerInfo.city,
          delivery_state: customerInfo.state,
          payment_method: paymentMethod,
          payment_proof_url: proofUrl,
          delivery_fee: deliveryFee,
          total_amount: finalOrderTotal,
          status: 'pending',
          items: items
        })
        .select('id')
        .single()

      if (error) throw error

      clearCart()
      router.push(`/order-confirmation/${order.id}`)
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <StorefrontHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-foreground text-lg mb-4">Your cart is empty</p>
            <Link href="/">
              <Button className="bg-primary text-background">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const BANK_DETAILS = {
    accountName: 'De-echoi Limited',
    accountNumber: '1312120060',
    bankName: 'Zenith',
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Content (Left Column) */}
          <div className="lg:col-span-7 space-y-8">

            {/* Shopify Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
              <span>›</span>
              <span className={step === 1 ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                Information & Shipping
              </span>
              <span>›</span>
              <span className={step === 2 ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                Payment
              </span>
            </div>

            {step === 1 ? (
              /* STEP 1: Customer Information & Delivery */
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={customerInfo.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Shipping Address</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="gap-2 text-primary border-primary hover:bg-primary/10 text-xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {locating ? 'Locating...' : 'Use My Current Location'}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          required
                          value={customerInfo.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={customerInfo.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    {/* Google Map Autocomplete Address Input */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">
                        Delivery Address (Google Location) *
                      </label>
                      <div className="relative">
                        <input
                          ref={addressInputRef}
                          type="text"
                          name="address"
                          required
                          value={customerInfo.address}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          placeholder="Type address (e.g. Woji, Rumuokoro, GRA, Choba)"
                        />
                        <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Delivery Zone Selector & Rate Verification */}
                    <div className="p-4 bg-muted/40 border border-border rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-foreground uppercase">
                          Delivery Zone Verification
                        </label>
                        {detectedZone ? (
                          <span className="text-xs bg-green-500/10 text-green-600 font-bold px-2 py-0.5 rounded">
                            Matched Zone {detectedZone}
                          </span>
                        ) : isOutOfZone ? (
                          <span className="text-xs bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Outer Zone Rate Applied
                          </span>
                        ) : null}
                      </div>

                      <select
                        value={detectedZone || ''}
                        onChange={handleZoneSelectChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Outside Standard Local PH Zones --</option>
                        {Object.entries(PH_ZONES).map(([zoneNum, zoneData]) => (
                          <option key={zoneNum} value={zoneNum}>
                            {zoneData.name}
                          </option>
                        ))}
                      </select>

                      {isOutOfZone && customerInfo.address.trim() !== '' && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded">
                          Your address falls outside standard Port Harcourt local delivery zones. Outer-zone delivery fare applies.
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-border/60">
                        <span className="text-xs text-muted-foreground font-medium">Calculated Delivery Fee</span>
                        <span className="text-lg font-bold text-primary">₦{deliveryFee.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={customerInfo.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Port Harcourt"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={customerInfo.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Rivers"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={customerInfo.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+234 701 234 5678"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <Link href="/cart" className="flex items-center gap-2 text-primary hover:underline text-sm font-semibold">
                    <ArrowLeft className="w-4 h-4" />
                    Return to cart
                  </Link>
                  <Button type="submit" size="lg" className="bg-primary text-white font-bold px-8">
                    Continue to Payment
                  </Button>
                </div>
              </form>
            ) : (
              /* STEP 2: Payment Selection & Bank Receipt Upload */
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Payment Method</h2>
                  <p className="text-sm text-muted-foreground mb-6">Select how you would like to pay for your order.</p>

                  {/* Button-style Payment Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-5 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <Building2 className={`w-6 h-6 ${paymentMethod === 'bank_transfer' ? 'text-primary' : 'text-muted-foreground'}`} />
                        {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-base">Bank Transfer</p>
                        <p className="text-xs text-muted-foreground mt-1">Direct transfer to official company account</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled
                      className="p-5 rounded-xl border-2 border-border bg-muted/40 text-left flex flex-col justify-between opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <CreditCard className="w-6 h-6 text-muted-foreground" />
                        <span className="text-[10px] bg-muted-foreground/20 text-muted-foreground font-semibold px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-base">Card Payment</p>
                        <p className="text-xs text-muted-foreground mt-1">Pay instantly via Credit or Debit Card</p>
                      </div>
                    </button>
                  </div>

                  {/* Bank Details Display */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="border border-border rounded-xl bg-card p-6 space-y-6">
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                        <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                          Official Account Details
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center pb-2 border-b border-border/60">
                            <span className="text-muted-foreground">Account Name</span>
                            <span className="font-bold text-foreground">{BANK_DETAILS.accountName}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/60">
                            <span className="text-muted-foreground">Account Number</span>
                            <span className="font-mono font-bold text-lg text-primary">{BANK_DETAILS.accountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Bank Name</span>
                            <span className="font-bold text-foreground">{BANK_DETAILS.bankName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Proof Upload Area */}
                      <div>
                        <h4 className="font-bold text-foreground mb-1">Upload Payment Proof *</h4>
                        <p className="text-xs text-muted-foreground mb-4">Please upload a clear screenshot or PDF receipt of your payment.</p>

                        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                          {proofPreview ? (
                            <div className="relative inline-block max-w-full">
                              <img
                                src={proofPreview}
                                alt="Payment proof preview"
                                className="max-h-56 rounded-lg object-contain mx-auto"
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
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <span className="text-sm font-medium text-foreground truncate">{proofFile.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setProofFile(null)
                                  setProofPreview(null)
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block">
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-primary mb-1" />
                                <span className="text-foreground font-medium text-sm">Click to upload or drag and drop</span>
                                <span className="text-xs text-muted-foreground">PDF, PNG, or JPG (max 10MB)</span>
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

                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-primary hover:underline text-sm font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Information
                  </button>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary text-white font-bold text-lg px-8 py-6 rounded-lg"
                  >
                    {loading ? 'Processing Order...' : `Complete Order - ₦${finalOrderTotal.toLocaleString()}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="border border-border bg-card rounded-xl p-6 sticky top-8">
              <h3 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-border">Order Summary</h3>

              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemPrice = item.price ?? item.final_price ?? 0
                  return (
                    <div key={item.product_id ?? item.id} className="flex gap-4 items-center pb-4 border-b border-border/50">
                      {item.imageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                          <img
                            src={item.imageUrl}
                            alt={item.product_name ?? item.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl">
                            {item.quantity}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{item.product_name ?? item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        ₦{(itemPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3 pt-2 text-sm border-t border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground items-center">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-foreground">₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border text-base">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-xl text-primary">₦{finalOrderTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}