'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit2, Trash2, X, MapPin, Phone, Truck, Star, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Rider {
  id: string
  name: string
  phone: string
  email?: string
  vehicle_type?: string
  license_plate?: string
  status: 'available' | 'on_delivery' | 'offline'
  rating: number
  total_deliveries: number
  created_at: string
}

export default function RidersPage() {
  const router = useRouter()
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_type: '',
    license_plate: '',
    status: 'available' as const
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRiders()
  }, [])

  const fetchRiders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/riders')
      if (!response.ok) throw new Error('Failed to fetch riders')

      const data = await response.json()
      setRiders(data)
    } catch (error) {
      console.error('[v0] Error fetching riders:', error)
      alert('Failed to load riders')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicle_type: '',
      license_plate: '',
      status: 'available'
    })
    setEditingId(null)
  }

  const handleEdit = (rider: Rider) => {
    setFormData({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || '',
      vehicle_type: rider.vehicle_type || '',
      license_plate: rider.license_plate || '',
      status: rider.status
    })
    setEditingId(rider.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      if (editingId) {
        const response = await fetch(`/api/admin/riders/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) throw new Error('Failed to update rider')

        const updated = await response.json()
        setRiders(riders.map(r => r.id === editingId ? updated : r))
        alert('Rider updated successfully')
      } else {
        const response = await fetch('/api/admin/riders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) throw new Error('Failed to create rider')

        const newRider = await response.json()
        setRiders([...riders, newRider[0]])
        alert('Rider added successfully')
      }

      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error('[v0] Error submitting form:', error)
      alert('Failed to save rider')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rider?')) return

    try {
      const response = await fetch(`/api/admin/riders/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete rider')

      setRiders(riders.filter(r => r.id !== id))
      alert('Rider deleted successfully')
    } catch (error) {
      console.error('[v0] Error deleting rider:', error)
      alert('Failed to delete rider')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      on_delivery: 'bg-blue-100 text-blue-800',
      offline: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-8">Loading riders...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="h-10 w-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Riders Management</h1>
            <p className="text-muted-foreground mt-1">Manage delivery riders and their assignments</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rider
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {editingId ? 'Edit Rider' : 'Add New Rider'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rider name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                <Input
                  type="text"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="e.g., Motorcycle, Car"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">License Plate</label>
                <Input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  placeholder="License plate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="available">Available</option>
                  <option value="on_delivery">On Delivery</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving...' : editingId ? 'Update Rider' : 'Add Rider'}
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

      {/* Riders List */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">All Riders ({riders.length})</h3>

        {riders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No riders added yet. Click "Add Rider" to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riders.map((rider) => (
              <div key={rider.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{rider.name}</h4>
                    <p className="text-sm text-muted-foreground">{rider.phone}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rider.status)}`}>
                    {rider.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  {rider.email && (
                    <p className="text-muted-foreground">{rider.email}</p>
                  )}
                  {rider.vehicle_type && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="w-4 h-4" />
                      {rider.vehicle_type} {rider.license_plate && `(${rider.license_plate})`}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{rider.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {rider.total_deliveries} deliveries
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(rider)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(rider.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
