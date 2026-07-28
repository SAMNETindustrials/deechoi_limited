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
  [groupId: string]: string // Store selected option ID or Name
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

      // Support both { success: true, data: [...] } and direct { option_groups: [...] } responses
      const rawGroups = data.data || data.option_groups || []

      // Normalize data structure in case IDs are generated dynamically from array indices
      const normalizedGroups: OptionGroup[] = rawGroups.map((group: any, groupIdx: number) => {
        const groupId = group.id || `group-${groupIdx}`
        const optionsList = group.product_options || group.options || []

        return {
          id: groupId,
          name: group.name,
          description: group.description || '',
          is_required: group.is_required ?? true,
          product_options: optionsList.map((opt: any, optIdx: number) => ({
            id: opt.id || `${groupId}-opt-${optIdx}`,
            name: opt.name,
            description: opt.description || '',
            price_modifier: Number(opt.price_modifier) || 0,
            is_available: opt.is_available ?? true
          }))
        }
      })

      setOptionGroups(normalizedGroups)

      // Auto-select first available option for required groups upon opening
      const initialSelected: SelectedOptions = {}
      let initialModifier = 0

      normalizedGroups.forEach((group) => {
        const availableOptions = group.product_options.filter((opt) => opt.is_available)
        if (availableOptions.length > 0) {
          const firstOpt = availableOptions[0]
          initialSelected[group.id] = firstOpt.id
          initialModifier += firstOpt.price_modifier
        }
      })

      setSelectedOptions(initialSelected)
      setTotalModifier(initialModifier)
      onSelectOptions(initialSelected, initialModifier)

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
    return <div className="text-center py-4 text-muted-foreground animate-pulse">Loading customization options...</div>
  }

  if (optionGroups.length === 0) {
    return null
  }

  const finalPrice = basePrice + totalModifier

  return (
    <div className="space-y-6 border border-border rounded-lg p-4 bg-card/50">
      <div>
        <h3 className="text-lg font-semibold mb-1">Customize Your Order</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferences below before adding to cart
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
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedOptions[group.id] === option.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`group-${group.id}`}
                    value={option.id}
                    checked={selectedOptions[group.id] === option.id}
                    onChange={() => handleOptionSelect(group.id, option.id)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-foreground">{option.name}</div>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                  {option.price_modifier !== 0 && (
                    <span className="text-sm font-semibold text-foreground">
                      {option.price_modifier > 0 ? '+' : ''}₦{Math.abs(option.price_modifier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <span className="font-medium">₦{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {totalModifier !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Modifications:</span>
            <span className={`font-medium ${totalModifier > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalModifier > 0 ? '+' : ''}₦{totalModifier.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="font-semibold">Total Price:</span>
          <span className="text-lg font-bold text-primary">
            ₦{finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}