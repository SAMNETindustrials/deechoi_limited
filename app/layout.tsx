import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import { PWAInstallPrompt } from '@/components/storefront/pwa-install-prompt'
import { UnifiedFooter } from '@/components/storefront/unified-footer'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const viewport: Viewport = {
  themeColor: '#072d1d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'DEECHOI LIMITED - Premium Cooked Meals, Snacks & Culinary Academy',
  description: 'Order authentic cooked meals, Shawarma, celebration cakes, and snacks from DEECHOI LIMITED. Fresh, delicious food delivered across Port Harcourt.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'De-echoi',
  },
  icons: {
    icon: [
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/logoicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col justify-between`}>
        <CartProvider>
          {/* Main Viewport Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Unified Desktop Footer + Animated Fluid Mobile Tab Bar with SAMNET Branding */}
          <UnifiedFooter />

          {/* PWA Floating Mini-Icon & Popup Modal */}
          <PWAInstallPrompt />
          
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </CartProvider>
      </body>
    </html>
  )
}