'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ProductOption {
  id: string
  name: string
  description?: string
  price_modifier: number
  is_available: boolean
}

interface OptionGroup {
  id: string
  name: string
  description?: string
  is_required: boolean
  product_options: ProductOption[]
}

interface SelectedOptions {
  [groupId: string]: string // Store selected option ID
}

interface ProductCustomizationSelectorProps {
  productId: string
  basePrice: number
  onSelectOptions: (options: SelectedOptions, totalModifier: number) => void
}

export function ProductCustomizationSelector({
  productId,
  basePrice,
  onSelectOptions
}: ProductCustomizationSelectorProps) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({})
  const [totalModifier, setTotalModifier] = useState(0)

  useEffect(() => {
    fetchOptions()
  }, [productId])

  const fetchOptions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/options`)
      const data = await response.json()

      if (data.success && data.data) {
        setOptionGroups(data.data)
      }
    } catch (error) {
      console.error('[v0] Failed to fetch options:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (groupId: string, optionId: string) => {
    const newSelected = { ...selectedOptions, [groupId]: optionId }
    setSelectedOptions(newSelected)

    // Calculate total price modifier
    let total = 0
    optionGroups.forEach((group) => {
      const selectedOptionId = newSelected[group.id]
      if (selectedOptionId) {
        const option = group.product_options.find((opt) => opt.id === selectedOptionId)
        if (option) {
          total += option.price_modifier
        }
      }
    })

    setTotalModifier(total)
    onSelectOptions(newSelected, total)
  }

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading options...</div>
  }

  if (optionGroups.length === 0) {
    return null
  }

  const finalPrice = basePrice + totalModifier

  return (
    <div className="space-y-6 border border-border rounded-lg p-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Customize Your Order</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferences below
        </p>
      </div>

      {optionGroups.map((group) => (
        <div key={group.id} className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <label className="font-medium text-foreground block">
                {group.name}
                {group.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {group.product_options
              .filter((opt) => opt.is_available)
              .map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="radio"
                    name={`group-${group.id}`}
                    value={option.id}
                    checked={selectedOptions[group.id] === option.id}
                    onChange={() => handleOptionSelect(group.id, option.id)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-foreground">{option.name}</div>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                  {option.price_modifier !== 0 && (
                    <span className="text-sm font-semibold text-foreground">
                      {option.price_modifier > 0 ? '+' : ''}₦{Math.abs(option.price_modifier).toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
          </div>
        </div>
      ))}

      {/* Price Summary */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Price:</span>
          <span className="font-medium">₦{basePrice.toFixed(2)}</span>
        </div>
        {totalModifier !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Modifications:</span>
            <span className={`font-medium ${totalModifier > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalModifier > 0 ? '+' : ''}₦{totalModifier.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="font-semibold">Total Price:</span>
          <span className="text-lg font-bold text-primary">₦{finalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
