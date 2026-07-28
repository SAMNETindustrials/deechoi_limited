'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

interface Option {
  name: string
  price_modifier: number
  is_available: boolean
}

interface OptionGroup {
  name: string
  is_required: boolean
  options: Option[]
}

export function ProductOptionsManager({ productId }: { productId: string }) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOptions()
  }, [productId])

  const loadOptions = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/options`)
      if (response.ok) {
        const data = await response.json()
        setOptionGroups(data.option_groups || [])
      }
    } catch (error) {
      console.error('[v0] Error loading options:', error)
    } finally {
      setLoading(false)
    }
  }

  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, { name: '', is_required: true, options: [] }])
  }

  const removeOptionGroup = (index: number) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== index))
  }

  const updateOptionGroup = (index: number, field: string, value: any) => {
    const updated = [...optionGroups]
    updated[index] = { ...updated[index], [field]: value }
    setOptionGroups(updated)
  }

  const addOption = (groupIndex: number) => {
    const updated = [...optionGroups]
    updated[groupIndex].options.push({ name: '', price_modifier: 0, is_available: true })
    setOptionGroups(updated)
  }

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...optionGroups]
    updated[groupIndex].options.splice(optionIndex, 1)
    setOptionGroups(updated)
  }

  const updateOption = (groupIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...optionGroups]
    updated[groupIndex].options[optionIndex] = {
      ...updated[groupIndex].options[optionIndex],
      [field]: value
    }
    setOptionGroups(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/products/${productId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_groups: optionGroups })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || `Server returned HTTP ${response.status}`)
      }

      alert('Options saved successfully!')
    } catch (error: any) {
      console.error('[v0] Error saving options:', error)
      alert(`Failed to save options: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading options...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Customization Options</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOptionGroup}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Option Group
        </Button>
      </div>

      {optionGroups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <p>No customization options yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {optionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Group name (e.g., Protein, Cooking Method)"
                    value={group.name}
                    onChange={(e) => updateOptionGroup(groupIndex, 'name', e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={group.is_required}
                      onChange={(e) => updateOptionGroup(groupIndex, 'is_required', e.target.checked)}
                    />
                    Required
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOptionGroup(groupIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="ml-4 space-y-2 border-l border-border pl-4">
                {group.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex gap-2 items-end">
                    <Input
                      placeholder="Option name (e.g., Beef, Fried)"
                      value={option.name}
                      onChange={(e) => updateOption(groupIndex, optionIndex, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price modifier"
                      value={option.price_modifier}
                      onChange={(e) => updateOption(groupIndex, optionIndex, 'price_modifier', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={option.is_available}
                        onChange={(e) => updateOption(groupIndex, optionIndex, 'is_available', e.target.checked)}
                      />
                      Available
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(groupIndex, optionIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(groupIndex)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {optionGroups.length > 0 && (
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {saving ? 'Saving...' : 'Save Options'}
        </Button>
      )}
    </div>
  )
}