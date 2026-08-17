import { createClient } from '@/lib/supabase/client'

interface ProductInfo {
  id: string
  name: string
  description: string
  price: number
  category: string
  in_stock: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

class MrTellAI {
  private supabase = createClient()
  private productCache: ProductInfo[] = []
  private lastCacheUpdate: number = 0
  private CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async initialize() {
    await this.loadProducts()
  }

  private async loadProducts() {
    try {
      const { data, error } = await this.supabase
        .from('store_products')
        .select('id, name, description, price, category, in_stock')

      if (error) throw error
      this.productCache = data || []
      this.lastCacheUpdate = Date.now()
    } catch (error) {
      console.error('[Mr. Tell] Error loading products:', error)
    }
  }

  private async ensureProductsLoaded() {
    if (Date.now() - this.lastCacheUpdate > this.CACHE_DURATION) {
      await this.loadProducts()
    }
  }

  async chat(userMessage: string): Promise<string> {
    await this.ensureProductsLoaded()

    const lowerMessage = userMessage.toLowerCase().trim()

    // Greeting responses
    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey')
    ) {
      return "Hello! I'm Mr. Tell, your DEECHOI assistant. How can I help you today? Would you like to know about our menu, place an order, or ask any questions?"
    }

    // Help/Info request
    if (
      lowerMessage.includes('help') ||
      lowerMessage.includes('what can') ||
      lowerMessage.includes('how can')
    ) {
      return "I can help you with:\n• Finding products by category (meals, shawarma, cakes, pasta, etc.)\n• Checking product prices and availability\n• Answering questions about DEECHOI\n• Guiding you through the ordering process\n\nWhat would you like to know?"
    }

    // Product search by category
    if (
      lowerMessage.includes('category') ||
      lowerMessage.includes('categories')
    ) {
      const categories = [...new Set(this.productCache.map((p) => p.category))]
      return `We have these delicious categories:\n${categories.map((c) => `• ${c}`).join('\n')}\n\nWhich one interests you?`
    }

    // Search for products by name or category
    const searchTerms = userMessage
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
    const matchedProducts = this.productCache.filter((product) =>
      searchTerms.some(
        (term) =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term)
      )
    )

    if (matchedProducts.length > 0) {
      const productList = matchedProducts
        .slice(0, 5)
        .map(
          (p) =>
            `• ${p.name} - ₦${p.price.toFixed(2)} ${p.in_stock ? '✓ In Stock' : '✗ Out of Stock'}`
        )
        .join('\n')

      return `Great! I found these products:\n${productList}\n\nWould you like to order any of these or need more information?`
    }

    // Price inquiries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "Our prices are competitive and vary by product. Would you like me to show you products in a specific category? Just let me know what you're interested in!"
    }

    // Delivery questions
    if (
      lowerMessage.includes('delivery') ||
      lowerMessage.includes('ship') ||
      lowerMessage.includes('how long')
    ) {
      return "We offer fast delivery! Orders are typically delivered within 30-45 minutes depending on your location. We ensure your food arrives fresh and hot. Would you like to place an order?"
    }

    // Stock/Availability
    if (
      lowerMessage.includes('stock') ||
      lowerMessage.includes('available')
    ) {
      const inStock = this.productCache.filter((p) => p.in_stock)
      return `We have ${inStock.length} products currently in stock. What category interests you? (meals, shawarma, cakes, pasta, noodles, etc.)`
    }

    // Default response
    return `That's a great question! To help you better, could you tell me:\n• What type of food are you looking for?\n• Do you have a specific product in mind?\n• Are you ready to order?\n\nI'm here to help make your DEECHOI experience amazing!`
  }

  getAvailableCategories(): string[] {
    return [...new Set(this.productCache.map((p) => p.category))].sort()
  }

  getProductsByCategory(category: string): ProductInfo[] {
    return this.productCache.filter(
      (p) => p.category?.toLowerCase() === category.toLowerCase()
    )
  }

  getAvailableProducts(): ProductInfo[] {
    return this.productCache.filter((p) => p.in_stock)
  }

  searchProducts(query: string): ProductInfo[] {
    const lowerQuery = query.toLowerCase()
    return this.productCache.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
    )
  }
}

export const mrTellAI = new MrTellAI()
