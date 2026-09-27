'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StorefrontHeader } from '@/components/storefront/header'
import { createClient } from '@/lib/supabase/client'
import { 
  GraduationCap, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  Send,
  User,
  Mail,
  Phone,
  BookMarked,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const TRAINING_COURSES = [
  'Professional Cake Artistry & Tiered Bakes',
  'Fast Delights & Gourmet Street Kitchen',
  'Natural Juicing & Herbal Spiced Beverages',
  'Catering & Culinary Fundamentals',
]

export default function TrainingRegistrationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [course, setCourse] = useState(TRAINING_COURSES[0])
  const [trainingDate, setTrainingDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      // 1. Insert into training_students table
      const { data, error } = await supabase
        .from('training_students')
        .insert({
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          course: course.trim(),
          training_date: trainingDate || null,
          certificate_issued: false,
        })
        .select()
        .single()

      if (error) throw error

      // 2. Dispatch telegram notification alert for new training student registration
      try {
        await fetch('/api/messages/send-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🎓 NEW TRAINING ACADEMY REGISTRATION',
            message: `Student: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nCourse: ${course}\nDate: ${trainingDate || 'Not specified'}`,
          }),
        }).catch(() => {})
      } catch (_) {}

      setSuccess(true)
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorMessage(err.message || 'Failed to submit registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16 selection:bg-[#EAA823] selection:text-[#072d1d]">
      <StorefrontHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="mb-6">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#072d1d] transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Training Academy</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#072d1d] text-[#EAA823] rounded-2xl shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#EAA823]">Cohort Admission</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#072d1d]">Student Course Registration</h1>
            </div>
          </div>
        </div>

        {success ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-500/30 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#072d1d]">Registration Successful!</h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Congratulations <strong>{fullName}</strong>! Your application for <strong>{course}</strong> has been received and saved. Our academy coordinator will reach out to you via email and phone with your schedule and onboarding details.
              </p>
            </div>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link href="/training">
                <Button className="bg-[#072d1d] text-white hover:bg-black text-xs font-bold px-6 py-3 rounded-xl">
                  Return to Academy
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold px-6 py-3 rounded-xl">
                  Back to Storefront
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xl">
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#EAA823]" />
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full legal name"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#072d1d] outline-none focus:border-[#072d1d] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#EAA823]" />
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#072d1d] outline-none focus:border-[#072d1d] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#EAA823]" />
                    Phone Number / WhatsApp *
                  </label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#072d1d] outline-none focus:border-[#072d1d] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <BookMarked className="w-3.5 h-3.5 text-[#EAA823]" />
                  Select Training Course / Program *
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#072d1d] outline-none focus:border-[#072d1d] focus:bg-white transition"
                >
                  {TRAINING_COURSES.map((c, idx) => (
                    <option key={idx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#EAA823]" />
                  Preferred Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#072d1d] outline-none focus:border-[#072d1d] focus:bg-white transition"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#072d1d] hover:bg-black text-[#EAA823] font-black text-xs sm:text-sm py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#EAA823]" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Course Registration</span>
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-stone-500 text-center pt-2">
                By submitting this form, you agree to abide by De-echoi Training Academy safety guidelines and code of practice.
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}