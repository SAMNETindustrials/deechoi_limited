'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Star, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Loader2, 
  ShieldAlert,
  ShieldCheck,
  Search,
  Check
} from 'lucide-react'

interface ReviewResponse {
  id: string
  review_id: string
  user_name: string
  responseText?: string
  response_text?: string
  is_approved: boolean
  created_at: string
}

interface Review {
  id: string
  order_id?: string
  customer_name: string
  rating: number
  review_text: string
  item_ordered?: string
  created_at: string
  responses?: ReviewResponse[]
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchReviewsWithResponses()
  }, [])

  const fetchReviewsWithResponses = async () => {
    try {
      setLoading(true)
      // Fetch reviews from customer_reviews table
      const { data: revData, error: revError } = await supabase
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (revError) throw revError

      // Fetch all responses from review_responses table
      const { data: respData, error: respError } = await supabase
        .from('review_responses')
        .select('*')
        .order('created_at', { ascending: true })

      if (respError) {
        console.warn('Response fetch note:', respError)
      }

      const formattedResponses = respData || []

      const combined = (revData || []).map((rev) => ({
        ...rev,
        responses: formattedResponses.filter((r: ReviewResponse) => r.review_id === rev.id)
      }))

      setReviews(combined)
    } catch (err) {
      console.error('Error fetching admin reviews:', err)
      alert('Failed to load reviews from database.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review and all its responses?')) return
    try {
      setProcessingId(reviewId)
      // Delete responses first
      await supabase.from('review_responses').delete().eq('review_id', reviewId)
      const { error } = await supabase.from('customer_reviews').delete().eq('id', reviewId)
      if (error) throw error

      setReviews(reviews.filter(r => r.id !== reviewId))
      alert('Review deleted successfully.')
    } catch (err: any) {
      alert(err.message || 'Failed to delete review.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleToggleResponseApproval = async (responseId: string, currentStatus: boolean) => {
    try {
      setProcessingId(responseId)
      const { error } = await supabase
        .from('review_responses')
        .update({ is_approved: !currentStatus })
        .eq('id', responseId)

      if (error) throw error

      setReviews(reviews.map(rev => ({
        ...rev,
        responses: (rev.responses || []).map(resp => 
          resp.id === responseId ? { ...resp, is_approved: !currentStatus } : resp
        )
      })))
    } catch (err: any) {
      alert(err.message || 'Failed to update response approval status.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('Delete this user response?')) return
    try {
      setProcessingId(responseId)
      const { error } = await supabase.from('review_responses').delete().eq('id', responseId)
      if (error) throw error

      setReviews(reviews.map(rev => ({
        ...rev,
        responses: (rev.responses || []).filter(resp => resp.id !== responseId)
      })))
    } catch (err: any) {
      alert(err.message || 'Failed to delete response.')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredReviews = reviews.filter(rev => 
    rev.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rev.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rev.item_ordered?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      <div className="bg-white border-b border-gray-200 p-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-[#EAA823]" />
              Customer Reviews &amp; Response Moderation
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Moderate customer reviews from database, delete spam, and approve or reject community responses before they go live on the storefront.
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="gap-2 font-bold border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, item, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-10 pr-4 py-2.5 border border-gray-300 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#0A2E1D]"
            />
          </div>
          <span className="text-xs font-bold text-gray-500">
            Total Reviews: {reviews.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0A2E1D]" />
            <p className="text-xs font-bold text-gray-500 mt-2">Loading reviews and responses from database...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-3xl p-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-800 font-bold">No customer reviews found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-[#0A2E1D]">{rev.customer_name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                        Item: {rev.item_ordered || 'Delicious Meal'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">Submitted on {new Date(rev.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-4 h-4 ${s <= rev.rating ? 'fill-[#EAA823] text-[#EAA823]' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processingId === rev.id}
                      onClick={() => handleDeleteReview(rev.id)}
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs h-8 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Review
                    </Button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-800 font-medium bg-gray-50/80 p-4 rounded-2xl border border-gray-200/60">
                  &ldquo;{rev.review_text}&rdquo;
                </p>

                {/* Responses Moderation Section */}
                <div className="pt-2 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#EAA823]" />
                    User Responses ({rev.responses?.length || 0})
                  </h4>

                  {(!rev.responses || rev.responses.length === 0) ? (
                    <p className="text-[11px] text-gray-400 italic">No community responses submitted for this review yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {rev.responses.map((resp: ReviewResponse) => {
                        const isApproved = resp.is_approved
                        const txt = resp.responseText || resp.response_text || ''

                        return (
                          <div 
                            key={resp.id} 
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isApproved ? 'bg-emerald-50/30 border-emerald-200' : 'bg-amber-50/40 border-amber-200'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-[#0A2E1D]">{resp.user_name}</span>
                                {isApproved ? (
                                  <span className="text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Approved (Public)
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" /> Pending Approval
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">{txt}</p>
                              <span className="text-[10px] text-gray-400">{new Date(resp.created_at).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <Button
                                size="sm"
                                disabled={processingId === resp.id}
                                onClick={() => handleToggleResponseApproval(resp.id, isApproved)}
                                className={`text-xs h-8 font-bold cursor-pointer ${
                                  isApproved 
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                {isApproved ? 'Reject / Hide' : 'Approve for Public'}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={processingId === resp.id}
                                onClick={() => handleDeleteResponse(resp.id)}
                                className="text-red-500 border-red-200 hover:bg-red-50 text-xs h-8 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}