'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.user) {
        // Verify user is an admin
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('role, status')
          .eq('id', data.user.id)
          .single()

        if (adminError || !adminUser) {
          await supabase.auth.signOut()
          setError('Access denied. You are not an authorized administrator.')
          return
        }

        if (adminUser.status === 'inactive') {
          await supabase.auth.signOut()
          setError('Your admin account is inactive. Contact the super admin.')
          return
        }

        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
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
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">DEECHOI LIMITED</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="admin@deechoi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>Admin access only. Authorized personnel only.</p>
        </div>
      </Card>
    </div>
  )
}
