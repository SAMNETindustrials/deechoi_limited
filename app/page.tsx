'use client'

import { StorefrontHeader } from '@/components/storefront/header'
import { ProductCard } from '@/components/storefront/product-card'
import { SearchMenu } from '@/components/storefront/search-menu'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  in_stock: boolean
  category: string
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { addItem } = useCart()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredProducts(products)
    } else {
      const lowercaseQuery = query.toLowerCase()
      setFilteredProducts(
        products.filter(
          (product) =>
            product.name.toLowerCase().includes(lowercaseQuery) ||
            product.description?.toLowerCase().includes(lowercaseQuery)
        )
      )
    }
  }

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      addItem({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        imageUrl: product.image_url,
      })
      console.log('[v0] Added to cart:', product.name)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-secondary/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to DEECHOI LIMITED
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Authentic, delicious cooked meals and snacks delivered fresh
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-background border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchMenu />
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Our Menu
            </h2>
            <p className="text-muted-foreground">
              {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery
                  ? 'No products found matching your search.'
                  : 'No products available yet.'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleSearch('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description || ''}
                  price={Number(product.price)}
                  imageUrl={product.image_url}
                  inStock={product.in_stock}
                  onAddToCart={() => handleAddToCart(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">DEECHOI LIMITED</h3>
              <p className="text-sm opacity-90">
                Bringing authentic flavors to your table with quality and care.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#book" className="hover:text-white transition-colors">Book Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-sm">
                <a href="mailto:deechoi01@gmail.com" className="hover:underline">
                  deechoi01@gmail.com
                </a>
              </p>
              <p className="text-sm">
                <a href="tel:+2347046145982" className="hover:underline">
                  +234 704 614 5982
                </a>
              </p>
              <p className="text-sm mt-2">
                Eze Nvuigwe Avenue, Woji<br />
                Port Harcourt, Rivers State, Nigeria
              </p>
            </div>
          </div>
          <div className="border-t border-secondary-foreground/30 pt-8 text-center text-sm opacity-75">
            <p>&copy; Powered by: SAMNET Industrials LTD 2026. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
