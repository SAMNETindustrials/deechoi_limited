'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { StorefrontHeader } from '@/components/storefront/header'
import { 
  GraduationCap, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  BookOpen, 
  ChefHat, 
  Layers, 
  Send, 
  Award, 
  Flame, 
  Utensils, 
  Cake, 
  Phone, 
  Mail, 
  ArrowRight,
  User,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const COURSES = [
  {
    id: 'master-baking',
    title: 'Professional Cake Artistry & Tiered Bakes',
    duration: '6 Weeks (Intensive)',
    level: 'Beginner to Advanced',
    badge: 'Flagship Program',
    icon: <Cake className="w-6 h-6 text-[#EAA823]" />,
    description: 'Learn sponge perfection, velvet crumb textures, multi-layer tiering, fondant draping, and velvet buttercream formulations.',
    highlights: [
      '6" & 7" tiered cake architectural stacking',
      'Buttercream sharp edges & silicone piping techniques',
      'Recipe science: Red Velvet, Chocolate Fudge & Sponge',
      'Bakery business pricing & inventory control'
    ]
  },
  {
    id: 'gourmet-fast-food',
    title: 'Fast Delights & Gourmet Street Kitchen',
    duration: '4 Weeks',
    level: 'All Levels',
    badge: 'High Demand',
    icon: <Flame className="w-6 h-6 text-[#EAA823]" />,
    description: 'Master commercial high-output street gourmet food preparation for quick-service restaurants and catering hubs.',
    highlights: [
      'Commercial spiced Jumbo Shawarma prep & wrap rolling',
      'Crisp golden Corndog batched frying',
      'Milky Doughnuts & Puff & Cream sweet fillings',
      'Kitchen safety, oil temperatures & food hygiene standards'
    ]
  },
  {
    id: 'beverage-infusion',
    title: 'Natural Juicing & Herbal Spiced Beverages',
    duration: '2 Weeks',
    level: 'Practical Workshop',
    badge: 'Popular Workshop',
    icon: <Utensils className="w-6 h-6 text-[#EAA823]" />,
    description: 'Create zero-preservative natural refreshments, cold-pressed fruit combinations, and infused Zobo drinks.',
    highlights: [
      'Hibiscus extraction & ginger heat balancing',
      'Cold-pressing fresh pineapple & citrus recipes',
      'Packaging, bottling, and shelf-life preservation',
      'Cost per bottle analysis & branding'
    ]
  }
]

export default function TrainingAcademyPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredCourse: 'Professional Cake Artistry & Tiered Bakes',
    sessionType: 'Weekend Session'
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.phone) return
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16 selection:bg-[#EAA823] selection:text-[#072d1d]">
      <StorefrontHeader />

      {/* HERO SECTION WITH COMING SOON BANNER */}
      <section className="relative overflow-hidden bg-[#072d1d] text-white pt-10 pb-16 lg:pb-24 border-b border-[#EAA823]/30">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[#EAA823] text-[#072d1d] font-black text-xs uppercase px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Cohorts Opening Soon</span>
            </span>
            <span className="bg-white/10 text-emerald-100 text-xs px-3 py-1.5 rounded-full border border-white/15">
              Woji, Port Harcourt &bull; Practical Hands-On
            </span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Master the Craft of <br />
              <span className="text-[#EAA823]">Professional Culinary</span> &amp; Baking.
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl leading-relaxed">
              Step inside the De-echoi Training Academy. Gain real kitchen experience, master commercial recipes, and acquire business skills to launch your own culinary enterprise.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 max-w-4xl">
            <div className="bg-[#041a11] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-[#EAA823]/20 text-[#EAA823] rounded-xl">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs sm:text-sm font-bold block text-white">100% Practical</strong>
                <span className="text-[10px] text-gray-400">Live kitchen station</span>
              </div>
            </div>

            <div className="bg-[#041a11] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-[#EAA823]/20 text-[#EAA823] rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs sm:text-sm font-bold block text-white">Certification</strong>
                <span className="text-[10px] text-gray-400">Accredited Diploma</span>
              </div>
            </div>

            <div className="bg-[#041a11] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-[#EAA823]/20 text-[#EAA823] rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs sm:text-sm font-bold block text-white">Safety Protocols</strong>
                <span className="text-[10px] text-gray-400">Hygienic standards</span>
              </div>
            </div>

            <div className="bg-[#041a11] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-[#EAA823]/20 text-[#EAA823] rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs sm:text-sm font-bold block text-white">Flexible Shifts</strong>
                <span className="text-[10px] text-gray-400">Weekday &amp; Weekend</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURRICULUM & COURSES */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-4 gap-2">
            <div>
              <span className="text-[#EAA823] font-bold text-xs uppercase tracking-wider">Curriculum Preview</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#072d1d]">Available Training Tracks</h2>
            </div>
            <p className="text-xs text-stone-500 max-w-sm">
              Hands-on practical sessions in Woji with ingredients and protective uniforms provided.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COURSES.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-[#072d1d] rounded-2xl shadow-sm group-hover:scale-105 transition-transform">
                      {course.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
                      {course.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#072d1d] leading-snug">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
                    <span>⏱ {course.duration}</span>
                    <span>&bull;</span>
                    <span>🎓 {course.level}</span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <span className="text-[11px] font-bold text-[#072d1d] block">Module Highlights:</span>
                    <ul className="space-y-1.5 text-xs text-stone-600">
                      {course.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <a 
                  href="#enroll-form"
                  onClick={() => setFormData({ ...formData, preferredCourse: course.title })}
                  className="w-full bg-[#072d1d] group-hover:bg-[#EAA823] text-white group-hover:text-[#072d1d] font-bold text-xs py-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 shadow-sm mt-4"
                >
                  <span>Apply for Waitlist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* STUDENT HANDBOOK & ACADEMY GUIDELINES */}
        <section className="bg-[#072d1d] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#EAA823] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Student Policy &amp; Code of Practice
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Training Standards &amp; Safety Guidelines</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-emerald-100/90 leading-relaxed">
            <div className="bg-[#041a11] p-5 rounded-2xl border border-white/10 space-y-2">
              <strong className="text-sm font-bold text-[#EAA823] block">1. Kitchen Safety &amp; Uniforms</strong>
              <p>
                All students must adhere strictly to food hygiene standards, wearing chef hairnets, non-slip footwear, and designated academy aprons at all times during kitchen shifts.
              </p>
            </div>

            <div className="bg-[#041a11] p-5 rounded-2xl border border-white/10 space-y-2">
              <strong className="text-sm font-bold text-[#EAA823] block">2. Practical Attendance</strong>
              <p>
                A minimum of 85% hands-on practical attendance is required to qualify for graduation and receive the verified De-echoi Culinary Master Certificate.
              </p>
            </div>

            <div className="bg-[#041a11] p-5 rounded-2xl border border-white/10 space-y-2">
              <strong className="text-sm font-bold text-[#EAA823] block">3. Registration &amp; Payments</strong>
              <p>
                Seat reservation requires upfront deposit upon cohort opening. Training fees cover raw materials, baking tool kits, recipe manuals, and exam ingredients.
              </p>
            </div>
          </div>
        </section>

        {/* ADMISSION APPLICATION FORM */}
        <section id="enroll-form" className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center scroll-mt-24">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold text-[#EAA823] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Priority Admissions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#072d1d] leading-tight">
              Reserve Your Seat for the Upcoming Cohort.
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Fill out the priority registration form below. Our admissions coordinator will reach out with cohort timetables, syllabus details, and tuition guidance.
            </p>

            <div className="space-y-2.5 pt-2 text-xs font-semibold text-stone-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Small class sizes (maximum 10 students per batch)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lifetime recipe handbook included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Post-training business mentorship &amp; vendor networks</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#F9F6F0] p-6 sm:p-8 rounded-3xl border border-stone-200">
            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-[#072d1d]">Application Received!</h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  Thank you, <strong>{formData.fullName}</strong>. Your priority waitlist application has been registered. Our admissions desk will contact you via WhatsApp and phone shortly.
                </p>
                <Button 
                  onClick={() => setSubmitted(false)}
                  className="bg-[#072d1d] text-white text-xs font-bold px-6 py-2 rounded-xl mt-2 cursor-pointer"
                >
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800">Full Name *</label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Joy Okafor"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-white border-stone-300 text-xs py-2.5 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800">Phone Number (WhatsApp) *</label>
                    <Input
                      type="tel"
                      required
                      placeholder="e.g. 08012345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white border-stone-300 text-xs py-2.5 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800">Email Address *</label>
                  <Input
                    type="email"
                    required
                    placeholder="e.g. joy@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white border-stone-300 text-xs py-2.5 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800">Preferred Track</label>
                    <select
                      value={formData.preferredCourse}
                      onChange={(e) => setFormData({ ...formData, preferredCourse: e.target.value })}
                      className="w-full bg-white border border-stone-300 text-xs p-2.5 rounded-xl text-stone-800 outline-none focus:ring-1 focus:ring-[#EAA823]"
                    >
                      {COURSES.map((c) => (
                        <option key={c.id} value={c.title}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800">Preferred Schedule</label>
                    <select
                      value={formData.sessionType}
                      onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                      className="w-full bg-white border border-stone-300 text-xs p-2.5 rounded-xl text-stone-800 outline-none focus:ring-1 focus:ring-[#EAA823]"
                    >
                      <option value="Weekday Intensive">Weekday Intensive (Mon &ndash; Wed)</option>
                      <option value="Weekend Session">Weekend Track (Saturdays Only)</option>
                      <option value="Private 1-on-1 Coaching">Private 1-on-1 Coaching</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#072d1d] hover:bg-[#EAA823] text-white hover:text-[#072d1d] font-black text-xs py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Submit Priority Registration</span>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}