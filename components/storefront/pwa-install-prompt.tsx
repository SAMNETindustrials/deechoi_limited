'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, X, Sparkles, CheckCircle2, Smartphone, ShieldCheck, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // 1. Detect if running standalone (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem('deechoi_pwa_installed') === 'true'

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // 2. Detect iOS
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

  if (isInstalled) return null

  return (
    <>
      {/* Mini Floating Badge (Bottom-Left) */}
      <div className="fixed left-4 bottom-6 z-50">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#072d1d] text-white px-3.5 py-2.5 rounded-full shadow-2xl border-2 border-[#EAA823] active:scale-95 transition"
        >
          <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white p-0.5">
            <Image src="/logo.png" alt="De-echoi" fill className="object-contain" />
          </div>
          <span className="text-xs font-bold text-amber-400">Install App</span>
          <Download className="w-3.5 h-3.5 text-[#EAA823]" />
        </button>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-[#0A2E1D] space-y-4 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-[#072d1d] p-1 overflow-hidden">
                <Image src="/logo.png" alt="Logo" fill className="object-contain p-1" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Install De-echoi App</h3>
                <p className="text-xs text-gray-500">Fast access from your home screen</p>
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
                  <li>Tap <strong>Add</strong> in the top right corner.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-gray-600 bg-[#FDFBF7] p-3.5 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant access without app store downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Faster ordering & live tracking</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 text-xs py-5 rounded-xl border-gray-200"
              >
                Close
              </Button>
              {!isIOS && (
                <Button
                  onClick={handleInstallClick}
                  className="flex-1 bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold py-5 rounded-xl text-xs"
                >
                  <Smartphone className="w-4 h-4 text-[#EAA823]" />
                  Install Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}