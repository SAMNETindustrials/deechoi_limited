'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Upload, X, CreditCard, Building2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
    city: '',
    state: '',
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }))
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
          total_amount: total,
          status: 'pending',
          items: items
        })
        .select('id')
        .single()

      if (error) throw error

      clearCart()
      
      // Redirect user to the order confirmation page
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
                  <h2 className="text-2xl font-bold text-foreground mb-4">Shipping Address</h2>
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

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Address *</label>
                      <textarea
                        name="address"
                        required
                        value={customerInfo.address}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Street address or delivery location"
                      />
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
                    {loading ? 'Processing Order...' : 'Complete Order'}
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
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-xs text-muted-foreground">Calculated at dispatch</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border text-base">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-xl text-primary">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}