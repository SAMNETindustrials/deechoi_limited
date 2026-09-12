'use client'

import React from 'react'
import Link from 'next/link'
import { StorefrontHeader } from '@/components/storefront/header'
import { 
  GraduationCap, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  BookOpen, 
  ChefHat, 
  Award, 
  Flame, 
  Utensils, 
  Cake, 
  ArrowRight,
  Check,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16 selection:bg-[#EAA823] selection:text-[#072d1d]">
      <StorefrontHeader />

      {/* HERO SECTION WITH REGISTRATION & VERIFY CERTIFICATE BUTTONS */}
      <section className="relative overflow-hidden bg-[#072d1d] text-white pt-10 pb-16 lg:pb-24 border-b border-[#EAA823]/30">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EAA823_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-[#EAA823] text-[#072d1d] font-black text-xs uppercase px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Cohorts Opening Soon</span>
              </span>
              <span className="bg-white/10 text-emerald-100 text-xs px-3 py-1.5 rounded-full border border-white/15">
                Woji, Port Harcourt &bull; Practical Hands-On
              </span>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/verify-certificate">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#EAA823]" />
                  Verify Certificate
                </Button>
              </Link>

              <Link href="/training/register">
                <Button className="bg-[#EAA823] hover:bg-[#f5d547] text-[#072d1d] font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5">
                  <span>Register for Course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
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

                <Link 
                  href="/training/register"
                  className="w-full bg-[#072d1d] group-hover:bg-[#EAA823] text-white group-hover:text-[#072d1d] font-bold text-xs py-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 shadow-sm mt-4"
                >
                  <span>Apply for Waitlist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
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
      </main>
    </div>
  )
}