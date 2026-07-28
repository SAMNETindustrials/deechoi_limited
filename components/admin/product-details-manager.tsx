'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-react'

interface ProductDetailsManagerProps {
  productId: string
  onSaved?: () => void
}

interface ProductDetails {
  description: string
  ingredients: string[]
  allergens: string[]
  preparation_time_minutes: number | string
  servings: number | string
  storage_instructions: string
}

export function ProductDetailsManager({ productId, onSaved }: ProductDetailsManagerProps) {
  const [details, setDetails] = useState<ProductDetails>({
    description: '',
    ingredients: [],
    allergens: [],
    preparation_time_minutes: '',
    servings: '',
    storage_instructions: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newIngredient, setNewIngredient] = useState('')
  const [newAllergen, setNewAllergen] = useState('')

  useEffect(() => {
    fetchDetails()
  }, [productId])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/details`)
      const data = await response.json()

      if (data.success && data.data) {
        setDetails(data.data)
      }
    } catch (error) {
      console.error('[v0] Failed to fetch details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/products/${productId}/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      })

      const data = await response.json()
      if (data.success) {
        alert('Details saved successfully')
        onSaved?.()
      } else {
        alert('Failed to save details')
      }
    } catch (error) {
      console.error('[v0] Save error:', error)
      alert('Error saving details')
    } finally {
      setSaving(false)
    }
  }

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setDetails({
        ...details,
        ingredients: [...details.ingredients, newIngredient.trim()]
      })
      setNewIngredient('')
    }
  }

  const removeIngredient = (index: number) => {
    setDetails({
      ...details,
      ingredients: details.ingredients.filter((_, i) => i !== index)
    })
  }

  const addAllergen = () => {
    if (newAllergen.trim()) {
      setDetails({
        ...details,
        allergens: [...details.allergens, newAllergen.trim()]
      })
      setNewAllergen('')
    }
  }

  const removeAllergen = (index: number) => {
    setDetails({
      ...details,
      allergens: details.allergens.filter((_, i) => i !== index)
    })
  }

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading details...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">
          Product Description
        </label>
        <Textarea
          value={details.description}
          onChange={(e) =>
            setDetails({ ...details, description: e.target.value })
          }
          placeholder="Detailed description of the product..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Preparation Time (minutes)
          </label>
          <Input
            type="number"
            value={details.preparation_time_minutes}
            onChange={(e) =>
              setDetails({
                ...details,
                preparation_time_minutes: e.target.value
              })
            }
            placeholder="30"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Servings
          </label>
          <Input
            type="number"
            value={details.servings}
            onChange={(e) =>
              setDetails({
                ...details,
                servings: e.target.value
              })
            }
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Storage Instructions
        </label>
        <Textarea
          value={details.storage_instructions}
          onChange={(e) =>
            setDetails({ ...details, storage_instructions: e.target.value })
          }
          placeholder="How to store this product..."
          rows={2}
        />
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Ingredients
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="e.g., Rice, Tomato, Onion"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addIngredient()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addIngredient}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {details.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-muted px-3 py-2 rounded"
            >
              <span className="text-sm">{ingredient}</span>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-destructive hover:text-destructive/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Allergens */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Allergens
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newAllergen}
            onChange={(e) => setNewAllergen(e.target.value)}
            placeholder="e.g., Peanuts, Shellfish"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addAllergen()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addAllergen}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {details.allergens.map((allergen, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-red-50 px-3 py-2 rounded border border-red-200"
            >
              <span className="text-sm text-red-900">{allergen}</span>
              <button
                type="button"
                onClick={() => removeAllergen(index)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {saving ? 'Saving...' : 'Save Details'}
      </Button>
    </div>
  )
}
