'use client'

import React, { createContext, useContext, useState, useCallback, Key } from 'react'

export interface CartItem {
  prep_time: any
  prep_time: any
  cooking_time: any
  cooking_time: any
  fulfillment_time: any
  fulfillment_time: any
  name: string | undefined
  id: Key | null | undefined
  imageUrl: any
  price: any
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  final_price: number
  selected_options?: Array<{
    groupName: string
    optionName: string
    priceModifier: number
  }>
  price_modifier?: number
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.final_price, 0)

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existingItem = prev.find(i => i.product_id === item.product_id)
      if (existingItem) {
        return prev.map(i =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + item.quantity, final_price: i.final_price + item.final_price }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product_id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity, final_price: item.unit_price * quantity }
          : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  return (
    <CartContext.Provider value={{ items, itemCount, total, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
