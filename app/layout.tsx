import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import { PWAInstallPrompt } from '@/components/storefront/pwa-install-prompt'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: '#072d1d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'DEECHOI LIMITED - Premium Cooked Meals & Snacks',
  description: 'Order authentic cooked meals and snacks from DEECHOI LIMITED. Fresh, delicious food delivered to your doorstep.',
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
      <body className="font-sans antialiased">
        <CartProvider>
          {children}
          {/* PWA Floating Mini-Icon & Popup Modal */}
          <PWAInstallPrompt />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </CartProvider>
      </body>
    </html>
  )
}