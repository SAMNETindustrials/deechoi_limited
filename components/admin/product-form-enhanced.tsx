'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductImageUploader } from './product-image-uploader'

interface ProductFormEnhancedProps {
  initialData?: {
    name: string
    description: string
    price: string
    image_url: string | null
    category: string
    in_stock: boolean
    stock_quantity: string
  }
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  isEditing?: boolean
}

export function ProductFormEnhanced({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false
}: ProductFormEnhancedProps) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    price: '',
    image_url: null,
    category: '',
    in_stock: true,
    stock_quantity: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.price) newErrors.price = 'Price is required'
    if (!formData.category) newErrors.category = 'Category is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Image Upload */}
      <div className="lg:col-span-1">
        <ProductImageUploader
          value={formData.image_url}
          onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
          label="Product Image"
        />
      </div>

      {/* Right Column - Product Details */}
      <div className="lg:col-span-2 space-y-4">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Product Name *
          </label>
          <Input
            type="text"
            placeholder="e.g., Jollof Rice with Beef"
            value={formData.name}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, name: e.target.value }))
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
            }}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Category and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, category: e.target.value }))
                if (errors.category) setErrors(prev => ({ ...prev, category: '' }))
              }}
              className={`w-full px-3 py-2 rounded-md border ${
                errors.category
                  ? 'border-red-500'
                  : 'border-border'
              } bg-background text-foreground`}
            >
              <option value="">Select Category</option>
              <option value="Rice Dishes">Rice Dishes</option>
              <option value="Swallow">Swallow</option>
              <option value="Soups">Soups</option>
              <option value="Proteins">Proteins</option>
              <option value="Beverages">Beverages</option>
              <option value="Sides">Sides</option>
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Price (₦) *
            </label>
            <Input
              type="number"
              placeholder="5000"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, price: e.target.value }))
                if (errors.price) setErrors(prev => ({ ...prev, price: '' }))
              }}
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>
        </div>

        {/* Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Stock Quantity
            </label>
            <Input
              type="number"
              placeholder="100"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              value={formData.in_stock ? 'in_stock' : 'out_stock'}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, in_stock: e.target.value === 'in_stock' }))
              }
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
            >
              <option value="in_stock">In Stock</option>
              <option value="out_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <Textarea
            placeholder="Describe your product, ingredients, preparation method, etc."
            value={formData.description}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            className="min-h-32"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}
