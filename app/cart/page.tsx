'use client'

import React, { useState, useEffect } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  Tag, 
  Check, 
  Sparkles, 
  Info, 
  Loader2,
  ShieldCheck,
  X,
  AlertTriangle,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const router = useRouter()
  const supabase = createClient()

  // Hydration safeguard for cart values & Storefront Pre-Order status
  const [isMounted, setIsMounted] = useState(false)
  const [isStoreLive, setIsStoreLive] = useState(true)

  useEffect(() => {
    setIsMounted(true)

    // Check if storefront is in live or pre-order mode
    const storeStatus = localStorage.getItem('deechoi_storefront_active')
    if (storeStatus !== null) {
      setIsStoreLive(storeStatus === 'true')
    }

    checkAccountStatus()
    checkStoredVoucher()
  }, [])

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [validatingVoucher, setValidatingVoucher] = useState(false)
  const [voucherMessage, setVoucherMessage] = useState<{ text: string; isSuccess: boolean } | null>(null)
  const [hasAccount, setHasAccount] = useState(false)

  const checkAccountStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setHasAccount(true)
        return
      }

      const storedEmail = localStorage.getItem('deechoi_customer_email')
      if (storedEmail) {
        const { data } = await supabase
          .from('customer_accounts')
          .select('id')
          .ilike('customer_email', storedEmail)
          .limit(1)
          .maybeSingle()

        if (data) setHasAccount(true)
      }
    } catch (e) {
      console.warn('Account check note:', e)
    }
  }

  const checkStoredVoucher = () => {
    const activeVoucher = localStorage.getItem('active_checkout_voucher')
    if (activeVoucher) {
      setVoucherCode(activeVoucher)
      validateAndApplyVoucher(activeVoucher)
    }
  }

  const validateAndApplyVoucher = async (codeToTest?: string) => {
    const targetCode = (codeToTest || voucherCode).trim().toUpperCase()
    if (!targetCode) {
      setVoucherMessage({ text: 'Please enter a voucher code.', isSuccess: false })
      return
    }

    try {
      setValidatingVoucher(true)
      setVoucherMessage(null)

      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode }),
      })

      const data = await res.json()

      if (data.valid) {
        const pct = Number(data.discountPercentage) || 15
        setDiscountPercent(pct)
        setAppliedCode(data.code || targetCode)
        setVoucherMessage({ 
          text: data.message || `🎉 Voucher Applied! ${pct}% discount granted.`, 
          isSuccess: true 
        })
        localStorage.setItem('active_checkout_voucher', targetCode)
      } else {
        setDiscountPercent(0)
        setAppliedCode(null)
        setVoucherMessage({ 
          text: data.message || 'Invalid or expired voucher code.', 
          isSuccess: false 
        })
      }
    } catch (err: any) {
      setVoucherMessage({ text: 'Could not validate voucher. Please try again.', isSuccess: false })
    } finally {
      setValidatingVoucher(false)
    }
  }

  const removeVoucher = () => {
    setVoucherCode('')
    setAppliedCode(null)
    setDiscountPercent(0)
    setVoucherMessage(null)
    localStorage.removeItem('active_checkout_voucher')
  }

  const rawSubtotal = Number(total) || items.reduce((acc, item) => {
    const unitPrice = Number(item.price ?? item.unit_price ?? item.final_price ?? 0)
    const qty = Number(item.quantity) || 1
    return acc + (unitPrice * qty)
  }, 0)

  const safeDiscountPercent = Number(discountPercent) || 0
  const discountAmount = appliedCode ? (rawSubtotal * (safeDiscountPercent / 100)) : 0
  const finalPayable = Math.max(0, rawSubtotal - discountAmount)

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty')
      return
    }
    if (appliedCode) {
      localStorage.setItem('active_checkout_voucher', appliedCode)
      localStorage.setItem('active_discount_percent', String(safeDiscountPercent))
    }
    router.push('/checkout')
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-24">
      <StorefrontHeader />

      {/* Pre-Order Mode Notification Banner */}
      {!isStoreLive && (
        <div className="bg-amber-600 text-white px-4 py-3 text-center text-xs font-black uppercase tracking-wider sticky top-20 z-50 shadow-md flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>Notice: Storefront is in <span className="underline">Pre-Order Mode</span>. Items added to your cart will be processed as scheduled pre-orders.</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] flex items-center gap-1.5 transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Ordering
          </Link>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 font-semibold hover:underline cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-4xl font-black text-[#0A2E1D] flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-[#EAA823]" />
            Your Shopping Cart
          </h1>

          {!isStoreLive && (
            <div className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-2xl text-xs font-extrabold">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Pre-Order Mode Active</span>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EAA823]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Your cart is currently empty</h2>
            <p className="text-gray-500 text-xs sm:text-sm mb-6 max-w-xs mx-auto">
              Explore our freshly baked celebration cakes, parfait treats, and hot meals to get started!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/cakes">
                <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6 text-xs cursor-pointer">
                  Browse Cakes
                </Button>
              </Link>
              <Link href="/#our-menu-section">
                <Button variant="outline" className="border-gray-300 rounded-full px-6 text-xs font-bold cursor-pointer">
                  View Food Menu
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              
              {!isStoreLive && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Pre-Order Notice</span>
                    <span>The kitchen has closed live orders for today. Items in your cart will be booked as scheduled pre-orders for fulfillment upon the next active shift.</span>
                  </div>
                </div>
              )}

              {items.map((item) => {
                const targetKey: string = String(item.id || item.product_id || '')
                const unitPrice = Number(item.price ?? item.unit_price ?? item.final_price ?? 0)
                const qty = Number(item.quantity) || 1
                const lineTotal = unitPrice * qty
                const options = item.selected_options

                return (
                  <div
                    key={targetKey}
                    className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition"
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 self-center sm:self-start border border-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name ?? item.product_name ?? 'Item'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                          DE-ECHOI
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <h3 className="font-extrabold text-[#0A2E1D] text-sm sm:text-base leading-tight">
                          {item.name ?? item.product_name}
                        </h3>
                        {!isStoreLive && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            Pre-Order
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-black text-[#EAA823]">
                        ₦{unitPrice.toLocaleString()} each
                      </p>

                      {Array.isArray(options) && options.length > 0 ? (
                        <div className="mt-2 text-[11px] bg-[#FDFBF7] p-2.5 rounded-xl border border-gray-100 space-y-1">
                          {options.map((opt, i) => (
                            <div key={i} className="flex justify-between sm:justify-start gap-1.5 text-gray-700">
                              <span className="font-bold text-[#0A2E1D]">{opt.groupName}:</span>
                              <span>{opt.optionName}</span>
                              {Number(opt.priceModifier) > 0 && (
                                <span className="text-[10px] text-[#EAA823] font-bold">
                                  (+₦{Number(opt.priceModifier).toLocaleString()})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex sm:flex-col items-center justify-between sm:items-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <div className="flex items-center gap-1.5 bg-[#FDFBF7] border border-gray-200 rounded-full p-1 shadow-xs">
                        <button
                          onClick={() => updateQuantity(targetKey, Math.max(1, qty - 1))}
                          className="p-1 rounded-full hover:bg-white text-gray-600 active:scale-90 transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-[#0A2E1D]">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(targetKey, qty + 1)}
                          className="p-1 rounded-full hover:bg-white text-gray-600 active:scale-90 transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm sm:text-base text-[#0A2E1D]">
                          ₦{lineTotal.toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItem(targetKey)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: Order Summary & Voucher Redemption Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-20 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-black text-[#0A2E1D] pb-3 border-b border-gray-100 flex items-center justify-between">
                  <span>{!isStoreLive ? 'Pre-Order Summary' : 'Order Summary'}</span>
                  <span className="text-xs text-gray-400 font-semibold">{itemCount} items</span>
                </h2>

                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A2E1D] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#EAA823]" />
                      Have a Promo or Voucher Code?
                    </span>
                    {appliedCode && (
                      <button 
                        onClick={removeVoucher}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g. VIP15-7K9A2"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCode || validatingVoucher}
                      className="bg-white border-gray-300 text-xs font-mono font-bold text-[#0A2E1D] rounded-xl h-10"
                    />
                    <Button
                      type="button"
                      onClick={() => validateAndApplyVoucher()}
                      disabled={!voucherCode.trim() || !!appliedCode || validatingVoucher}
                      className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold text-xs rounded-xl px-4 h-10 cursor-pointer flex-shrink-0"
                    >
                      {validatingVoucher ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : appliedCode ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>

                  {voucherMessage && (
                    <p className={`text-[11px] font-semibold ${voucherMessage.isSuccess ? 'text-emerald-700' : 'text-red-600'}`}>
                      {voucherMessage.text}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-[#0A2E1D]">₦{rawSubtotal.toLocaleString()}</span>
                  </div>

                  {appliedCode && (
                    <div className="flex justify-between text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <span className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#EAA823]" />
                        Voucher Discount ({safeDiscountPercent}%):
                      </span>
                      <span className="font-black">-₦{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-500">
                    <span>Estimated Fulfillment</span>
                    <span className="text-amber-700 font-semibold">{!isStoreLive ? 'Scheduled Pre-Order' : 'Standard Delivery'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-600">Total Payable:</span>
                  <span className="text-2xl font-black text-[#0A2E1D]">
                    ₦{finalPayable.toLocaleString()}
                  </span>
                </div>

                <Button
                  className={`w-full text-white font-extrabold py-6 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    !isStoreLive 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D]'
                  }`}
                  size="lg"
                  onClick={handleCheckout}
                >
                  <span>{!isStoreLive ? 'Checkout Pre-Order' : 'Proceed to Checkout'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}