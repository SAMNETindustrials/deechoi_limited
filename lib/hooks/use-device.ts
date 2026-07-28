'use client'

import { useState, useEffect } from 'react'

export function useDevice() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const width = window.innerWidth

      // Check if mobile based on screen width and user agent
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || width < 768
      const tablet = /ipad|android/i.test(userAgent) || (width >= 768 && width < 1024)
      const desktop = width >= 1024

      setIsMobile(mobile && width < 768)
      setIsTablet(tablet)
      setIsDesktop(desktop)
      setIsLoaded(true)
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    return () => window.removeEventListener('resize', detectDevice)
  }, [])

  return { isMobile, isTablet, isDesktop, isLoaded }
}
