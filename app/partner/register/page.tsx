'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Store, Mail, Phone, MapPin, User, CheckCircle2, Loader2, ArrowRight, 
  Lock, ArrowLeft, FileText, Upload, ShieldCheck, Check, Clock, AlertCircle, Save 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StorefrontHeader } from '@/components/storefront/header'

// All 36 Nigerian States list
const NIGERIAN_STATES = [
  { name: 'Bayelsa State', active: true, desc: 'Yenagoa / Otuoke (Active Hub)' },
  { name: 'Abia State', active: false },
  { name: 'Adamawa State', active: false },
  { name: 'Akwa Ibom State', active: false },
  { name: 'Anambra State', active: false },
  { name: 'Bauchi State', active: false },
  { name: 'Benue State', active: false },
  { name: 'Borno State', active: false },
  { name: 'Cross River State', active: false },
  { name: 'Delta State', active: false },
  { name: 'Ebonyi State', active: false },
  { name: 'Edo State', active: false },
  { name: 'Ekiti State', active: false },
  { name: 'Enugu State', active: false },
  { name: 'FCT Abuja', active: false },
  { name: 'Gombe State', active: false },
  { name: 'Imo State', active: false },
  { name: 'Jigawa State', active: false },
  { name: 'Kaduna State', active: false },
  { name: 'Kano State', active: false },
  { name: 'Katsina State', active: false },
  { name: 'Kebbi State', active: false },
  { name: 'Kogi State', active: false },
  { name: 'Kwara State', active: false },
  { name: 'Lagos State', active: false },
  { name: 'Nasarawa State', active: false },
  { name: 'Niger State', active: false },
  { name: 'Ogun State', active: false },
  { name: 'Ondo State', active: false },
  { name: 'Osun State', active: false },
  { name: 'Oyo State', active: false },
  { name: 'Plateau State', active: false },
  { name: 'Rivers State', active: false },
  { name: 'Sokoto State', active: false },
  { name: 'Taraba State', active: false },
  { name: 'Yobe State', active: false },
  { name: 'Zamfara State', active: false }
]

