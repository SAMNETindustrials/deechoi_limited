'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, X, CheckCircle2, Smartphone, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true) // default to true until client check
  const [showModal, setShowModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // 1. Check if user already dismissed or installed the prompt
    const userDismissed = localStorage.getItem('deechoi_pwa_dismissed') === 'true'
    const alreadyInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem('deechoi_pwa_installed') === 'true'

    if (alreadyInstalled) {
      setIsInstalled(true)
      return
    }

    if (!userDismissed) {
      setIsDismissed(false)
    }

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // 3. Listen for install prompt on Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setShowModal(false)
      localStorage.setItem('deechoi_pwa_installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  // Dismiss and persist to localStorage so it stays removed
  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setIsDismissed(true)
    setShowModal(false)
    localStorage.setItem('deechoi_pwa_dismissed', 'true')
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        localStorage.setItem('deechoi_pwa_installed', 'true')
        setShowModal(false)
      }
      setDeferredPrompt(null)
    }
  }

  if (isInstalled || isDismissed) return null

  return (
    <>
      {/* Mini Floating Badge (Bottom-Left with Quick-Close Button) */}
      <div className="fixed left-3.5 bottom-20 md:bottom-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center bg-[#072d1d] text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[#EAA823]/60 pl-1.5 pr-2 py-1.5 gap-2">
          {/* Main Clickable Trigger Area */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
            aria-label="Open App Install Prompt"
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white p-0.5 flex-shrink-0 shadow-inner">
              <Image src="/logo.png" alt="De-echoi" fill className="object-contain" />
            </div>
            <span className="text-xs font-black text-[#EAA823]">Install App</span>
            <Download className="w-3.5 h-3.5 text-[#EAA823]" />
          </button>

          {/* Direct Close Button on Floating Badge */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
            title="Dismiss install prompt"
            aria-label="Dismiss install prompt"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-[#0A2E1D] space-y-4 relative border border-gray-100">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-[#072d1d] p-1.5 overflow-hidden shadow-md">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#072d1d]">Install De-echoi App</h3>
                <p className="text-xs text-gray-500">Quick ordering &amp; live kitchen updates</p>
              </div>
            </div>

            {isIOS ? (
              <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-2">
                <p className="font-bold text-[#0A2E1D] flex items-center gap-1.5">
                  <Share className="w-4 h-4 text-amber-600" /> How to install on iPhone/iPad:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600">
                  <li>Tap the <strong>Share button</strong> at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-gray-600 bg-[#FDFBF7] p-3.5 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant access without app store downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Faster order checkout &amp; live order tracking</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleDismiss}
                className="flex-1 text-xs py-5 rounded-xl border-gray-200 hover:bg-gray-100 text-gray-700 font-bold cursor-pointer"
              >
                Not Now
              </Button>
              {!isIOS && (
                <Button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 bg-[#072d1d] hover:bg-[#EAA823] hover:text-[#072d1d] text-white font-black py-5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Smartphone className="w-4 h-4 text-[#EAA823]" />
                  <span>Install Now</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}