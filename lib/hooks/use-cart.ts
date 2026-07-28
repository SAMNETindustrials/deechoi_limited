import { useState, useCallback, useEffect } from 'react'

export interface CartItem {
  id: string // unique cart item id (not product id)
  product_id: string
  product_name: string
  price: number
  quantity: number
  selected_options: Record<string, string> // groupId -> optionId
  price_modifier: number
  final_price: number
  image_url: string | null
  added_at: Date
}

export interface UseCartReturn {
  items: CartItem[]
  total: number
  itemCount: number
  addItem: (item: Omit<CartItem, 'id' | 'added_at'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateItem: (itemId: string, updates: Partial<CartItem>) => void
  clear: () => void
  getItem: (itemId: string) => CartItem | undefined
}

const CART_STORAGE_KEY = 'deechoi_cart'

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setItems(parsed.map((item: any) => ({
          ...item,
          added_at: new Date(item.added_at)
        })))
      }
    } catch (error) {
      console.error('[v0] Failed to load cart:', error)
    }
    setHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, hydrated])

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'added_at'>) => {
    setItems((prev) => [
      ...prev,
      {
        ...item,
        id: `${item.product_id}-${Date.now()}-${Math.random()}`,
        added_at: new Date()
      }
    ])
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              final_price: (item.price + item.price_modifier) * quantity
            }
          : item
      )
    )
  }, [removeItem])

  const updateItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    )
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  const getItem = useCallback(
    (itemId: string) => items.find((item) => item.id === itemId),
    [items]
  )

  const total = items.reduce((sum, item) => sum + item.final_price, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    updateItem,
    clear,
    getItem
  }
}