export default function PartnerRegisterPage() {
  const [viewMode, setViewMode] = useState<'auth_landing' | 'signup_wizard' | 'pending_dashboard'>('auth_landing')
  const [authType, setAuthType] = useState<'login' | 'signup'>('login')
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    password: '',
    phone: '',
    state: 'Bayelsa State',
    city: 'Yenagoa',
    address: '',
    experience: '',
    ninNumber: '',
    profilePicUrl: '',
    idCardUrl: '',
    signatureUrl: '',
    termsAccepted: false
  })

  const [submitting, setSubmitting] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<string>('pending_approval')
  const [userEmail, setUserEmail] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  // Initial Session Check
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
        const { data: partnerData } = await supabase
          .from('partners')
          .select('*')
          .ilike('email', session.user.email)
          .maybeSingle()

        if (partnerData) {
          setApplicationStatus(partnerData.status)
          if (partnerData.status === 'approved') {
            router.push('/partner/dashboard')
          } else {
            setFormData(prev => ({
              ...prev,
              businessName: partnerData.business_name || '',
              contactName: partnerData.contact_name || '',
              email: partnerData.email || session.user.email || '',
              phone: partnerData.phone || '',
              state: partnerData.state || 'Bayelsa State',
              city: partnerData.city || 'Yenagoa',
              address: partnerData.address || '',
              experience: partnerData.experience || '',
              ninNumber: partnerData.nin_number || ''
            }))

            if (partnerData.status === 'pending_approval' || partnerData.status === 'fully_submitted') {
              setViewMode('pending_dashboard')
            }
          }
        }
      }
    }
    checkExistingSession()
  }, [supabase, router])

  // Real-time Supabase Subscription to reflect admin approval instantly
  useEffect(() => {
    if (viewMode !== 'pending_dashboard' || !userEmail) return

    const channel = supabase
      .channel('partner-status-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partners',
          filter: `email=eq.${userEmail}`
        },
        (payload: any) => {
          const updatedPartner = payload.new
          if (updatedPartner && updatedPartner.status === 'approved') {
            setApplicationStatus('approved')
            router.push('/partner/dashboard')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [viewMode, userEmail, supabase, router])

  const handleStateChange = (selectedState: string) => {
    const target = NIGERIAN_STATES.find(s => s.name === selectedState)
    if (target && !target.active) {
      alert(`De-echoi Hub Partner expansion to ${selectedState} is Coming Soon! Currently, only Bayelsa State is active for selection.`)
      return
    }
    setFormData(prev => ({ ...prev, state: selectedState }))
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      if (error) throw error

      setUserEmail(formData.email)

      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .ilike('email', formData.email)
        .maybeSingle()

      if (partnerData?.status === 'approved') {
        router.push('/partner/dashboard')
      } else {
        if (partnerData) {
          setFormData(prev => ({
            ...prev,
            businessName: partnerData.business_name || '',
            contactName: partnerData.contact_name || '',
            phone: partnerData.phone || '',
            state: partnerData.state || 'Bayelsa State',
            city: partnerData.city || 'Yenagoa',
            address: partnerData.address || '',
            experience: partnerData.experience || '',
            ninNumber: partnerData.nin_number || ''
          }))
        }
        setViewMode('pending_dashboard')
      }
    } catch (err: any) {
      alert(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'profilePicUrl' | 'idCardUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setFormData(prev => ({ ...prev, [fieldName]: previewUrl }))
  }

  const handleSaveForLater = async () => {
    if (!formData.email || !formData.businessName) {
      alert('Please enter at least your Business Name and Email Address to save your progress.')
      return
    }

    setSavingProgress(true)
    try {
      await supabase.auth.signUp({
        email: formData.email,
        password: formData.password || 'password123'
      })

      const { error } = await supabase.from('partners').upsert([
        {
          business_name: formData.businessName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          state: formData.state,
          city: formData.city,
          address: formData.address,
          experience: formData.experience,
          nin_number: formData.ninNumber,
          status: 'draft'
        }
      ], { onConflict: 'email' })

      if (error) throw error

      setUserEmail(formData.email)
      alert('Your application progress has been saved securely! You can log in anytime using your email and password to continue.')
      setViewMode('auth_landing')
    } catch (err: any) {
      console.error('Save progress error details:', err)
      const errorMsg = err?.message || err?.error_description || JSON.stringify(err)
      alert(`Could not save progress: ${errorMsg}`)
    } finally {
      setSavingProgress(false)
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.termsAccepted) {
      alert('You must accept the terms and conditions and provide your signature.')
      return
    }

    setSubmitting(true)

    try {
      await supabase.auth.signUp({
        email: formData.email,
        password: formData.password || 'password123'
      })

      const { error } = await supabase.from('partners').upsert([
        {
          business_name: formData.businessName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          state: formData.state,
          city: formData.city,
          address: formData.address,
          experience: formData.experience,
          nin_number: formData.ninNumber,
          status: 'pending_approval'
        }
      ], { onConflict: 'email' })

      if (error) throw error

      setUserEmail(formData.email)

      // Dispatch custom Gmail confirmation email & Telegram notification
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          partner: {
            business_name: formData.businessName,
            contact_name: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            state: formData.state,
            city: formData.city,
            address: formData.address,
            nin_number: formData.ninNumber
          }
        })
      })

      setViewMode('pending_dashboard')
    } catch (err: any) {
      console.error('Partner registration error details:', err)
      const errorMsg = err?.message || err?.error_description || JSON.stringify(err)
      alert(`Could not submit partner application: ${errorMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-slate-900 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full flex flex-col justify-center">
        
        {/* VIEW 1: AUTH LANDING */}
        {viewMode === 'auth_landing' && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden max-w-md mx-auto w-full">
            <div className="bg-[#072d1d] text-white p-8 text-center relative">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                <Store className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-amber-300">De-echoi Hub Portal</h1>
              <p className="text-xs text-gray-300 mt-1">Access your regional kitchen partner account or register</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex bg-stone-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAuthType('login')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${authType === 'login' ? 'bg-[#072d1d] text-amber-300 shadow-sm' : 'text-stone-600 hover:text-slate-900'}`}
                >
                  Partner Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('signup')
                    setViewMode('signup_wizard')
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${authType === 'signup' ? 'bg-[#072d1d] text-amber-300 shadow-sm' : 'text-stone-600 hover:text-slate-900'}`}
                >
                  New Partner Sign Up
                </button>
              </div>

              {authType === 'login' && (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Email Address</label>
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3">
                      <Mail className="w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        placeholder="partner@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-transparent outline-none text-xs text-slate-800 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Password</label>
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3">
                      <Lock className="w-4 h-4 text-stone-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="bg-transparent outline-none text-xs text-slate-800 w-full"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-amber-300 font-black py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In / Resume Registration'}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <p className="text-xs text-stone-500">
                  Want to register a new hub station?{' '}
                  <button
                    type="button"
                    onClick={() => setViewMode('signup_wizard')}
                    className="text-amber-700 font-black hover:underline cursor-pointer"
                  >
                    Click here to Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SIGNUP WIZARD */}
        {viewMode === 'signup_wizard' && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
            
            <div className="bg-[#072d1d] text-white p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={() => setViewMode('auth_landing')}
                className="absolute top-6 left-6 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>

              <div className="text-center max-w-lg mx-auto mt-4">
                <h1 className="text-xl sm:text-2xl font-black text-amber-300">Partner Hub Registration Wizard</h1>
                <p className="text-xs text-gray-300 mt-1">Complete your kitchen profile, KYC verification, and signed agreement.</p>
                
                {/* Progress Tabs */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {[
                    { step: 1, label: 'Business & Location' },
                    { step: 2, label: 'KYC & Identity' },
                    { step: 3, label: 'Terms & Signature' }
                  ].map((tab) => (
                    <div
                      key={tab.step}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                        currentStep === tab.step
                          ? 'bg-amber-500 text-[#072d1d]'
                          : currentStep > tab.step
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">{tab.step}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={currentStep === 3 ? handleFinalSubmit : (e) => { e.preventDefault(); setCurrentStep(prev => prev + 1); }} className="p-6 sm:p-10 space-y-6">
              
              {/* STEP 1: BUSINESS & LOCATION */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-black text-[#072d1d] uppercase tracking-wider">Step 1: Business &amp; Account Details</h3>
                    <button
                      type="button"
                      onClick={handleSaveForLater}
                      disabled={savingProgress}
                      className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer"
                    >
                      {savingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save &amp; Continue Later
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Business / Kitchen Name</label>
                      <input
                        type="text"
                        placeholder="e.g. De-echoi Yenagoa Station"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Contact Person Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Samuel David"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Email Address (For Login)</label>
                      <input
                        type="email"
                        placeholder="partner@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Portal Password</label>
                      <input
                        type="password"
                        placeholder="Create secure password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="08012345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">State of Operation (Bayelsa Active)</label>
                      <select
                        value={formData.state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full font-bold cursor-pointer"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st.name} value={st.name}>
                            {st.name} {st.active ? '(Active)' : '(Coming Soon)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">City / Town</label>
                      <input
                        type="text"
                        placeholder="e.g. Yenagoa"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Physical Kitchen / Hub Address</label>
                      <input
                        type="text"
                        placeholder="Street address for dispatch"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Brief Culinary Experience</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about your culinary background..."
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="bg-stone-50 border border-stone-200 rounded-2xl p-4 outline-none text-xs text-slate-800 w-full resize-none"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={handleSaveForLater}
                      disabled={savingProgress}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-5 py-3.5 rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      {savingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save &amp; Continue Later
                    </button>
                    <button
                      type="submit"
                      className="bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-amber-300 font-black px-6 py-3.5 rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      Next: KYC &amp; Identity <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: KYC & IDENTITY VERIFICATION */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-black text-[#072d1d] uppercase tracking-wider">Step 2: KYC &amp; Government Identification</h3>
                    <button
                      type="button"
                      onClick={handleSaveForLater}
                      disabled={savingProgress}
                      className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer"
                    >
                      {savingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save &amp; Continue Later
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">National Identification Number (NIN)</label>
                      <input
                        type="text"
                        placeholder="Enter 11-digit NIN number"
                        value={formData.ninNumber}
                        onChange={(e) => setFormData({ ...formData, ninNumber: e.target.value })}
                        required
                        maxLength={11}
                        className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 outline-none text-xs text-slate-800 w-full font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Profile Picture Upload</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 bg-stone-50 border border-dashed border-stone-300 hover:border-amber-500 rounded-2xl px-4 py-3 text-xs text-stone-600 flex items-center justify-center gap-2 cursor-pointer transition">
                          <Upload className="w-4 h-4 text-amber-600" />
                          <span>{formData.profilePicUrl ? 'Change Photo' : 'Upload Passport Photo'}</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'profilePicUrl')} className="hidden" />
                        </label>
                        {formData.profilePicUrl && (
                          <img src={formData.profilePicUrl} alt="Preview" className="w-10 h-10 rounded-xl object-cover border" />
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">National ID Card / Driver&apos;s License Upload</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 bg-stone-50 border border-dashed border-stone-300 hover:border-amber-500 rounded-2xl px-4 py-4 text-xs text-stone-600 flex items-center justify-center gap-2 cursor-pointer transition">
                          <Upload className="w-4 h-4 text-amber-600" />
                          <span>{formData.idCardUrl ? 'ID Card Uploaded Successfully' : 'Upload Valid Government ID Scan'}</span>
                          <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'idCardUrl')} className="hidden" />
                        </label>
                        {formData.idCardUrl && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold px-6 py-3.5 rounded-2xl text-xs transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-amber-300 font-black px-6 py-3.5 rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      Next: Terms &amp; Signature <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: TERMS & SIGNATURE */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-black text-[#072d1d] uppercase tracking-wider">Step 3: Partnership Agreement &amp; Signature</h3>
                    <button
                      type="button"
                      onClick={handleSaveForLater}
                      disabled={savingProgress}
                      className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer"
                    >
                      {savingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save &amp; Continue Later
                    </button>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-xs text-stone-700 space-y-3 max-h-60 overflow-y-auto leading-relaxed">
                    <h4 className="font-black text-[#072d1d] uppercase">De-echoi Limited Hub Franchise &amp; Operations Agreement</h4>
                    <p>
                      1. <strong>Quality Standards:</strong> The Partner agrees to strictly maintain De-echoi culinary recipes, hygiene standards, and packaging protocols for all menu items.
                    </p>
                    <p>
                      2. <strong>Revenue Split:</strong> Gross hub sales revenue will be settled on a 70% Partner / 30% De-echoi HQ split, calculated weekly.
                    </p>
                    <p>
                      3. <strong>Compliance:</strong> The Partner warrants that all provided KYC information, NIN verification, and licenses are authentic and legally binding.
                    </p>

                    <div className="mt-4 pt-4 border-t border-stone-200 flex items-end justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Partner Authorized Signature:</p>
                        <p className="text-[10px] text-stone-500">{formData.contactName || 'Representative'} ({formData.businessName || 'Hub Station'})</p>
                      </div>
                      <div className="h-16 w-40 border-b-2 border-stone-400 flex items-center justify-center relative bg-white rounded-t-xl overflow-hidden shadow-inner">
                        {formData.signatureUrl ? (
                          <img src={formData.signatureUrl} alt="Signature Appended" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">Upload signature below</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Upload Signature Image (PNG/JPEG)</label>
                      <label className="bg-stone-50 border border-dashed border-stone-300 hover:border-amber-500 rounded-2xl px-4 py-3 text-xs text-stone-600 flex items-center justify-center gap-2 cursor-pointer transition">
                        <Upload className="w-4 h-4 text-amber-600" />
                        <span>{formData.signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signatureUrl')} className="hidden" />
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={formData.termsAccepted}
                        onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                        className="w-4 h-4 accent-[#072d1d] cursor-pointer"
                        required
                      />
                      <label htmlFor="terms" className="text-xs font-bold text-stone-700 cursor-pointer">
                        I have read, understood, and accept the De-echoi Hub Partner Terms &amp; Conditions.
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold px-6 py-3.5 rounded-2xl text-xs transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !formData.signatureUrl || !formData.termsAccepted}
                      className="bg-[#072d1d] hover:bg-amber-500 hover:text-[#072d1d] text-amber-300 font-black px-8 py-3.5 rounded-2xl text-xs transition flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application & Sign'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}

        {/* VIEW 3: PENDING APPROVAL DASHBOARD */}
        {viewMode === 'pending_dashboard' && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden max-w-xl mx-auto w-full p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <span className="bg-amber-500/20 text-amber-800 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-amber-500/30">
                Application Pending Review
              </span>
              <h2 className="text-2xl font-black text-[#072d1d]">Welcome, {formData.businessName || 'Partner'}</h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Your partnership application, KYC documents, and signed agreement have been submitted successfully. Our executive team at De-echoi HQ is currently reviewing your station details. This page will update automatically in real time once approved!
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Registered Email:</span>
                <span className="font-bold text-slate-900">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Assigned Hub Location:</span>
                <span className="font-bold text-slate-900">{formData.city}, {formData.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Real-Time Status:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> Listening for admin approval...
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  setViewMode('auth_landing')
                }}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-6 py-3 rounded-2xl text-xs transition cursor-pointer"
              >
                Log Out / Switch Account
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}