'use client'

import { useState } from 'react'
import { 
  X, 
  Upload, 
  Loader2, 
  ScanLine, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentRequestModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  inquiryId: string
  onConfirm: (reference: string, file: File) => Promise<void>
}

export function PaymentRequestModal({
  isOpen,
  onClose,
  amount,
  inquiryId,
  onConfirm,
}: PaymentRequestModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifiedReference, setVerifiedReference] = useState<string | null>(null)

  const BANK_DETAILS = {
    accountName: 'De-echoi Limited',
    accountNumber: '1312120060',
    bankName: 'Zenith Bank',
  }

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(selected.type)) {
      setError('Please upload a PDF or JPG/PNG image receipt.')
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      return
    }

    setFile(selected)
    setError(null)
    setVerifiedReference(null)

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(selected)
    } else {
      setPreview(null)
    }
  }

  const handleVerifyAndSubmit = async () => {
    if (!file) {
      setError('Please upload your payment transfer receipt.')
      return
    }

    setScanning(true)
    setError(null)

    try {
      // 1. Backend OCR validation check
      // - Checks amount match
      // - Checks transaction reference presence & uniqueness ("This receipt has already been used.")
      // - Date & time are optional and recorded passively for database reference only (not a prerequisite for validation)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('expectedAmount', amount.toString())
      formData.append('expectedAccount', BANK_DETAILS.accountNumber)
      formData.append('inquiryId', inquiryId)

      const res = await fetch('/api/validate-receipt', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()

      if (!res.ok || !json.valid) {
        const errorMessage = json.message || 'Receipt validation failed. Please check the uploaded file.'
        setError(errorMessage)
        setScanning(false)
        return
      }

      setVerifiedReference(json.reference || 'VERIFIED')
      setScanning(false)

      // 2. Submit verified proof and lock transaction reference
      setSubmitting(true)
      await onConfirm(json.reference || 'VERIFIED', file)
      setSubmitting(false)
      onClose()
    } catch (err: any) {
      console.error(err)
      setError('An error occurred while verifying the receipt. Please try again.')
      setScanning(false)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-[#0A2E1D] space-y-4 relative border border-gray-100">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
            Official Transfer Portal
          </span>
          <h3 className="font-black text-lg text-[#0A2E1D] mt-1">
            Complete Your Payment
          </h3>
          <p className="text-xs text-gray-500">
            Amount Requested: <strong className="text-emerald-700 text-sm font-black">₦{amount.toLocaleString()}</strong>
          </p>
        </div>

        {/* Bank Details Card */}
        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-gray-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#0A2E1D]">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Company Account Details</span>
          </div>
          <div className="space-y-1 text-gray-600 text-[11px] pt-1 border-t border-gray-200">
            <div className="flex justify-between">
              <span>Account Name:</span>
              <strong className="text-[#0A2E1D]">{BANK_DETAILS.accountName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Account Number:</span>
              <strong className="text-[#0A2E1D] font-mono text-xs">{BANK_DETAILS.accountNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span>Bank Name:</span>
              <strong className="text-[#0A2E1D]">{BANK_DETAILS.bankName}</strong>
            </div>
          </div>
        </div>

        {/* Receipt Upload Area */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
            Upload Transfer Receipt (Proof)
          </label>

          {preview ? (
            <div className="relative inline-block w-full">
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-40 rounded-xl object-contain mx-auto border border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  setError(null)
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : file ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <span className="truncate font-semibold">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setError(null)
                }}
                className="text-red-500 font-bold ml-2 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-gray-300 hover:border-[#0A2E1D] rounded-2xl p-5 text-center block cursor-pointer bg-[#FDFBF7] transition">
              <Upload className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-[#0A2E1D] block">Tap to select receipt</span>
              <span className="text-[10px] text-gray-400">PDF, JPG, or PNG (Max 10MB)</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Verified Status */}
        {verifiedReference && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Receipt verified: Ref #{verifiedReference}</span>
          </div>
        )}

        <Button
          onClick={handleVerifyAndSubmit}
          disabled={scanning || submitting || !file}
          className="w-full bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-extrabold py-5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          {scanning ? (
            <>
              <ScanLine className="w-4 h-4 animate-pulse text-[#EAA823]" />
              <span>Scanning amount &amp; reference...</span>
            </>
          ) : submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting payment proof...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-[#EAA823]" />
              <span>Verify &amp; Complete Payment</span>
            </>
          )}
        </Button>

      </div>
    </div>
  )
}