import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import ClientLayoutWrapper from '@/components/storefront/client-layout-wrapper'
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

// Global Alert Interceptor Script to completely eliminate "www.de-echoi.com says" popups site-wide & in the dashboard
function GlobalAlertScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined') {
            window.alert = function(message) {
              var existingBanner = document.getElementById('global-custom-alert-banner');
              if (existingBanner) existingBanner.remove();

              var banner = document.createElement('div');
              banner.id = 'global-custom-alert-banner';
              banner.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 999999; background-color: #0A2E1D; color: #ffffff; padding: 20px; border-radius: 20px; border: 2px solid #EAA823; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.7); font-family: inherit; max-width: 90vw; width: 380px; text-align: center; animation: fadeIn 0.2s ease-out;';
              
              banner.innerHTML = '<div style="font-weight: 900; color: #EAA823; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">De-echoi Notice</div>' +
                '<div style="font-size: 13px; line-height: 1.5; margin-bottom: 16px; color: #f3f4f6;">' + (message || '') + '</div>' +
                '<button id="global-alert-ok-btn" style="background-color: #EAA823; color: #0A2E1D; border: none; padding: 10px 24px; border-radius: 12px; font-weight: 900; font-size: 12px; cursor: pointer; width: 100%; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">OK, Understood</button>';

              document.body.appendChild(banner);

              var closeBtn = document.getElementById('global-alert-ok-btn');
              if (closeBtn) {
                closeBtn.onclick = function() {
                  banner.remove();
                };
              }

              // Auto dismiss after 7 seconds if not clicked
              setTimeout(function() {
                if (banner.parentElement) banner.remove();
              }, 7000);
            };
          }
        `,
      }}
    />
  )
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
        <GlobalAlertScript />
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}