'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface InventoryItem {
  id: string
  name: string
  category: string
  current_stock: number
  reorder_level: number
  reorder_quantity: number
  last_restocked: string | null
  usage_rate: number
}

const CATEGORIES = [
  'Food Stuffs',
  'Gas',
  'Fish',
  'Meat',
  'Chicken',
  'Turkey',
  'Vegetables',
  'Dairy',
  'Beverages',
  'Spices',
]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food Stuffs',
    current_stock: '',
    reorder_level: '',
    reorder_quantity: '',
    usage_rate: '5',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('[v0] Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setFormData({
      name: '',
      category: 'Food Stuffs',
      current_stock: '',
      reorder_level: '',
      reorder_quantity: '',
      usage_rate: '5',
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      current_stock: item.current_stock.toString(),
      reorder_level: item.reorder_level.toString(),
      reorder_quantity: item.reorder_quantity.toString(),
      usage_rate: item.usage_rate.toString(),
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.current_stock) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const data = {
        name: formData.name.trim(),
        category: formData.category,
        current_stock: parseInt(formData.current_stock),
        reorder_level: parseInt(formData.reorder_level),
        reorder_quantity: parseInt(formData.reorder_quantity),
        usage_rate: parseInt(formData.usage_rate),
        last_restocked: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase
          .from('inventory_items')
          .update(data)
          .eq('id', editingId)

        if (error) throw error
        alert('Item updated successfully')
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert([data])

        if (error) throw error
        alert('Item added successfully')
      }

      setShowForm(false)
      fetchInventory()
    } catch (error) {
      console.error('[v0] Error saving inventory:', error)
      alert('Failed to save item')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Item deleted successfully')
      fetchInventory()
    } catch (error) {
      console.error('[v0] Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const getStockStatus = (current: number, reorder: number) => {
    if (current <= reorder) return 'critical'
    if (current <= reorder * 1.5) return 'warning'
    return 'good'
  }

  const getStockPercentage = (current: number, reorder: number) => {
    const maxStock = reorder * 3
    return Math.min((current / maxStock) * 100, 100)
  }

  const getDaysUntilReorder = (current: number, usage: number) => {
    if (usage === 0) return -1
    return Math.ceil(current / usage)
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, InventoryItem[]>)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage your stock levels</p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{items.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/50" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {items.filter(i => i.current_stock <= i.reorder_level).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500/50" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warning Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {items.filter(
                    i =>
                      i.current_stock > i.reorder_level &&
                      i.current_stock <= i.reorder_level * 1.5
                  ).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500/50" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healthy Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {items.filter(
                    i => i.current_stock > i.reorder_level * 1.5
                  ).length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500/50" />
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 text-foreground">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reorder Level (minimum stock)
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reorder Quantity (amount to order)
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Daily Usage Rate (units/day)
                  </label>
                  <input
                    type="number"
                    value={formData.usage_rate}
                    onChange={(e) => setFormData({ ...formData, usage_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                  >
                    {editingId ? 'Update' : 'Add'} Item
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inventory Items by Category */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">{category}</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryItems.map((item) => {
                  const status = getStockStatus(item.current_stock, item.reorder_level)
                  const percentage = getStockPercentage(item.current_stock, item.reorder_level)
                  const daysLeft = getDaysUntilReorder(item.current_stock, item.usage_rate)

                  const statusColor =
                    status === 'critical'
                      ? 'bg-red-500'
                      : status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'

                  return (
                    <div
                      key={item.id}
                      className="bg-card border border-border rounded-lg p-6 space-y-4"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-lg">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Last restocked:{' '}
                            {item.last_restocked
                              ? new Date(item.last_restocked).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 hover:bg-muted rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4 text-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-muted rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Stock Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Stock Level</span>
                          <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                            status === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : status === 'warning'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {item.current_stock} / {item.reorder_level * 3}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${statusColor} transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Current</p>
                          <p className="font-bold text-lg text-foreground">{item.current_stock}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Min Level</p>
                          <p className="font-bold text-lg text-foreground">{item.reorder_level}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Days Left</p>
                          <p className={`font-bold text-lg ${daysLeft <= 7 ? 'text-red-600' : daysLeft <= 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {daysLeft === -1 ? '∞' : daysLeft}
                          </p>
                        </div>
                      </div>

                      {/* Status Alert */}
                      {status === 'critical' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">
                            Critical! Consider reordering {item.reorder_quantity} units immediately.
                          </p>
                        </div>
                      )}

                      {status === 'warning' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-yellow-700">
                            Low stock warning. Plan to reorder soon.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No inventory items yet</p>
            <Button onClick={handleAddNew}>Add First Item</Button>
          </div>
        )}
      </div>
    </div>
  )
}
