'use client'

import { useEffect, useState } from 'react'
import { Star, CheckCircle2, MessageSquare, Quote, CornerDownRight, ShieldCheck, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

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
  customer_name: string
  rating: number
  review_text: string
  item_ordered?: string
  is_verified?: boolean
  created_at: string
  responses?: ReviewResponse[]
}

export function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReviewModal, setSelectedReviewModal] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [customerSession, setCustomerSession] = useState<{ email?: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
    try {
      const stored = localStorage.getItem('deechoi_customer_session')
      if (stored) setCustomerSession(JSON.parse(stored))
    } catch (e) {
      console.warn('Session load note:', e)
    }
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reviews')
      const data = await res.json()
      if (Array.isArray(data)) {
        setReviews(data.slice(0, 8))
      } else {
        // Fallback to supabase direct query if api returns unexpected format
        const { data: directData, error } = await supabase
          .from('customer_reviews')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8)
        if (!error && directData) setReviews(directData)
      }
    } catch (e) {
      console.warn('Could not fetch reviews:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleReplyToReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReviewModal || !replyText.trim()) return

    try {
      setSubmittingReply(true)
      const currentUserName = customerSession?.email ? customerSession.email.split('@')[0] : 'Community Member'

      const res = await fetch('/api/reviews/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReviewModal.id,
          userName: currentUserName,
          responseText: replyText.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to submit response')
      setReplyText('')
      alert('Your response has been submitted! It will appear publicly once approved by our admin team.')
      fetchReviews()
      setSelectedReviewModal(null)
    } catch (err: any) {
      alert(err.message || 'Failed to submit response.')
    } finally {
      setSubmittingReply(false)
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '4.9'

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>Customer Love &amp; Reviews</span>
            <span className="bg-amber-100 text-[#072d1d] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ★ {averageRating} / 5.0
            </span>
          </h2>
          <p className="text-[11px] text-slate-500">Verified feedback from Port Harcourt food lovers. Click any review to view full replies.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-slate-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700">Be the first to review!</p>
          <p className="text-[11px] text-slate-400">Complete an order to share your feedback with our kitchen.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
          {reviews.map((r) => {
            const approvedCount = (r.responses || []).filter(resp => resp.is_approved).length

            return (
              <div
                key={r.id}
                onClick={() => setSelectedReviewModal(r)}
                className="flex-shrink-0 w-64 bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs space-y-2.5 flex flex-col justify-between cursor-pointer hover:border-amber-400 transition group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    {r.is_verified !== false && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed italic">
                    &ldquo;{r.review_text}&rdquo;
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800 truncate max-w-[120px] group-hover:text-amber-600 transition">
                      {r.customer_name}
                    </span>
                    {r.item_ordered && (
                      <span className="text-amber-700 font-semibold truncate max-w-[100px]">
                        {r.item_ordered}
                      </span>
                    )}
                  </div>
                  {approvedCount > 0 && (
                    <div className="text-[9px] text-amber-600 font-bold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {approvedCount} approved repl{approvedCount !== 1 ? 'ies' : 'y'} (Click to view)
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Complete Review & Replies Modal - Centered, dynamic, and non-overlapping header */}
      {selectedReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto pt-24 pb-8">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 my-auto max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#EAA823]" />
                <h3 className="font-extrabold text-sm text-[#0A2E1D]">Review &amp; Conversation</h3>
              </div>
              <button
                onClick={() => setSelectedReviewModal(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Review Details */}
            <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/60">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-[#0A2E1D]">{selectedReviewModal.customer_name}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Item: <span className="font-bold text-gray-600">{selectedReviewModal.item_ordered || 'Delicious Meal'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-3.5 h-3.5 ${s <= selectedReviewModal.rating ? 'fill-[#EAA823] text-[#EAA823]' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                &ldquo;{selectedReviewModal.review_text}&rdquo;
              </p>
            </div>

            {/* Approved Replies Thread */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#EAA823]" />
                Community Replies
              </h4>

              {(() => {
                const approvedResponses = (selectedReviewModal.responses || []).filter(r => r.is_approved)
                if (approvedResponses.length === 0) {
                  return (
                    <p className="text-[11px] text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center">
                      No replies yet. Be the first to respond below!
                    </p>
                  )
                }

                return (
                  <div className="space-y-2 pl-2 border-l-2 border-[#EAA823] max-h-36 overflow-y-auto no-scrollbar">
                    {approvedResponses.map((resp) => (
                      <div key={resp.id} className="bg-gray-50/80 p-3 rounded-xl border border-gray-200/60 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-[#0A2E1D] flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-[#EAA823]" />
                            {resp.user_name}
                          </span>
                          <span className="text-[8px] text-gray-400">{new Date(resp.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-gray-700 pl-3">{resp.responseText || resp.response_text}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleReplyToReview} className="pt-2 border-t border-gray-100 space-y-2.5">
              <label className="block text-[11px] font-bold text-gray-700 uppercase">
                Add Your Reply:
              </label>
              <textarea
                rows={2}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your friendly response..."
                className="w-full text-xs bg-[#FDFBF7] border border-gray-200 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#0A2E1D]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReviewModal(null)}
                  className="text-[11px] font-bold py-2 px-4 rounded-xl border-gray-200 cursor-pointer h-8"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold text-[11px] py-2 px-4 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 h-8"
                >
                  {submittingReply ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Quote className="w-3.5 h-3.5 text-[#EAA823]" />
                      <span>Submit Reply</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </section>
  )
}