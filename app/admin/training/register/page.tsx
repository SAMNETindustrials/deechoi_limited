'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, User, Mail, Phone, BookOpen, Calendar, ShieldCheck } from 'lucide-react'

const COURSES = [
  'Professional Cake Artistry & Tiered Bakes',
  'Fast Delights & Gourmet Street Kitchen',
  'Natural Juicing & Herbal Spiced Beverages'
]

export default function StudentRegistrationPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    course: COURSES[0],
    schedule: 'Weekend Track (Saturdays Only)',
    experienceLevel: 'Beginner',
    agreeTerms: false
  })
  const [completed, setCompleted] = useState(false)

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 4) setStep(step + 1)
    else setCompleted(true)
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-20">
      <StorefrontHeader />

      <main className="max-w-3xl mx-auto px-4 pt-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/training" className="inline-flex items-center gap-2 text-xs font-bold text-[#072d1d] hover:text-[#EAA823] transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Training Academy
          </Link>
          <span className="text-xs font-bold text-stone-500">Step {step} of 4</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#EAA823] h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl space-y-6">
          {completed ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#072d1d]">Registration Successful!</h1>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Congratulations <strong>{formData.fullName}</strong>! Your application for <strong>{formData.course}</strong> has been submitted to De-echoi Training Academy. Our admissions desk will review your details and contact you via WhatsApp shortly.
              </p>
              <div className="pt-4">
                <Link href="/training">
                  <Button className="bg-[#072d1d] text-white font-bold text-xs px-6 py-3 rounded-xl">
                    Return to Training Academy
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNext} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#072d1d]">1. Personal Information</h2>
                    <p className="text-xs text-stone-500">Provide your contact credentials for cohort admission.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">Full Name *</label>
                      <Input
                        required
                        placeholder="e.g. Joy Okafor"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="text-xs py-2.5 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">Email Address *</label>
                      <Input
                        type="email"
                        required
                        placeholder="e.g. joy@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="text-xs py-2.5 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">Phone Number (WhatsApp) *</label>
                      <Input
                        type="tel"
                        required
                        placeholder="e.g. 08012345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="text-xs py-2.5 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#072d1d]">2. Select Training Track</h2>
                    <p className="text-xs text-stone-500">Choose the professional culinary or baking course you wish to master.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {COURSES.map((c) => (
                      <label
                        key={c}
                        onClick={() => setFormData({ ...formData, course: c })}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                          formData.course === c ? 'border-[#EAA823] bg-amber-50/50 shadow-sm' : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-xs font-bold text-[#072d1d]">{c}</span>
                        <input
                          type="radio"
                          name="courseSelection"
                          checked={formData.course === c}
                          onChange={() => setFormData({ ...formData, course: c })}
                          className="accent-[#072d1d]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#072d1d]">3. Schedule &amp; Experience</h2>
                    <p className="text-xs text-stone-500">Select your preferred attendance timetable.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">Preferred Schedule</label>
                      <select
                        value={formData.schedule}
                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                        className="w-full bg-white border border-stone-300 text-xs p-3 rounded-xl text-stone-800 outline-none"
                      >
                        <option value="Weekday Intensive">Weekday Intensive (Mon &ndash; Wed)</option>
                        <option value="Weekend Track">Weekend Track (Saturdays Only)</option>
                        <option value="Private Coaching">Private 1-on-1 Coaching</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-800">Current Culinary Experience Level</label>
                      <select
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                        className="w-full bg-white border border-stone-300 text-xs p-3 rounded-xl text-stone-800 outline-none"
                      >
                        <option value="Beginner">Absolute Beginner (No prior experience)</option>
                        <option value="Intermediate">Intermediate Home Baker / Cook</option>
                        <option value="Professional">Commercial / Professional transitioning</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#072d1d]">4. Review &amp; Submit</h2>
                    <p className="text-xs text-stone-500">Confirm your registration details below.</p>
                  </div>

                  <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">Full Name:</span>
                      <span className="font-bold text-[#072d1d]">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">Email:</span>
                      <span className="font-bold text-[#072d1d]">{formData.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">WhatsApp Phone:</span>
                      <span className="font-bold text-[#072d1d]">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-200">
                      <span className="text-stone-500">Selected Course:</span>
                      <span className="font-bold text-[#072d1d]">{formData.course}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Schedule:</span>
                      <span className="font-bold text-[#072d1d]">{formData.schedule}</span>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.agreeTerms}
                      onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                      className="accent-[#072d1d] mt-0.5"
                    />
                    <span className="text-[11px] text-stone-600 leading-tight">
                      I agree to abide by De-echoi Training Academy hygiene and attendance policies, and commit to completing the practical requirements.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                {step > 1 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="bg-stone-200 text-stone-800 text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-stone-300 transition"
                  >
                    Back
                  </Button>
                ) : <div />}

                <Button
                  type="submit"
                  className="bg-[#072d1d] hover:bg-[#EAA823] text-white hover:text-[#072d1d] font-black text-xs px-6 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                >
                  <span>{step === 4 ? 'Confirm & Register' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}