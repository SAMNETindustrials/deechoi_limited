'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Lock,
  Mail,
  Hash,
} from 'lucide-react'

export function TransactionLogin({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.trim()

    if (!cleanEmail || !cleanCode) {
      alert(
        'Please fill in both your email address and transaction code.'
      )
      return
    }

    // Validate 5 digit numbers strictly (no alphabets)
    if (!/^\d{5}$/.test(cleanCode)) {
      alert('Transaction code must be exactly 5 digits (numbers only, no alphabets).')
      return
    }

    setLoading(true)

    try {
      // -------------------------------------------------------
      // 1. FIND CUSTOMER ACCOUNT BY EMAIL
      // -------------------------------------------------------

      const {
        data: account,
        error: accountError,
      } = await supabase
        .from('customer_accounts')
        .select(
          'id, customer_email, transaction_code'
        )
        .ilike(
          'customer_email',
          cleanEmail
        )
        .maybeSingle()

      if (accountError) {
        console.error(
          'Transaction account lookup error:',
          accountError
        )

        alert(
          'Unable to verify your account. Please try again.'
        )

        return
      }

      // -------------------------------------------------------
      // 2. ACCOUNT EXISTS
      // -------------------------------------------------------

      if (account) {
        if (
          account.transaction_code ===
          cleanCode
        ) {
          localStorage.setItem(
            'deechoi_customer_email',
            cleanEmail
          )

          localStorage.setItem(
            'deechoi_customer_session',
            JSON.stringify({
              email: cleanEmail,
            })
          )

          const storedOrders = JSON.parse(
            localStorage.getItem(
              'deechoi_customer_orders'
            ) || '[]'
          )

          localStorage.setItem(
            'deechoi_customer_orders',
            JSON.stringify(storedOrders)
          )

          onSuccess()

          return
        }

        alert(
          'Incorrect Transaction Code. Please check your code and try again.'
        )

        return
      }

      // -------------------------------------------------------
      // 3. NO ACCOUNT FOR EMAIL
      // -------------------------------------------------------

      const {
        data: existingCode,
        error: codeError,
      } = await supabase
        .from('customer_accounts')
        .select(
          'id, customer_email, transaction_code'
        )
        .eq(
          'transaction_code',
          cleanCode
        )
        .maybeSingle()

      if (codeError) {
        console.error(
          'Transaction code lookup error:',
          codeError
        )

        alert(
          'Unable to verify the transaction code. Please try again.'
        )

        return
      }

      if (existingCode) {
        alert(
          'This transaction code already belongs to another customer. Please use your registered email address or choose another code.'
        )

        return
      }

      // -------------------------------------------------------
      // 4. CREATE NEW CUSTOMER ACCOUNT
      // -------------------------------------------------------

      const {
        error: createError,
      } = await supabase
        .from('customer_accounts')
        .insert([
          {
            customer_email: cleanEmail,
            transaction_code: cleanCode,
          },
        ])

      if (createError) {
        console.error(
          'Customer account creation error:',
          createError
        )

        if (
          createError.code === '23505'
        ) {
          alert(
            'This email address or transaction code is already registered. Please try your existing login details.'
          )
        } else {
          alert(
            'Could not create your customer account. Please try again later.'
          )
        }

        return
      }

      // -------------------------------------------------------
      // 5. SAVE SESSION
      // -------------------------------------------------------

      localStorage.setItem(
        'deechoi_customer_email',
        cleanEmail
      )

      localStorage.setItem(
        'deechoi_customer_session',
        JSON.stringify({
          email: cleanEmail,
        })
      )

      window.dispatchEvent(
        new Event('storage')
      )

      onSuccess()

    } catch (err) {
      console.error(
        'Transaction login error:',
        err
      )

      alert(
        'An unexpected error occurred. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl border border-stone-200/80 shadow-md">

      {/* HEADER */}

      <div className="mb-6 text-center">

        <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Lock className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          Customer Access
        </h3>

        <p className="text-xs text-stone-500 mt-1">
          Enter your email address and 5-digit transaction
          code to view your dashboard.
        </p>

      </div>

      {/* FORM */}

      <form
        onSubmit={handleLogin}
        className="space-y-4"
      >

        {/* EMAIL */}

        <div>

          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
            Email Address
          </label>

          <div className="relative flex items-center">

            <Mail className="absolute left-3.5 w-4 h-4 text-stone-400" />

            <Input
              type="email"
              autoComplete="email"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="pl-10 text-xs sm:text-sm bg-stone-50/50 border-stone-200 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-xl"
            />

          </div>

        </div>

        {/* TRANSACTION CODE (5 Digits Only) */}

        <div>

          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
            Transaction Code (5 Digits)
          </label>

          <div className="relative flex items-center">

            <Hash className="absolute left-3.5 w-4 h-4 text-stone-400" />

            <Input
              type="password"
              inputMode="numeric"
              maxLength={5}
              autoComplete="current-password"
              placeholder="e.g. 12345"
              value={code}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 5)
                setCode(numericOnly)
              }}
              required
              className="pl-10 text-xs sm:text-sm bg-stone-50/50 border-stone-200 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-xl font-mono tracking-widest"
            />

          </div>
          <p className="text-[10px] text-stone-400 mt-1 pl-1">
            Must be exactly 5 numbers (no letters).
          </p>

        </div>

        {/* SUBMIT */}

        <Button
          type="submit"
          className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl transition shadow-sm cursor-pointer mt-2"
          disabled={loading}
        >

          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            'Access Dashboard'
          )}

        </Button>

      </form>
    </div>
  )
}