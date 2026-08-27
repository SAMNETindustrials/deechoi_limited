'use client'

import { usePathname } from 'next/navigation'
import { CartProvider } from '@/lib/cart-context'
import { PWAInstallPrompt } from '@/components/storefront/pwa-install-prompt'
import { UnifiedFooter } from '@/components/storefront/unified-footer'
import { Analytics } from '@vercel/analytics/next'

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAgentDashboard = pathname?.startsWith('/agent')

  return (
    <CartProvider>
      <div className="flex-1">
        {children}
      </div>

      {!isAgentDashboard && (
        <>
          <UnifiedFooter />
          <PWAInstallPrompt />
        </>
      )}
      
      {process.env.NODE_ENV === 'production' && <Analytics />}
    </CartProvider>
  )
}