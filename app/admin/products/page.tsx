'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Trash2, 
  Edit2, 
  Plus, 
  X, 
  ChevronLeft, 
  Cake, 
  Layers, 
  Sparkles, 
  Check, 
  Save 
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProductOptionsManager } from '@/components/admin/product-options-manager'
import { ProductDetailsManager } from '@/components/admin/product-details-manager'
import { ProductFormEnhanced } from '@/components/admin/product-form-enhanced'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category: string
  in_stock: boolean
  stock_quantity: number
  cake_details?: CakeConfig | null
}

interface CakeTierPrice {
  layers: number
  price: number
  label?: string
}

interface CakeConfig {
  size: '6 inches' | '7 inches'
  primaryFlavor: 'Vanilla' | 'Chocolate' | 'Red Velvet' | 'Multi-Flavor Combo'
  tiers: CakeTierPrice[]
  allowCustomInscription: boolean
}

const DEFAULT_6INCH_TIERS: CakeTierPrice[] = [
  { layers: 1, price: 20000, label: '1 Layer' },
  { layers: 2, price: 38500, label: '2 Layers' },
  { layers: 3, price: 52000, label: '3 Layers' },
]

const DEFAULT_7INCH_TIERS: CakeTierPrice[] = [
  { layers: 1, price: 26000, label: '1 Layer' },
  { layers: 2, price: 46000, label: '2 Layers' },
  { layers: 3, price: 55000, label: '3 Layers' },
]

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
    category: 'Cakes',
    in_stock: true,
    stock_quantity: '10',
  })
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'cake_tiers' | 'options' | 'details'>('basic')

  // Cake Customization State
  const [cakeSize, setCakeSize] = useState<'6 inches' | '7 inches'>('6 inches')
  const [cakeFlavor, setCakeFlavor] = useState<'Vanilla' | 'Chocolate' | 'Red Velvet' | 'Multi-Flavor Combo'>('Vanilla')
  const [cakeTiers, setCakeTiers] = useState<CakeTierPrice[]>(DEFAULT_6INCH_TIERS)
  const [allowInscription, setAllowInscription] = useState(true)

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
      console.error('Failed to fetch products:', error)
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
      category: 'Cakes',
      in_stock: true,
      stock_quantity: '10',
    })
    setCakeSize('6 inches')
    setCakeFlavor('Vanilla')
    setCakeTiers(DEFAULT_6INCH_TIERS)
    setAllowInscription(true)
    setEditingId(null)
    setActiveTab('basic')
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category,
      in_stock: product.in_stock,
      stock_quantity: (product.stock_quantity || 0).toString(),
    })
    setEditingId(product.id)

    // Check if cake details exist
    if (product.category?.toLowerCase() === 'cakes' || product.cake_details) {
      const isSeven = product.name.includes('7') || product.description?.includes('7')
      const details = product.cake_details || {
        size: isSeven ? '7 inches' : '6 inches',
        primaryFlavor: product.name.includes('Chocolate') ? 'Chocolate' : product.name.includes('Red Velvet') ? 'Red Velvet' : 'Vanilla',
        tiers: isSeven ? DEFAULT_7INCH_TIERS : DEFAULT_6INCH_TIERS,
        allowCustomInscription: true,
      }

      setCakeSize(details.size)
      setCakeFlavor(details.primaryFlavor as any)
      setCakeTiers(details.tiers || (details.size === '7 inches' ? DEFAULT_7INCH_TIERS : DEFAULT_6INCH_TIERS))
      setAllowInscription(details.allowCustomInscription ?? true)
    }

    setShowForm(true)
  }

  const handleSizeChange = (newSize: '6 inches' | '7 inches') => {
    setCakeSize(newSize)
    if (newSize === '6 inches') {
      setCakeTiers(DEFAULT_6INCH_TIERS)
      if (!formData.price || formData.price === '26000') setFormData(prev => ({ ...prev, price: '20000' }))
    } else {
      setCakeTiers(DEFAULT_7INCH_TIERS)
      if (!formData.price || formData.price === '20000') setFormData(prev => ({ ...prev, price: '26000' }))
    }
  }

  const handleTierPriceChange = (index: number, newPrice: number) => {
    const updated = [...cakeTiers]
    updated[index].price = newPrice
    setCakeTiers(updated)
    if (index === 0) {
      setFormData(prev => ({ ...prev, price: newPrice.toString() }))
    }
  }

  const handleFormSubmit = async (data: any) => {
    if (!data.name.trim() || !data.price) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      const isCake = data.category?.toLowerCase() === 'cakes'

      const payload: any = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        image_url: data.image_url || '/cakes.jpg',
        category: data.category,
        in_stock: data.in_stock,
        stock_quantity: parseInt(data.stock_quantity) || 0,
      }

      // If saving a cake, include structured customization metadata
      if (isCake) {
        payload.cake_details = {
          size: cakeSize,
          primaryFlavor: cakeFlavor,
          tiers: cakeTiers,
          allowCustomInscription: allowInscription,
        }
      }

      if (editingId) {
        const { error } = await supabase
          .from('store_products')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
        alert('Cake product and tier pricing updated successfully')
      } else {
        const { error } = await supabase
          .from('store_products')
          .insert([payload])

        if (error) throw error
        alert('Cake product published successfully to storefront')
      }

      resetForm()
      setShowForm(false)
      fetchProducts()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Failed to save product')
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
      console.error('Delete error:', error)
      alert('Failed to delete product')
    }
  }

  const isCurrentCategoryCake = formData.category?.toLowerCase() === 'cakes'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#0A2E1D] text-white p-6 border-b border-[#12422C]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Cake className="w-6 h-6 text-[#EAA823]" />
              <h1 className="text-3xl font-extrabold">Store Inventory & Cake Admin</h1>
            </div>
            <p className="text-gray-300 text-sm mt-1">Manage food products, live cake pricing matrices, layers, and stock.</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="secondary" className="gap-2 bg-[#12422C] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] border border-[#EAA823]/30">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Top Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                resetForm()
                setFormData(prev => ({ ...prev, category: 'Cakes', price: '20000', name: '6" Classic Cake' }))
                setShowForm(true)
              }}
              className="gap-2 bg-[#EAA823] text-[#0A2E1D] hover:bg-white font-bold"
            >
              <Cake className="w-4 h-4" />
              Add Cake Product
            </Button>

            <Button
              onClick={() => {
                resetForm()
                setFormData(prev => ({ ...prev, category: 'Meals', price: '3500', name: '' }))
                setShowForm(true)
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Standard Food
            </Button>
          </div>

          <Link href="/cakes" target="_blank" className="text-xs font-bold text-[#0A2E1D] hover:underline flex items-center gap-1">
            Preview Live Cake Storefront <Sparkles className="w-3.5 h-3.5 text-[#EAA823]" />
          </Link>
        </div>

        {/* Product / Cake Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <div>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                  {editingId ? 'Edit Product' : 'Create New Product / Cake'}
                  {isCurrentCategoryCake && <span className="text-xs bg-[#EAA823] text-[#0A2E1D] font-bold px-2.5 py-0.5 rounded-full">Cake Mode</span>}
                </h2>
                <p className="text-xs text-muted-foreground">Changes save directly to Supabase and update the live customer storefront.</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'basic'
                    ? 'border-[#0A2E1D] text-[#0A2E1D]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Basic Info
              </button>

              {isCurrentCategoryCake && (
                <button
                  onClick={() => setActiveTab('cake_tiers')}
                  className={`px-4 py-2 font-bold text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeTab === 'cake_tiers'
                      ? 'border-[#EAA823] text-[#0A2E1D] bg-[#EAA823]/10 rounded-t-lg'
                      : 'border-transparent text-[#0A2E1D] hover:text-[#EAA823]'
                  }`}
                >
                  <Layers className="w-4 h-4 text-[#EAA823]" />
                  Cake Tiers & Flavors Matrix
                </button>
              )}

              {editingId && (
                <>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                      activeTab === 'details'
                        ? 'border-[#0A2E1D] text-[#0A2E1D]'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Preparation & Allergens
                  </button>
                  {!isCurrentCategoryCake && (
                    <button
                      onClick={() => setActiveTab('options')}
                      className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === 'options'
                          ? 'border-[#0A2E1D] text-[#0A2E1D]'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Side Options
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <ProductFormEnhanced
                initialData={formData}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false)
                  resetForm()
                }}
                isSubmitting={submitting}
                isEditing={!!editingId}
              />
            )}

            {/* Cake Customization & Tier Pricing Matrix Tab */}
            {activeTab === 'cake_tiers' && isCurrentCategoryCake && (
              <div className="space-y-6 bg-muted/20 p-6 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#0A2E1D]">Cake Customization Matrix</h3>
                    <p className="text-xs text-gray-500">Configure size, default flavor, and layer pricing presets for this cake.</p>
                  </div>
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                    Auto-synced with Customer Modal
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Size Preset */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-600">Default Cake Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['6 inches', '7 inches'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSizeChange(s)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                            cakeSize === s
                              ? 'bg-[#0A2E1D] text-[#EAA823] border-[#0A2E1D] shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {s} Round
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Flavor */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-600">Default Flavor Profile</label>
                    <select
                      value={cakeFlavor}
                      onChange={(e) => setCakeFlavor(e.target.value as any)}
                      className="w-full bg-white border border-gray-200 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:border-[#0A2E1D]"
                    >
                      <option value="Vanilla">Vanilla</option>
                      <option value="Chocolate">Chocolate</option>
                      <option value="Red Velvet">Red Velvet</option>
                      <option value="Multi-Flavor Combo">Multi-Flavor Mix Combo</option>
                    </select>
                  </div>
                </div>

                {/* Tier Pricing Configuration */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <label className="text-xs font-bold uppercase text-gray-600 block">Layer Pricing Presets (₦ Naira)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {cakeTiers.map((tier, idx) => (
                      <div key={tier.layers} className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#0A2E1D]">{tier.layers} Layer{tier.layers > 1 ? 's' : ''}</span>
                          <span className="text-[10px] text-gray-400">Tier #{idx + 1}</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                          <Input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handleTierPriceChange(idx, Number(e.target.value))}
                            className="pl-7 font-bold text-sm text-[#0A2E1D]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inscription switch */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div>
                    <span className="text-sm font-bold text-[#0A2E1D] block">Allow Custom Inscription / Message</span>
                    <span className="text-xs text-gray-500">Allow customers to specify custom lettering (e.g., "Happy Birthday Joy")</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowInscription}
                    onChange={(e) => setAllowInscription(e.target.checked)}
                    className="w-5 h-5 accent-[#0A2E1D] rounded cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    onClick={() => handleFormSubmit({ ...formData, category: 'Cakes' })}
                    disabled={submitting}
                    className="bg-[#0A2E1D] text-[#EAA823] hover:bg-[#12422C] font-bold px-6 rounded-xl flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Save & Sync Cake Product'}
                  </Button>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && editingId && (
              <ProductDetailsManager productId={editingId} />
            )}

            {/* Options Tab */}
            {activeTab === 'options' && editingId && (
              <ProductOptionsManager productId={editingId} />
            )}
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#0A2E1D] border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-sm">Fetching catalog from Supabase...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <p className="mb-4 text-gray-500 font-medium">No products in inventory yet.</p>
            <Button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="gap-2 bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6"
            >
              <Plus className="w-4 h-4" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-border rounded-2xl shadow-sm">
            <table className="w-full">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Product</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Category</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Base Price</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Layers & Customization</th>
                  <th className="px-4 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Status</th>
                  <th className="px-4 py-3.5 text-center font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const isCake = product.category?.toLowerCase() === 'cakes' || product.name.toLowerCase().includes('cake')
                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                              IMG
                            </div>
                          )}
                          <div>
                            <span className="text-foreground font-bold text-sm block">{product.name}</span>
                            {product.description && <span className="text-xs text-muted-foreground line-clamp-1">{product.description}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          isCake ? 'bg-[#0A2E1D] text-[#EAA823]' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isCake && <Cake className="w-3 h-3" />}
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-foreground font-extrabold text-sm">
                        ₦{Number(product.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        {isCake ? (
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <span className="font-semibold text-[#0A2E1D] block">1, 2 & 3 Layers Configured</span>
                            <span className="text-[11px] text-gray-400">Vanilla, Chocolate, Red Velvet</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Standard Product</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="text-[#0A2E1D] hover:bg-[#0A2E1D]/10 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}