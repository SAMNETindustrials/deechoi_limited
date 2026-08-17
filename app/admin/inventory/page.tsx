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
  Download, 
  ChevronLeft, 
  AlertTriangle, 
  FileText, 
  Printer, 
  ShoppingCart, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Package
} from 'lucide-react'
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

interface InvoiceItemRecord {
  id?: string
  stock_item_id: string
  item_name?: string
  unit?: string
  supplier?: string
  quantity: number
  unit_price: number
}

interface RestockInvoice {
  id: string
  invoice_number: string
  total_amount: number
  status: string
  notes?: string
  created_at: string
  items?: InvoiceItemRecord[]
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

  // Stock Form State
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    current_quantity: '',
    unit_price: '',
    reorder_level: '',
    supplier: '',
  })

  // Market Restock Invoice Builder State
  const [invoiceForm, setInvoiceForm] = useState({
    selectedItems: [] as string[],
    quantities: {} as Record<string, string>,
    notes: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 1. Fetch live stock items
      const { data: stocks, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .order('name', { ascending: true })

      if (stockError) throw stockError
      setStockItems(stocks || [])

      // 2. Fetch restock invoices
      const { data: restockedInvoices, error: invoiceError } = await supabase
        .from('restock_invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoiceError) throw invoiceError
      setInvoices(restockedInvoices || [])
    } catch (error) {
      console.error('Failed to fetch stock data:', error)
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
      name: item.name || '',
      unit: item.unit || '',
      current_quantity: (item.current_quantity ?? 0).toString(),
      unit_price: (item.unit_price ?? 0).toString(),
      reorder_level: (item.reorder_level ?? 0).toString(),
      supplier: item.supplier || '',
    })
    setEditingId(item.id)
    setShowStockForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.unit_price) {
      alert('Please fill in all required fields (Item Name and Unit Price)')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        name: formData.name.trim(),
        unit: formData.unit.trim() || 'pcs',
        current_quantity: parseFloat(formData.current_quantity) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        reorder_level: parseFloat(formData.reorder_level) || 0,
        supplier: formData.supplier.trim(),
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
    } catch (error: any) {
      console.error('Error saving stock item:', error)
      alert(error.message || 'Failed to save stock item')
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
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(error.message || 'Failed to delete stock item')
    }
  }

  // Quick Action: Auto-select low-stock items into Restock Invoice
  const handleAutoSelectLowStock = () => {
    const lowStockItems = stockItems.filter(
      (item) => (item.current_quantity ?? 0) <= (item.reorder_level ?? 0)
    )

    if (lowStockItems.length === 0) {
      alert('All stock levels are currently sufficient! You can still manually select items to restock.')
      return
    }

    const selected = lowStockItems.map((item) => item.id)
    const initialQty: Record<string, string> = {}

    lowStockItems.forEach((item) => {
      // Suggest restocking up to 2x the reorder level or a minimum batch
      const deficit = Math.max(1, ((item.reorder_level * 2) - item.current_quantity))
      initialQty[item.id] = deficit.toString()
    })

    setInvoiceForm({
      selectedItems: selected,
      quantities: initialQty,
      notes: `Restock market run for ${lowStockItems.length} low-stock ingredient(s).`,
    })

    setActiveTab('invoices')
    setShowInvoiceForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const calculateInvoiceTotal = () => {
    let total = 0
    invoiceForm.selectedItems.forEach((id) => {
      const stockItem = stockItems.find((s) => s.id === id)
      const qty = parseFloat(invoiceForm.quantities[id]) || 0
      const price = stockItem?.unit_price ?? 0
      total += qty * price
    })
    return total
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedItemsWithQty = invoiceForm.selectedItems.filter((itemId) => {
      const rawQty = invoiceForm.quantities[itemId]
      const qty = parseFloat(rawQty)
      return !isNaN(qty) && qty > 0
    })

    if (selectedItemsWithQty.length === 0) {
      alert('Please select at least one item and enter a restock quantity greater than 0.')
      return
    }

    try {
      setSubmitting(true)

      let total = 0
      const itemsPayload = selectedItemsWithQty.map((itemId) => {
        const stockItem = stockItems.find((s) => s.id === itemId)
        const qty = parseFloat(invoiceForm.quantities[itemId]) || 0
        const unitPrice = stockItem?.unit_price ?? 0
        const subtotal = qty * unitPrice
        total += subtotal
        return {
          stock_item_id: itemId,
          item_name: stockItem?.name || 'Item',
          unit: stockItem?.unit || 'pcs',
          supplier: stockItem?.supplier || 'Local Market',
          quantity: qty,
          unit_price: unitPrice,
        }
      })

      const invoiceNumber = `RST-${Date.now().toString().slice(-6)}`
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('restock_invoices')
        .insert({
          invoice_number: invoiceNumber,
          total_amount: total,
          status: 'pending',
          notes: invoiceForm.notes || 'Market shopping restock purchase list',
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Save line items if table exists
      try {
        const invoiceItems = itemsPayload.map((item) => ({
          invoice_id: invoice.id,
          ...item,
        }))

        await supabase.from('restock_invoice_items').insert(invoiceItems)
      } catch (itemSaveErr) {
        console.warn('Optional line items table skipped:', itemSaveErr)
      }

      alert(`Restock Invoice ${invoiceNumber} created successfully! Total: ₦${total.toLocaleString()}`)
      setInvoiceForm({ selectedItems: [], quantities: {}, notes: '' })
      setShowInvoiceForm(false)
      fetchData()
    } catch (error: any) {
      console.error('Invoice creation error:', error)
      alert(error.message || 'Failed to create restock invoice')
    } finally {
      setSubmitting(false)
    }
  }

  // Generate and Print Professional Market Invoice / Shopping Slip
  const handlePrintInvoice = async (invoice: RestockInvoice) => {
    // Try fetching detailed invoice items if stored
    let lineItems: any[] = []
    try {
      const { data: fetchedItems } = await supabase
        .from('restock_invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      if (fetchedItems && fetchedItems.length > 0) {
        lineItems = fetchedItems
      }
    } catch (e) {
      console.warn('No items subtable:', e)
    }

    const printWindow = window.open('', '', 'height=750,width=850')
    if (printWindow) {
      const rowsHtml = lineItems.length > 0
        ? lineItems.map((it, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${it.item_name || 'Item'}</strong></td>
              <td>${it.supplier || 'Local Market'}</td>
              <td style="text-align:center;">${it.quantity} ${it.unit || ''}</td>
              <td style="text-align:right;">₦${Number(it.unit_price || 0).toLocaleString()}</td>
              <td style="text-align:right;"><strong>₦${(Number(it.quantity || 1) * Number(it.unit_price || 0)).toLocaleString()}</strong></td>
            </tr>
          `).join('')
        : `<tr><td colspan="6" style="text-align:center; padding:15px;">General Restock Batch List</td></tr>`

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Restock Invoice - ${invoice.invoice_number}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #111; }
              .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0A2E1D; padding-bottom: 15px; margin-bottom: 20px; }
              .brand h1 { margin: 0; color: #0A2E1D; font-size: 24px; }
              .brand p { margin: 2px 0 0 0; color: #666; font-size: 12px; }
              .doc-title { text-align: right; }
              .doc-title h2 { margin: 0; color: #EAA823; font-size: 20px; text-transform: uppercase; }
              .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; background: #fafafa; padding: 12px; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
              th, td { border: 1px solid #e5e5e5; padding: 10px 12px; text-align: left; }
              th { background-color: #0A2E1D; color: #fff; font-size: 12px; text-transform: uppercase; }
              .total-box { text-align: right; margin-top: 20px; font-size: 16px; }
              .total-box span { font-size: 22px; font-weight: bold; color: #0A2E1D; }
              .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
              @media print {
                body { padding: 0; }
                .invoice-box { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              <div class="header">
                <div class="brand">
                  <h1>DEECHOI LIMITED</h1>
                  <p>Bakery, Kitchen & Event Catering Operations</p>
                  <p>Eze Nvuigwe Avenue, Woji, Port Harcourt</p>
                </div>
                <div class="doc-title">
                  <h2>Market Restock Invoice</h2>
                  <p><strong>Ref:</strong> ${invoice.invoice_number}</p>
                </div>
              </div>

              <div class="meta-grid">
                <div>
                  <p><strong>Issued Date:</strong> ${new Date(invoice.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                  <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
                </div>
                <div style="text-align: right;">
                  <p><strong>Purpose:</strong> Market Restock & Procurement</p>
                  <p><strong>Authorized By:</strong> Inventory Manager</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>Item Description</th>
                    <th>Supplier / Market Vendor</th>
                    <th style="text-align:center;">Qty Needed</th>
                    <th style="text-align:right;">Unit Price</th>
                    <th style="text-align:right;">Estimated Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <div class="total-box">
                <p>Estimated Procurement Budget: <span>₦${Number(invoice.total_amount || 0).toLocaleString()}</span></p>
              </div>

              <div class="footer">
                <p>Generated via De-echoi Admin Inventory Portal &bull; Official Procurement Document</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const lowStockCount = stockItems.filter(
    (item) => (item.current_quantity ?? 0) <= (item.reorder_level ?? 0)
  ).length

  return (
    <div className="min-h-screen bg-[#0F1419] text-white">
      {/* Top Navigation Header */}
      <div className="bg-gradient-to-r from-[#1a1f2e] to-[#131821] text-white p-5 sm:p-6 border-b border-[#EAA823]/20 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-[#EAA823]/30 hover:bg-[#EAA823]/20 text-[#EAA823]"
                aria-label="Back to Admin Dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                <span>Stock & Inventory</span>
                {lowStockCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {lowStockCount} Low Stock
                  </span>
                )}
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                Track ingredients, manage stock levels, and generate market restock invoices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleAutoSelectLowStock}
              className="bg-[#12422C] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-amber-300 font-bold border border-[#EAA823]/40 text-xs rounded-xl gap-1.5 shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-[#EAA823]" />
              <span>Auto-Generate Market List</span>
            </Button>

            <Link href="/admin/dashboard">
              <Button 
                variant="outline"
                className="bg-[#EAA823]/10 text-[#EAA823] hover:bg-[#EAA823]/20 border border-[#EAA823]/30 text-xs font-bold rounded-xl gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#EAA823]/20 pb-3">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'stocks'
                ? 'bg-[#EAA823] text-[#0A2E1D] shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stock Inventory List ({stockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-[#EAA823] text-[#0A2E1D] shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Market Restock Invoices ({invoices.length})</span>
          </button>
        </div>

        {/* TAB 1: STOCKS INVENTORY */}
        {activeTab === 'stocks' && (
          <div className="space-y-6">
            
            {/* Header Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                onClick={() => {
                  resetForm()
                  setShowStockForm(!showStockForm)
                }}
                className="gap-2 bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-extrabold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-[#EAA823]/30"
              >
                <Plus className="w-4 h-4" />
                <span>{showStockForm ? 'Close Form' : 'Add Stock Item'}</span>
              </Button>

              {lowStockCount > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span><strong>{lowStockCount} items</strong> have reached or fallen below reorder levels.</span>
                </div>
              )}
            </div>

            {/* Add / Edit Form Modal Box */}
            {showStockForm && (
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] border border-[#EAA823]/30 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#EAA823]" />
                    <span>{editingId ? 'Edit Stock Item' : 'Add New Inventory Item'}</span>
                  </h2>
                  <button
                    onClick={() => {
                      setShowStockForm(false)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitStock} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Item Name *</label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Flour, Cheese, Butter, Beef, Packaging Boxes"
                        className="bg-[#0F1419] border-[#EAA823]/20 text-white rounded-xl text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Measurement Unit *</label>
                      <Input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="e.g., kg, bags, crates, pcs, liters"
                        className="bg-[#0F1419] border-[#EAA823]/20 text-white rounded-xl text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Current Stock Qty</label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.current_quantity}
                        onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
                        placeholder="0"
                        className="bg-[#0F1419] border-[#EAA823]/20 text-white rounded-xl text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Unit Market Price (₦) *</label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        placeholder="0.00"
                        className="bg-[#0F1419] border-[#EAA823]/20 text-white rounded-xl text-xs sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Reorder Alert Level</label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.reorder_level}
                        onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                        placeholder="0"
                        className="bg-[#0F1419] border-[#EAA823]/20 text-white rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Supplier / Market Vendor</label>
                    <Input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="e.g., Mile 1 Market Vendor, Oil Mill Wholesale Hub"
                      className="bg-[#0F1419] border-[#EAA823]/20 text-white rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-extrabold rounded-xl text-xs sm:text-sm py-5"
                    >
                      {submitting ? 'Saving Item...' : editingId ? 'Update Stock Item' : 'Add to Inventory'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowStockForm(false)
                        resetForm()
                      }}
                      className="border-[#EAA823]/30 text-gray-300 hover:text-white rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Inventory Table */}
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] border border-[#EAA823]/20 rounded-2xl overflow-hidden shadow-xl">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />
                  <p className="text-xs text-gray-400">Loading stock inventory...</p>
                </div>
              ) : stockItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-gray-500 opacity-40" />
                  <p className="text-sm font-bold">No inventory items recorded yet.</p>
                  <p className="text-xs text-gray-500">Click &quot;Add Stock Item&quot; to begin tracking kitchen supplies.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#EAA823]/5 border-b border-[#EAA823]/20">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Item Name</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Unit</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Current Qty</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Reorder Level</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Unit Market Price</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-300">Supplier</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAA823]/10">
                      {stockItems.map((item) => {
                        const isLow = (item.current_quantity ?? 0) <= (item.reorder_level ?? 0)

                        return (
                          <tr key={item.id} className={`hover:bg-[#EAA823]/5 transition-colors ${isLow ? 'bg-red-500/5' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{item.name}</span>
                                {isLow && (
                                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                    Low Stock
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-xs text-gray-400 font-semibold">{item.unit}</td>
                            
                            <td className="px-6 py-4">
                              <span className={`text-sm font-black ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                                {Number(item.current_quantity ?? 0).toLocaleString()}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-xs text-gray-400">
                              {Number(item.reorder_level ?? 0).toLocaleString()} {item.unit}
                            </td>

                            <td className="px-6 py-4 font-black text-sm text-[#EAA823]">
                              ₦{Number(item.unit_price ?? 0).toLocaleString()}
                            </td>

                            <td className="px-6 py-4 text-xs text-gray-300">
                              {item.supplier || 'Local Market'}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStock(item)}
                                  className="text-[#EAA823] hover:bg-[#EAA823]/10 p-2 h-auto rounded-lg"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStock(item.id)}
                                  className="text-red-400 hover:bg-red-500/10 p-2 h-auto rounded-lg"
                                  title="Delete Item"
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
        )}

        {/* TAB 2: MARKET RESTOCK INVOICES */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                onClick={() => {
                  setInvoiceForm({ selectedItems: [], quantities: {}, notes: '' })
                  setShowInvoiceForm(!showInvoiceForm)
                }}
                className="gap-2 bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-extrabold rounded-xl text-xs sm:text-sm shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create Restock Invoice</span>
              </Button>

              <p className="text-xs text-gray-400">
                Generate and print itemized market shopping invoices for procurement runs.
              </p>
            </div>

            {/* Create Invoice Builder Form */}
            {showInvoiceForm && stockItems.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] border border-[#EAA823]/30 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-200 space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#EAA823]" />
                      <span>Market Restock Shopping List Generator</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Select items and specify quantities needed for the market run.</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowInvoiceForm(false)
                      setInvoiceForm({ selectedItems: [], quantities: {}, notes: '' })
                    }}
                    className="text-gray-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">
                      Invoice Title / Procurement Notes
                    </label>
                    <Input
                      type="text"
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      placeholder="e.g., Weekly Bakery Ingredients Restock - Mile 1 Market"
                      className="bg-[#0F1419] border-[#EAA823]/20 text-white rounded-xl text-xs sm:text-sm mb-4"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                      Select Inventory Items to Restock:
                    </label>

                    {stockItems.map((item) => {
                      const isSelected = invoiceForm.selectedItems.includes(item.id)
                      const isLow = (item.current_quantity ?? 0) <= (item.reorder_level ?? 0)
                      const enteredQty = parseFloat(invoiceForm.quantities[item.id] || '0') || 0
                      const itemSubtotal = enteredQty * (item.unit_price || 0)

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#12422C]/60 border-[#EAA823]/60'
                              : 'bg-[#0F1419] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const defaultQty = isLow ? Math.max(1, (item.reorder_level * 2 - item.current_quantity)).toString() : '1'
                                  setInvoiceForm({
                                    ...invoiceForm,
                                    selectedItems: [...invoiceForm.selectedItems, item.id],
                                    quantities: { ...invoiceForm.quantities, [item.id]: defaultQty }
                                  })
                                } else {
                                  const updatedQty = { ...invoiceForm.quantities }
                                  delete updatedQty[item.id]
                                  setInvoiceForm({
                                    ...invoiceForm,
                                    selectedItems: invoiceForm.selectedItems.filter((id) => id !== item.id),
                                    quantities: updatedQty,
                                  })
                                }
                              }}
                              className="w-4 h-4 rounded text-[#EAA823] focus:ring-[#EAA823] cursor-pointer"
                            />
                            
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-white truncate">{item.name}</p>
                                {isLow && (
                                  <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                    Low
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                Current: {item.current_quantity} {item.unit} &bull; Price: ₦{Number(item.unit_price).toLocaleString()} / {item.unit}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-3 justify-end pt-2 sm:pt-0 border-t sm:border-0 border-white/10">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-300 font-semibold">Qty:</span>
                                <Input
                                  type="number"
                                  step="any"
                                  min="0.01"
                                  value={invoiceForm.quantities[item.id] || ''}
                                  onChange={(e) =>
                                    setInvoiceForm({
                                      ...invoiceForm,
                                      quantities: { ...invoiceForm.quantities, [item.id]: e.target.value },
                                    })
                                  }
                                  className="w-24 bg-[#1a1f2e] border-[#EAA823]/40 text-white text-xs h-8 rounded-lg"
                                  placeholder="Qty"
                                  required
                                />
                                <span className="text-xs text-gray-400">{item.unit}</span>
                              </div>

                              <span className="text-xs font-black text-[#EAA823] min-w-[90px] text-right">
                                ₦{itemSubtotal.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary Bar & Submit */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-gray-400 block">Total Restock Estimate:</span>
                      <span className="text-2xl font-black text-[#EAA823]">
                        ₦{calculateInvoiceTotal().toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowInvoiceForm(false)
                          setInvoiceForm({ selectedItems: [], quantities: {}, notes: '' })
                        }}
                        className="border-white/20 text-gray-300 hover:text-white rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || invoiceForm.selectedItems.length === 0}
                        className="bg-gradient-to-r from-[#EAA823] to-[#f5d547] text-[#0A2E1D] font-extrabold rounded-xl text-xs sm:text-sm px-6"
                      >
                        {submitting ? 'Generating...' : 'Save & Generate Invoice'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Existing Invoices List */}
            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#1a1f2e] to-[#131821] border border-[#EAA823]/20 rounded-2xl p-8 space-y-2">
                <FileText className="w-10 h-10 text-gray-500 mx-auto opacity-40" />
                <p className="text-sm font-bold text-gray-300">No restock invoices generated yet.</p>
                <p className="text-xs text-gray-500">Click &quot;Create Restock Invoice&quot; to build an itemized market list.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-gradient-to-br from-[#1a1f2e] to-[#131821] border border-[#EAA823]/20 rounded-2xl p-5 shadow-lg space-y-3 hover:border-[#EAA823]/40 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-sm text-[#EAA823]">
                          {invoice.invoice_number}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(invoice.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-white block">
                          ₦{Number(invoice.total_amount || 0).toLocaleString()}
                        </span>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {invoice.status}
                        </span>
                      </div>
                    </div>

                    {invoice.notes && (
                      <p className="text-xs text-gray-300 bg-[#0F1419] p-2.5 rounded-xl border border-white/5 line-clamp-2">
                        {invoice.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-white/10 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handlePrintInvoice(invoice)}
                        className="bg-[#12422C] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-[#EAA823] border border-[#EAA823]/40 rounded-xl text-xs font-bold gap-1.5 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Market Invoice</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}