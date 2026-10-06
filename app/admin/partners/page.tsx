'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Store, CheckCircle2, XCircle, Mail, Phone, MapPin, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PartnerApplication {
  id: string
  business_name: string
  contact_name: string
  email: string
  phone: string
  state: string
  city: string
  address: string
  status: string
  created_at: string
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPartners(data || [])
    } catch (err) {
      console.error('Error fetching partner applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (partner: PartnerApplication, newStatus: 'approved' | 'rejected') => {
    setProcessingId(partner.id)
    try {
      const { error } = await supabase
        .from('partners')
        .update({ status: newStatus })
        .eq('id', partner.id)

      if (error) throw error

      if (newStatus === 'approved') {
        // Send approval welcome email
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: partner.email,
            subject: 'Welcome to De-echoi Limited! Partnership Approved',
            message: `Hello ${partner.contact_name},\n\nCongratulations! Your partnership application for ${partner.business_name} in ${partner.state} (${partner.city}) has been approved by De-echoi Limited.\n\nYou can now log into your Partner Performance Dashboard to track live orders, menu sales velocity, and revenue splits.\n\nWelcome to the De-echoi family!`
          })
        })
      }

      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, status: newStatus } : p))
      alert(`Partner ${newStatus} successfully!`)
    } catch (err) {
      console.error('Error updating partner status:', err)
      alert('Failed to update partner status.')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center text-amber-400 font-bold">
        Loading Partner Applications...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#EAA823]">Partner Management &amp; Approvals</h1>
              <p className="text-xs text-gray-400">Review and approve regional hub partner applications</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {partners.length === 0 ? (
            <div className="bg-[#1a1f2e] p-12 text-center rounded-3xl text-gray-400 border border-white/5">
              No partner applications submitted yet.
            </div>
          ) : (
            partners.map((partner) => (
              <div key={partner.id} className="bg-[#1a1f2e] p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#EAA823]" />
                    <h3 className="font-black text-base text-white">{partner.business_name}</h3>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      partner.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      partner.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}>
                      {partner.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-300">
                    <p className="flex items-center gap-1.5"><span className="text-gray-500">Contact:</span> {partner.contact_name}</p>
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#EAA823]" /> {partner.email}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#EAA823]" /> {partner.phone}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#EAA823]" /> {partner.city}, {partner.state}</p>
                  </div>
                  <p className="text-xs text-gray-400 italic">Address: {partner.address}</p>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {partner.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(partner, 'approved')}
                      disabled={processingId === partner.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition shadow-md"
                    >
                      {processingId === partner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </button>
                  )}

                  {partner.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(partner, 'rejected')}
                      disabled={processingId === partner.id}
                      className="bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}