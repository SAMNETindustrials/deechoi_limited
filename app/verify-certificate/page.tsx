'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, GraduationCap, Loader2, Search, ShieldCheck, XCircle } from 'lucide-react'

interface VerificationResult {
  valid: boolean
  full_name?: string
  course?: string
  completion_date?: string | null
  certificate_serial?: string
  issued_at?: string | null
}

function VerifyCertificateContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [serial, setSerial] = useState(searchParams.get('serial') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const verify = async (value: string) => {
    const cleanSerial = value.trim().toUpperCase()
    if (!cleanSerial) {
      setResult(null)
      return
    }

    setLoading(true)
    setResult(null)

    const { data, error } = await supabase.rpc('verify_training_certificate', {
      certificate_serial_input: cleanSerial,
    })

    setLoading(false)

    if (error || !data || data.length === 0) {
      setResult({ valid: false })
      return
    }

    setResult({ valid: true, ...data[0] })
  }

  useEffect(() => {
    const serialFromUrl = searchParams.get('serial')
    if (serialFromUrl) {
      setSerial(serialFromUrl.toUpperCase())
      verify(serialFromUrl)
    }
  }, [searchParams])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    verify(serial)
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#071d13] via-[#0A2E1D] to-[#06130d] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-[#EAA823]/10 border border-[#EAA823]/20 text-[#EAA823]">
            <GraduationCap className="w-9 h-9" />
          </div>
          <p className="mt-5 text-[11px] uppercase tracking-[0.35em] font-black text-[#EAA823]">DE-ECHOI LIMITED</p>
          <h1 className="text-3xl md:text-4xl font-black mt-2">Certificate Verification</h1>
          <p className="text-sm text-emerald-100/60 mt-3 max-w-lg mx-auto">
            Confirm whether a De-echoi Limited training certificate is an original certificate issued by the company.
          </p>
        </div>

        <section className="rounded-3xl border border-[#EAA823]/20 bg-[#111a15]/90 backdrop-blur-xl p-5 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
              Certificate Serial Number
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4">
                <ShieldCheck className="w-4 h-4 text-[#EAA823] shrink-0" />
                <input
                  value={serial}
                  onChange={(event) => setSerial(event.target.value.toUpperCase())}
                  placeholder="DE-TRN-2026-XXXXXX"
                  className="w-full bg-transparent outline-none py-3.5 text-sm font-mono placeholder:text-gray-600"
                  autoComplete="off"
                />
              </div>
              <button
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EAA823] text-[#0A2E1D] px-6 py-3.5 text-xs font-black disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Checking...' : 'Verify Certificate'}
              </button>
            </div>
          </form>

          {result && (
            <div className={`mt-6 rounded-2xl border p-5 ${
              result.valid
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-red-500/30 bg-red-500/10'
            }`}>
              {result.valid ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-emerald-300">Certificate Verified</h2>
                      <p className="text-xs text-emerald-100/60 mt-1">
                        This certificate is recorded as an original certificate issued by De-echoi Limited.
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Student</p>
                      <p className="font-bold mt-1">{result.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Course</p>
                      <p className="font-bold mt-1">{result.course}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Completion Date</p>
                      <p className="font-bold mt-1">{formatDate(result.completion_date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Serial Number</p>
                      <p className="font-mono font-bold text-[#EAA823] mt-1">{result.certificate_serial}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg text-red-300">Certificate Not Found</h2>
                    <p className="text-xs text-red-100/60 mt-1">
                      No issued De-echoi Limited training certificate matches this serial number. Check the number and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-emerald-200/50 hover:text-[#EAA823] transition">
            Return to De-echoi website
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#071d13] via-[#0A2E1D] to-[#06130d] flex items-center justify-center text-[#EAA823]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <VerifyCertificateContent />
    </Suspense>
  )
}