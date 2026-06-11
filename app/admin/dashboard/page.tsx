'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Package, BarChart3, LogOut } from 'lucide-react'

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/admin/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user?.email?.split('@')[0]}
          </h2>
          <p className="text-muted-foreground">
            Manage your storefront and inventory from here
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store Inventory Card */}
          <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary">
            <Button
              onClick={() => router.push('/admin/store-inventory')}
              variant="ghost"
              className="w-full h-auto flex flex-col items-start gap-4 p-0"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-foreground">
                  Store Inventory
                </h3>
                <p className="text-muted-foreground mt-2">
                  Manage products, set availability, and update stock status for your storefront
                </p>
              </div>
            </Button>
          </Card>

          {/* Stock Inventory Card */}
          <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary">
            <Button
              onClick={() => router.push('/admin/stock-inventory')}
              variant="ghost"
              className="w-full h-auto flex flex-col items-start gap-4 p-0"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-foreground">
                  Stock Inventory
                </h3>
                <p className="text-muted-foreground mt-2">
                  Manage raw materials, prices, restock levels, and print purchase invoices
                </p>
              </div>
            </Button>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-primary/5">
            <div className="text-sm text-muted-foreground">Total Products</div>
            <div className="text-3xl font-bold text-foreground mt-2">-</div>
          </Card>
          <Card className="p-6 bg-accent/5">
            <div className="text-sm text-muted-foreground">Stock Items</div>
            <div className="text-3xl font-bold text-foreground mt-2">-</div>
          </Card>
          <Card className="p-6 bg-secondary/10">
            <div className="text-sm text-muted-foreground">Recent Orders</div>
            <div className="text-3xl font-bold text-foreground mt-2">-</div>
          </Card>
        </div>
      </main>
    </div>
  )
}
