'use client'

import dynamic from 'next/dynamic'
import { useDevice } from '@/lib/hooks/use-device'

// Dynamically import mobile and desktop homepage components
const MobileHomePage = dynamic(() => import('./page-mobile').then(mod => ({ default: mod.default })), { ssr: false })
const DesktopHomePage = dynamic(() => import('./page-desktop').then(mod => ({ default: mod.default })), { ssr: false })

import { useState, useEffect } from 'react'

export default function HomePage() {
  const { isMobile, isLoaded } = useDevice()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return isMobile ? <MobileHomePage /> : <DesktopHomePage />
}
