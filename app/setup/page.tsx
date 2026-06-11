'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const createSuperAdmin = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/setup/create-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'deechoi01@gmail.com',
          password: 'Deechoi01',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create super admin')
        return
      }

      setMessage(`✓ Super admin created successfully! You can now log in with:
Email: deechoi01@gmail.com
Password: Deechoi01

Navigate to /admin/login to access the dashboard.`)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Deechoi_logo-ieNTB2nFIs4dcIMfx5166yv8Xr4RGL.png"
            alt="DEECHOI Logo"
            width={80}
            height={80}
            className="h-20 w-auto mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-foreground">System Setup</h1>
          <p className="text-muted-foreground mt-2">DEECHOI LIMITED</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Setup Instructions:</strong> Click the button below to create the default super admin account. This will set up the master administrator for the system.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 whitespace-pre-line">{message}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Super Admin Email
            </label>
            <input
              type="email"
              value="deechoi01@gmail.com"
              disabled
              className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Super Admin Password
            </label>
            <input
              type="password"
              value="Deechoi01"
              disabled
              className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            />
          </div>

          <Button
            onClick={createSuperAdmin}
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? 'Creating...' : 'Create Super Admin Account'}
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>This setup is one-time only. Keep the credentials secure.</p>
        </div>
      </Card>
    </div>
  )
}
