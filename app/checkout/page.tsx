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
  Loader2,
  ScanLine,
  Store,
  Sparkles,
  Map,
  KeyRound
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// Fetching our expanded dictionary and logic
import { PH_ZONES, getDeliveryFee, OUT_OF_ZONE_FEE } from '@/lib/ph-zones'

declare global {
  interface Window {
    google: any
  }
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'dispatch' | 'pickup'>('dispatch')
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card'>('bank_transfer')
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    landmark: '',
    city: 'Port Harcourt',
    state: 'Rivers',
  })

  // 5-Digit Transaction PIN Setup States
  const [hasTransactionPin, setHasTransactionPin] = useState<boolean>(false)
  const [transactionPin, setTransactionPin] = useState<string>('')
  const [confirmPin, setConfirmPin] = useState<string>('')
  const [skipPinForNow, setSkipPinForNow] = useState<boolean>(false)
  const [pinError, setPinError] = useState<string | null>(null)

  // Discount & Subtotal Recalculation States
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null)
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  
  const rawSubtotal = items.reduce((acc, item) => {
    const basePrice = Number(item.price ?? item.unit_price ?? item.final_price ?? 0)
    const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1
    return acc + (basePrice * qty)
  }, 0)

  const discountAmount = appliedVoucher ? (rawSubtotal * (discountPercent / 100)) : 0
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount)

  const [storeOriginZone] = useState<number>(1)
  const [detectedZone, setDetectedZone] = useState<number | null>(null)
  const [calculatedZoneFee, setCalculatedZoneFee] = useState<number>(3000)
  const [isOutOfZone, setIsOutOfZone] = useState<boolean>(false)
  const [locating, setLocating] = useState<boolean>(false)

  // Dynamic Landmark Detection States
  const [findingLandmarks, setFindingLandmarks] = useState(false)
  const [landmarkOptions, setLandmarkOptions] = useState<string[]>([])
  const [showLandmarkDropdown, setShowLandmarkDropdown] = useState(false)

  // Effective Delivery Fee based on fulfillment choice
  const activeDeliveryFee = fulfillmentMethod === 'pickup' ? 0 : calculatedZoneFee

  // Auto-fill from returning customer session & fetch active voucher
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

      // Load active voucher from Cart
      const voucher = localStorage.getItem('active_checkout_voucher')
      const pct = localStorage.getItem('active_discount_percent')
      if (voucher) {
        setAppliedVoucher(voucher)
        setDiscountPercent(Number(pct) || 0)
      }
    } catch (e) {
      console.warn('Could not read session:', e)
    }
  }, [])

  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Receipt verification states
  const [isScanning, setIsScanning] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [verificationDetails, setVerificationDetails] = useState<{ reference?: string; verified: boolean } | null>(null)

  const finalOrderTotal = discountedSubtotal + activeDeliveryFee

  const detectZoneFromAddress = (addressText: string) => {
    if (!addressText.trim()) {
      setDetectedZone(null)
      setIsOutOfZone(false)
      setCalculatedZoneFee(3000)
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
      setCalculatedZoneFee(getDeliveryFee(storeOriginZone, foundZone))
    } else {
      setDetectedZone(null)
      setIsOutOfZone(true)
      setCalculatedZoneFee(OUT_OF_ZONE_FEE)
    }
  }

  // Google Maps Integration for Address & Automatic Landmark Fetching
  useEffect(() => {
    if (fulfillmentMethod !== 'dispatch') return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const existingScript = document.getElementById('google-maps-places-script')

    if (!window.google && !existingScript) {
      const script = document.createElement('script')
      script.id = 'google-maps-places-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.onload = initAutocomplete
      document.head.appendChild(script)
    } else if (window.google) {
      setTimeout(initAutocomplete, 100)
    }

    function initAutocomplete() {
      if (!addressInputRef.current || !window.google) return
      
      try {
        const addressAutocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: 'ng' },
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
        })

        addressAutocomplete.addListener('place_changed', () => {
          const place = addressAutocomplete.getPlace()

          if (!place || !place.geometry || !place.geometry.location) {
            return
          }

          const resolvedAddress = place.name
            ? `${place.name}, ${place.formatted_address || ''}`
            : place.formatted_address || ''

          if (resolvedAddress) {
            setCustomerInfo(prev => ({
              ...prev,
              address: resolvedAddress
            }))

            detectZoneFromAddress(resolvedAddress)

            setCustomerInfo(prev => ({
              ...prev,
              landmark: ''
            }))

            setLandmarkOptions([])
            setShowLandmarkDropdown(false)

            fetchNearbyLandmarks(place.geometry.location)
          }
        })
      } catch (err) {
        console.warn('Google Places error:', err)
      }
    }
  }, [fulfillmentMethod])

  const fetchNearbyLandmarks = (location: any) => {
    if (!window.google || !location) return

    setFindingLandmarks(true)
    setLandmarkOptions([])
    setShowLandmarkDropdown(false)

    try {
      const dummyDiv = document.createElement('div')
      const service = new window.google.maps.places.PlacesService(dummyDiv)

      service.nearbySearch(
        {
          location: location,
          radius: 1000,
          rankBy: window.google.maps.places.RankBy.DISTANCE,
          type: 'establishment',
        },
        (results: any[], status: any) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            Array.isArray(results)
          ) {
            const uniqueNames: string[] = []

            for (const result of results) {
              const name = result?.name?.trim()

              if (
                name &&
                !uniqueNames.some(
                  existing =>
                    existing.toLowerCase() === name.toLowerCase()
                )
              ) {
                uniqueNames.push(name)
              }

              if (uniqueNames.length >= 6) {
                break
              }
            }

            setLandmarkOptions(uniqueNames)

            if (uniqueNames.length > 0) {
              setShowLandmarkDropdown(true)
            }
          } else {
            setLandmarkOptions([])
            setShowLandmarkDropdown(false)
          }

          setFindingLandmarks(false)
        }
      )
    } catch (err) {
      console.warn('Google nearby landmark search error:', err)
      setLandmarkOptions([])
      setShowLandmarkDropdown(false)
      setFindingLandmarks(false)
    }
  }

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

              setCustomerInfo(prev => ({
                ...prev,
                address: formattedAddr,
                landmark: ''
              }))

              detectZoneFromAddress(formattedAddr)

              if (window.google) {
                const loc = new window.google.maps.LatLng(
                  latitude,
                  longitude
                )

                fetchNearbyLandmarks(loc)
              }
            }
          }
        } catch (err) {
          console.error('Geocoding error:', err)
        } finally {
          setLocating(false)
        }
      },
      () => {
        alert('Could not retrieve your location. Please type your address manually.')
        setLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
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
      setLandmarkOptions([])
      setShowLandmarkDropdown(false)
    }
  }

  const selectLandmark = (lm: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      landmark: lm
    }))

    setShowLandmarkDropdown(false)
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
      setValidationError(null)
      setVerificationDetails(null)

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

    if (
      !customerInfo.firstName.trim() ||
      !customerInfo.email.trim() ||
      !customerInfo.phone.trim()
    ) {
      alert('Please fill in your contact information.')
      return
    }

    if (
      fulfillmentMethod === 'dispatch' &&
      !customerInfo.address.trim()
    ) {
      alert('Please provide your street address for dispatch delivery.')
      return
    }

    setStep(2)
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const BANK_DETAILS = {
    accountName: 'De-echoi Limited',
    accountNumber: '1312120060',
    bankName: 'Zenith Bank',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setPinError(null)

    // Validate 5-digit PIN if created
    if (hasTransactionPin && !skipPinForNow) {
      if (!transactionPin || transactionPin.length !== 5 || !/^\d+$/.test(transactionPin)) {
        setPinError('Please enter a valid 5-digit transaction code.')
        return
      }
      if (transactionPin !== confirmPin) {
        setPinError('Transaction codes do not match.')
        return
      }
    }

    if (paymentMethod === 'bank_transfer') {
      if (!proofFile) {
        alert('Please upload your payment transfer receipt before completing your order.')
        return
      }

      setIsScanning(true)

      try {
        const verifyData = new FormData()

        verifyData.append('file', proofFile)
        verifyData.append('expectedAmount', finalOrderTotal.toString())
        verifyData.append('expectedAccount', BANK_DETAILS.accountNumber)

        const verifyRes = await fetch('/api/validate-receipt', {
          method: 'POST',
          body: verifyData,
        })

        const verifyJson = await verifyRes.json()

        if (!verifyRes.ok || !verifyJson.valid) {
          setValidationError(
            verifyJson.message ||
            'Receipt validation failed. Please ensure the exact amount, reference, and date/time are visible on your receipt.'
          )

          setIsScanning(false)
          return
        }

        setVerificationDetails({
          reference: verifyJson.reference,
          verified: true,
        })
      } catch (err: any) {
        setValidationError(
          'Failed to connect to the receipt scanner. Please try again.'
        )

        setIsScanning(false)
        return
      }

      setIsScanning(false)
    }

    setLoading(true)

    try {
      let proofUrl: string | null = null

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop() || 'png'

        const sanitizedFileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExt}`

        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage
          .from('payment-proofs')
          .upload(
            sanitizedFileName,
            proofFile,
            {
              cacheControl: '3600',
              upsert: false
            }
          )

        if (uploadError) {
          throw new Error(
            `Receipt upload failed: ${uploadError.message}`
          )
        }

        const { data: publicUrlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(uploadData.path)

        proofUrl =
          publicUrlData?.publicUrl ||
          uploadData.path
      }

      const fullName =
        `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`.trim()

      const sanitizedItems = items.map((item) => ({
        id: String(item.id || item.product_id || ''),
        product_id: String(item.product_id || item.id || ''),
        name: item.name || item.product_name || 'Product',
        quantity: item.quantity || 1,
        price: item.price ?? item.unit_price ?? item.final_price ?? 0,
        selected_options: item.selected_options || {},
        imageUrl: item.imageUrl || null
      }))

      let deliveryAddress = customerInfo.address.trim()

      if (customerInfo.landmark.trim()) {
        deliveryAddress += ` (Closest Landmark: ${customerInfo.landmark.trim()})`
      }

      const finalAddress =
        fulfillmentMethod === 'pickup'
          ? '[STORE PICKUP] De-echoi Kitchen, Woji, Port Harcourt'
          : deliveryAddress

      const orderPayload = {
        customer_name: fullName,
        customer_email: customerInfo.email.trim(),
        customer_phone: customerInfo.phone.trim(),
        delivery_address: finalAddress,
        delivery_city: customerInfo.city.trim(),
        delivery_state: customerInfo.state.trim(),
        fulfillment_method: fulfillmentMethod,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        delivery_fee: activeDeliveryFee,
        total_amount: finalOrderTotal,
        status: 'pending',
        items: sanitizedItems,
        transaction_pin: (hasTransactionPin && !skipPinForNow && transactionPin) ? transactionPin : null
      }

      const {
        data: order,
        error: insertError
      } = await supabase
        .from('store_orders')
        .insert([orderPayload])
        .select('*')
        .single()

      if (insertError) {
        throw new Error(
          insertError.message ||
          'Failed to place order.'
        )
      }

      if (!order?.id) {
        throw new Error(
          'Order was placed but no order ID was returned.'
        )
      }

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

        localStorage.setItem(
          'deechoi_customer_session',
          JSON.stringify(customerSession)
        )

        const existingOrders = JSON.parse(
          localStorage.getItem('deechoi_customer_orders') || '[]'
        )

        const updatedOrders = Array.from(
          new Set([order.id, ...existingOrders])
        )

        localStorage.setItem(
          'deechoi_customer_orders',
          JSON.stringify(updatedOrders)
        )

        window.dispatchEvent(
          new Event('deechoi_order_placed')
        )
      } catch (storageErr) {
        console.warn(
          'Storage persistence warning:',
          storageErr
        )
      }

      // Immediately trigger notifications API (Database update + Email confirmation dispatch)
      try {
        await fetch('/api/notifications/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order: {
              ...order,
              promo_code: appliedVoucher,
              discount_amount: discountAmount
            }
          }),
        })
      } catch (err) {
        console.warn('Immediate notification dispatch warning:', err)
      }

      clearCart()

      localStorage.removeItem(
        'active_checkout_voucher'
      )

      localStorage.removeItem(
        'active_discount_percent'
      )

      router.push(
        `/order-confirmation/${order.id}`
      )
    } catch (error: any) {
      console.error(
        'Full Order Submission Error:',
        error
      )

      alert(
        error.message ||
        'Failed to place order. Please check your connection and try again.'
      )
    } finally {
      setLoading(false)
    }
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

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Your cart is currently empty
            </h2>

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
            <span className={step === 1 ? 'text-[#0A2E1D] font-bold' : 'text-gray-400'}>
              1. Details
            </span>

            <span>›</span>

            <span className={step === 2 ? 'text-[#0A2E1D] font-bold' : 'text-gray-400'}>
              2. Payment
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-black text-[#0A2E1D] flex items-center gap-2">
            <Truck className="w-7 h-7 text-[#EAA823]" />
            Complete Your Order
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Fast, secure delivery across Port Harcourt or free store pickup.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">

            {step === 1 ? (
              <form
                onSubmit={handleProceedToPayment}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-4">
                    Contact Information
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Email Address *
                    </label>

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
                  <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-3">
                    Fulfillment Method
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('dispatch')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                        fulfillmentMethod === 'dispatch'
                          ? 'border-[#0A2E1D] bg-[#0A2E1D]/5 text-[#0A2E1D]'
                          : 'border-gray-200 bg-[#FDFBF7] text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-5 h-5 text-[#EAA823]" />

                        <div>
                          <p className="text-xs sm:text-sm font-bold">
                            Dispatch Delivery
                          </p>

                          <p className="text-[10px] text-gray-500">
                            Calculated Zone Fee
                          </p>
                        </div>
                      </div>

                      {fulfillmentMethod === 'dispatch' && (
                        <CheckCircle2 className="w-4 h-4 text-[#0A2E1D]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('pickup')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                        fulfillmentMethod === 'pickup'
                          ? 'border-[#0A2E1D] bg-[#0A2E1D]/5 text-[#0A2E1D]'
                          : 'border-gray-200 bg-[#FDFBF7] text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Store className="w-5 h-5 text-[#EAA823]" />

                        <div>
                          <p className="text-xs sm:text-sm font-bold">
                            Direct Pickup Point
                          </p>

                          <p className="text-[10px] font-bold text-green-600">
                            FREE
                          </p>
                        </div>
                      </div>

                      {fulfillmentMethod === 'pickup' && (
                        <CheckCircle2 className="w-4 h-4 text-[#0A2E1D]" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                          First Name *
                        </label>

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
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                          Last Name
                        </label>

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
                        Phone Number *
                      </label>

                      <input
                        type="tel"
                        name="phone"
                        required
                        value={customerInfo.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                        placeholder="e.g. 08031234567"
                      />
                    </div>

                    {fulfillmentMethod === 'dispatch' && (
                      <>
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 mb-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase">
                              Street Address (Port Harcourt Area) *
                            </label>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleUseCurrentLocation}
                              disabled={locating}
                              className="gap-2 text-[#0A2E1D] border-gray-300 hover:bg-gray-50 text-xs rounded-full font-bold self-start sm:self-auto"
                            >
                              <Navigation className="w-3.5 h-3.5 text-[#EAA823]" />

                              {locating
                                ? 'Locating...'
                                : 'Use Current Location'}
                            </Button>
                          </div>

                          <div className="relative">
                            <input
                              ref={addressInputRef}
                              type="text"
                              name="address"
                              required={fulfillmentMethod === 'dispatch'}
                              value={customerInfo.address}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                              placeholder="e.g. 12 Woji Road, Port Harcourt..."
                            />

                            <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 pt-2">
                            Closest Landmark (Optional)
                          </label>

                          <div className="relative">
                            <input
                              type="text"
                              name="landmark"
                              value={customerInfo.landmark}
                              onChange={handleInputChange}
                              onFocus={() => {
                                if (landmarkOptions.length > 0) {
                                  setShowLandmarkDropdown(true)
                                }
                              }}
                              onBlur={() =>
                                setTimeout(
                                  () =>
                                    setShowLandmarkDropdown(false),
                                  200
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#FDFBF7] text-sm text-[#0A2E1D] focus:outline-none focus:ring-2 focus:ring-[#0A2E1D]"
                              placeholder="e.g. Near St. John Church, Zenith Bank..."
                            />

                            {showLandmarkDropdown && landmarkOptions.length > 0 && (
                              <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-48 overflow-y-auto">
                                <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                  Suggested Nearby Landmarks
                                </p>
                                {landmarkOptions.map((lm, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => selectLandmark(lm)}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-[#0A2E1D] transition flex items-center gap-2"
                                  >
                                    <MapPin className="w-3 h-3 text-[#EAA823]" />
                                    {lm}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold py-4 rounded-xl text-sm transition shadow-md"
                >
                  Proceed to Payment
                </Button>
              </form>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-gray-500 hover:text-[#0A2E1D] flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Details
                  </button>
                  <span className="text-xs font-bold text-[#0A2E1D] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Step 2 of 2
                  </span>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#0A2E1D] mb-4">
                    Payment Method
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-[#0A2E1D] bg-[#0A2E1D]/5 text-[#0A2E1D]'
                          : 'border-gray-200 bg-[#FDFBF7] text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-5 h-5 text-[#EAA823]" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold">Bank Transfer</p>
                          <p className="text-[10px] text-gray-500">Instant AI verification</p>
                        </div>
                      </div>
                      {paymentMethod === 'bank_transfer' && (
                        <CheckCircle2 className="w-4 h-4 text-[#0A2E1D]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#0A2E1D] bg-[#0A2E1D]/5 text-[#0A2E1D]'
                          : 'border-gray-200 bg-[#FDFBF7] text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-[#EAA823]" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold">Online Card</p>
                          <p className="text-[10px] text-gray-500">Paystack Gateway</p>
                        </div>
                      </div>
                      {paymentMethod === 'card' && (
                        <CheckCircle2 className="w-4 h-4 text-[#0A2E1D]" />
                      )}
                    </button>
                  </div>

                  {paymentMethod === 'bank_transfer' ? (
                    <div className="space-y-4">
                      <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Transfer Exact Amount To:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400 block">Bank Name</span>
                            <span className="font-black text-[#0A2E1D]">{BANK_DETAILS.bankName}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Account Number</span>
                            <span className="font-black text-[#0A2E1D] font-mono text-sm">{BANK_DETAILS.accountNumber}</span>
                          </div>
                          <div className="col-span-2 pt-1">
                            <span className="text-gray-400 block">Account Name</span>
                            <span className="font-black text-[#0A2E1D]">{BANK_DETAILS.accountName}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                          Upload Transfer Receipt (PDF or Image) *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:border-[#0A2E1D] transition bg-[#FDFBF7] relative">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            required={paymentMethod === 'bank_transfer'}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {proofFile ? (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <span className="text-xs font-bold text-gray-800 truncate">{proofFile.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setProofFile(null)
                                  setProofPreview(null)
                                }}
                                className="text-xs text-red-600 hover:underline p-1"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="py-2">
                              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs font-bold text-gray-700">Click to upload transfer receipt</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG or PDF up to 10MB</p>
                            </div>
                          )}
                        </div>
                        {validationError && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{validationError}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-3">
                      <CreditCard className="w-8 h-8 text-amber-700 mx-auto" />
                      <p className="text-xs font-bold text-[#0A2E1D]">Secure Paystack Checkout</p>
                      <p className="text-[11px] text-gray-600">
                        You will be redirected to complete your card transaction securely after order placement.
                      </p>
                    </div>
                  )}
                </div>

                {/* 5-Digit Transaction PIN Setup Option */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasTransactionPin}
                        onChange={(e) => setHasTransactionPin(e.target.checked)}
                        className="w-4 h-4 accent-[#0A2E1D] rounded"
                      />
                      <span className="text-xs font-bold text-[#0A2E1D] flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" /> Secure with a 5-digit Transaction PIN
                      </span>
                    </label>
                  </div>
                  
                  {hasTransactionPin && (
                    <div className="mt-3 p-4 bg-[#FDFBF7] rounded-2xl border border-gray-200 space-y-3 animate-in fade-in duration-150">
                      <p className="text-[11px] text-gray-600">
                        Create a 5-digit PIN so you can easily track orders and checkout securely next time without re-entering details.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">5-Digit PIN</label>
                          <input
                            type="password"
                            maxLength={5}
                            placeholder="e.g. 12345"
                            value={transactionPin}
                            onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-center tracking-widest font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Confirm PIN</label>
                          <input
                            type="password"
                            maxLength={5}
                            placeholder="e.g. 12345"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-center tracking-widest font-bold"
                          />
                        </div>
                      </div>
                      {pinError && <p className="text-[10px] text-red-600 font-semibold">{pinError}</p>}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || isScanning}
                  className="w-full bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold py-4 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading || isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isScanning ? 'Verifying Receipt with AI...' : 'Placing Order...'}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#EAA823]" />
                      Complete Order (₦{finalOrderTotal.toLocaleString()})
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-[#0A2E1D] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#EAA823]" /> Order Summary
            </h2>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const itemPrice = Number(item.price ?? item.unit_price ?? item.final_price ?? 0)
                const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1
                return (
                  <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-none">
                    <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      <Image
                        src={item.imageUrl || item.image || '/logo.png'}
                        alt={item.name || 'Product'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.name || item.product_name}</p>
                      <p className="text-[10px] text-gray-400">Qty: {qty}</p>
                    </div>
                    <p className="text-xs font-black text-[#0A2E1D]">₦{(itemPrice * qty).toLocaleString()}</p>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">₦{rawSubtotal.toLocaleString()}</span>
              </div>

              {appliedVoucher && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Voucher ({appliedVoucher})
                  </span>
                  <span className="font-black">-₦{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee ({fulfillmentMethod === 'pickup' ? 'Store Pickup' : 'Port Harcourt Zone'})</span>
                <span className="font-semibold text-gray-800">
                  {activeDeliveryFee === 0 ? 'FREE' : `₦{activeDeliveryFee.toLocaleString()}`}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-black text-[#0A2E1D]">
                <span>Total Amount</span>
                <span className="text-lg text-amber-700">₦{finalOrderTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-[#FDFBF7] rounded-2xl border border-gray-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0A2E1D] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-gray-600 space-y-1">
                <p className="font-bold text-[#0A2E1D]">Guaranteed Freshness & Secure Delivery</p>
                <p>Every cake and meal is freshly prepared upon order confirmation and handled with utmost hygiene.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}