'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category: string
  in_stock: boolean
  stock_quantity: number
}

export default function StoreInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    in_stock: true,
    stock_quantity: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
    } catch (error) {
      console.error('[v0] Failed to fetch products:', error)
      alert('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: '',
      in_stock: true,
      stock_quantity: '',
    })
    setEditingId(null)
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category,
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity.toString(),
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.price) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url || null,
        category: formData.category,
        in_stock: formData.in_stock,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
      }

      if (editingId) {
        // Update existing product
        const { error } = await supabase
          .from('store_products')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
        alert('Product updated successfully')
      } else {
        // Create new product
        const { error } = await supabase
          .from('store_products')
          .insert([payload])

        if (error) throw error
        alert('Product added successfully')
      }

      resetForm()
      setShowForm(false)
      fetchProducts()
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('store_products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      alert('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      console.error('[v0] Delete error:', error)
      alert('Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary text-secondary-foreground p-6 border-b border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Store Inventory</h1>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="text-secondary-foreground border-secondary-foreground hover:bg-secondary-foreground/10">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Add Product Button */}
        <div className="mb-6">
          <Button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Button>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Product Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Jollof Rice"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Price (₦) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Category
                  </label>
                  <Input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Main Course"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_quantity: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.in_stock}
                      onChange={(e) =>
                        setFormData({ ...formData, in_stock: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      In Stock
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {submitting
                    ? 'Saving...'
                    : editingId
                    ? 'Update Product'
                    : 'Add Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No products yet</p>
            <Button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 text-foreground font-medium">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold">
                      ₦{product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {product.stock_quantity} units
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          product.in_stock
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
