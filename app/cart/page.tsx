'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty')
      return
    }

    // Redirect to the checkout page
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-6">Your cart is empty</p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => {
                  const itemPrice = item.price ?? item.final_price ?? 0
                  return (
                    <div
                      key={item.id ?? item.product_id}
                      className="flex gap-4 p-4 border border-border rounded-lg bg-card"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name ?? item.product_name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {item.name ?? item.product_name}
                        </h3>
                        <p className="text-primary font-bold">
                          ₦{itemPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 border border-border rounded">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="p-1 hover:bg-muted"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-muted"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-destructive hover:bg-destructive/10 p-2 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <p className="font-semibold text-foreground">
                          ₦{(itemPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => {
                  clearCart()
                  router.push('/')
                }}
              >
                Continue Shopping
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₦{(total ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items</span>
                    <span>{itemCount}</span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold text-foreground mb-6">
                  <span>Total</span>
                  <span className="text-primary">₦{(total ?? 0).toFixed(2)}</span>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}