'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty')
      return
    }
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">
      <StorefrontHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/" 
            className="text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Ordering
          </Link>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 font-semibold hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-[#0A2E1D] mb-6 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-[#EAA823]" />
          Your Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EAA823]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Your cart is currently empty</h2>
            <p className="text-gray-500 text-xs sm:text-sm mb-6 max-w-xs mx-auto">
              Explore our freshly baked celebration cakes or delicious hot meals to get started!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/cakes">
                <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6 text-xs">
                  Browse Cakes
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-gray-300 rounded-full px-6 text-xs font-bold">
                  View Food Menu
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const targetKey: string = String(item.id || item.product_id || '')
                const unitPrice = item.price ?? item.unit_price ?? item.final_price ?? 0
                const lineTotal = unitPrice * item.quantity
                const options = item.selected_options || {}

                return (
                  <div
                    key={targetKey}
                    className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition"
                  >
                    {/* Item Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 self-center sm:self-start">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name ?? item.product_name ?? 'Item'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                          DEECHOI
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <h3 className="font-extrabold text-[#0A2E1D] text-sm sm:text-base leading-tight">
                        {item.name ?? item.product_name}
                      </h3>

                      <p className="text-xs font-black text-[#EAA823]">
                        ₦{unitPrice.toLocaleString()} each
                      </p>

                      {/* Display Selected Customization Metadata */}
                      {Object.keys(options).length > 0 && (
                        <div className="mt-2 text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-100 space-y-0.5">
                          {Object.entries(options).map(([k, v]) => (
                            <div key={k} className="flex justify-between sm:justify-start gap-1.5 text-gray-600">
                              <span className="font-semibold text-gray-500">{k}:</span>
                              <span>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex sm:flex-col items-center justify-between sm:items-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full p-1">
                        <button
                          onClick={() => updateQuantity(targetKey, Math.max(1, item.quantity - 1))}
                          className="p-1 rounded-full hover:bg-white text-gray-600 active:scale-90 transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-[#0A2E1D]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(targetKey, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-white text-gray-600 active:scale-90 transition"
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
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition"
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

            {/* Order Summary Checkout Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-black text-[#0A2E1D] pb-3 border-b border-gray-100">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Total Quantity</span>
                    <span className="font-bold text-[#0A2E1D]">{itemCount} items</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#0A2E1D]">₦{(total ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Estimated Delivery</span>
                    <span className="text-green-600 font-semibold">Calculated at Checkout</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-600">Total Payable:</span>
                  <span className="text-2xl font-black text-[#0A2E1D]">
                    ₦{(total ?? 0).toLocaleString()}
                  </span>
                </div>

                <Button
                  className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-extrabold py-6 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  size="lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
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