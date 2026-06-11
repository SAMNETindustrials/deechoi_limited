'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Edit2, Plus, X, Download } from 'lucide-react'
import Link from 'next/link'

interface StockItem {
  id: string
  name: string
  unit: string
  current_quantity: number
  unit_price: number
  reorder_level: number
  supplier: string
}

interface RestockInvoice {
  id: string
  invoice_number: string
  total_amount: number
  status: string
  created_at: string
}

export default function StockInventoryPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [invoices, setInvoices] = useState<RestockInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showStockForm, setShowStockForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stocks' | 'invoices'>('stocks')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    current_quantity: '',
    unit_price: '',
    reorder_level: '',
    supplier: '',
  })
  const [invoiceForm, setInvoiceForm] = useState({
    selectedItems: [] as string[],
    quantities: {} as Record<string, string>,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: stocks, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (stockError) throw stockError
      setStockItems(stocks || [])

      const { data: restokedInvoices, error: invoiceError } = await supabase
        .from('restock_invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoiceError) throw invoiceError
      setInvoices(restokedInvoices || [])
    } catch (error) {
      console.error('[v0] Failed to fetch data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      current_quantity: '',
      unit_price: '',
      reorder_level: '',
      supplier: '',
    })
    setEditingId(null)
  }

  const handleEditStock = (item: StockItem) => {
    setFormData({
      name: item.name,
      unit: item.unit,
      current_quantity: item.current_quantity.toString(),
      unit_price: item.unit_price.toString(),
      reorder_level: item.reorder_level.toString(),
      supplier: item.supplier,
    })
    setEditingId(item.id)
    setShowStockForm(true)
  }

  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.unit_price) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        name: formData.name,
        unit: formData.unit,
        current_quantity: parseFloat(formData.current_quantity) || 0,
        unit_price: parseFloat(formData.unit_price),
        reorder_level: parseFloat(formData.reorder_level) || 0,
        supplier: formData.supplier,
      }

      if (editingId) {
        const { error } = await supabase
          .from('stock_items')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
        alert('Stock item updated successfully')
      } else {
        const { error } = await supabase
          .from('stock_items')
          .insert([payload])

        if (error) throw error
        alert('Stock item added successfully')
      }

      resetForm()
      setShowStockForm(false)
      fetchData()
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Failed to save stock item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStock = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return

    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      alert('Stock item deleted successfully')
      fetchData()
    } catch (error) {
      console.error('[v0] Delete error:', error)
      alert('Failed to delete stock item')
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedItemsWithQty = invoiceForm.selectedItems.filter(
      (itemId) => invoiceForm.quantities[itemId]
    )

    if (selectedItemsWithQty.length === 0) {
      alert('Please select at least one item with quantity')
      return
    }

    try {
      setSubmitting(true)

      // Calculate total
      let total = 0
      const items = selectedItemsWithQty.map((itemId) => {
        const stockItem = stockItems.find((s) => s.id === itemId)
        const qty = parseFloat(invoiceForm.quantities[itemId])
        const subtotal = stockItem ? qty * stockItem.unit_price : 0
        total += subtotal
        return {
          stock_item_id: itemId,
          quantity: qty,
          unit_price: stockItem?.unit_price || 0,
        }
      })

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}`
      const { data: invoice, error: invoiceError } = await supabase
        .from('restock_invoices')
        .insert({
          invoice_number: invoiceNumber,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        ...item,
      }))

      const { error: itemsError } = await supabase
        .from('restock_invoice_items')
        .insert(invoiceItems)

      if (itemsError) throw itemsError

      alert('Invoice created successfully!')
      setInvoiceForm({ selectedItems: [], quantities: {} })
      setShowInvoiceForm(false)
      fetchData()
    } catch (error) {
      console.error('[v0] Invoice error:', error)
      alert('Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintInvoice = (invoice: RestockInvoice) => {
    const printWindow = window.open('', '', 'height=600,width=800')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoice_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f5f5f5; }
              .total { text-align: right; font-weight: bold; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>DEECHOI LIMITED</h1>
              <h2>Restock Invoice</h2>
            </div>
            <div class="invoice-info">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoice.status}</p>
            </div>
            <p style="text-align: center; margin: 30px 0; font-size: 16px;">
              <strong>Total Amount: ₦${invoice.total_amount.toFixed(2)}</strong>
            </p>
            <p style="margin-top: 50px; font-size: 12px; color: #666;">
              Please present this invoice to the supplier for stock purchase.
            </p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary text-secondary-foreground p-6 border-b border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Stock Inventory</h1>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="text-secondary-foreground border-secondary-foreground hover:bg-secondary-foreground/10">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'stocks'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Stock Items
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'invoices'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Restock Invoices
          </button>
        </div>

        {/* Stock Items Tab */}
        {activeTab === 'stocks' && (
          <>
            <div className="mb-6">
              <Button
                onClick={() => {
                  resetForm()
                  setShowStockForm(!showStockForm)
                }}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Stock Item
              </Button>
            </div>

            {showStockForm && (
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    {editingId ? 'Edit Stock Item' : 'Add Stock Item'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowStockForm(false)
                      resetForm()
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitStock} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Item Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Fish"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Unit *
                      </label>
                      <Input
                        type="text"
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                        placeholder="e.g., kg, pcs, liters"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Current Quantity
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.current_quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            current_quantity: e.target.value,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Unit Price (₦) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unit_price: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Reorder Level
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.reorder_level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reorder_level: e.target.value,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Supplier
                      </label>
                      <Input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) =>
                          setFormData({ ...formData, supplier: e.target.value })
                        }
                        placeholder="Supplier name"
                      />
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
                        ? 'Update Item'
                        : 'Add Item'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowStockForm(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading stock items...
              </div>
            ) : stockItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">No stock items yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Current Qty
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-foreground font-medium">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {item.current_quantity.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-semibold">
                          ₦{item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.supplier}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStock(item)}
                              className="text-primary hover:bg-primary/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStock(item.id)}
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
          </>
        )}

        {/* Restock Invoices Tab */}
        {activeTab === 'invoices' && (
          <>
            <div className="mb-6">
              <Button
                onClick={() => {
                  setInvoiceForm({ selectedItems: [], quantities: {} })
                  setShowInvoiceForm(!showInvoiceForm)
                }}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Create Restock Invoice
              </Button>
            </div>

            {showInvoiceForm && stockItems.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Create Restock Invoice
                  </h2>
                  <button
                    onClick={() => {
                      setShowInvoiceForm(false)
                      setInvoiceForm({ selectedItems: [], quantities: {} })
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  {stockItems.map((item) => (
                    <div key={item.id} className="border border-border rounded p-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={invoiceForm.selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInvoiceForm({
                                ...invoiceForm,
                                selectedItems: [
                                  ...invoiceForm.selectedItems,
                                  item.id,
                                ],
                              })
                            } else {
                              setInvoiceForm({
                                ...invoiceForm,
                                selectedItems: invoiceForm.selectedItems.filter(
                                  (id) => id !== item.id
                                ),
                              })
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {item.name} ({item.unit})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Unit Price: ₦{item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        {invoiceForm.selectedItems.includes(item.id) && (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Qty"
                            className="w-24"
                            value={invoiceForm.quantities[item.id] || ''}
                            onChange={(e) =>
                              setInvoiceForm({
                                ...invoiceForm,
                                quantities: {
                                  ...invoiceForm.quantities,
                                  [item.id]: e.target.value,
                                },
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {submitting ? 'Creating...' : 'Create Invoice'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowInvoiceForm(false)
                        setInvoiceForm({ selectedItems: [], quantities: {} })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-card border border-border rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {invoice.invoice_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ₦{invoice.total_amount.toFixed(2)}
                        </p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintInvoice(invoice)}
                      className="mt-4 gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Print Invoice
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
